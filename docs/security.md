# Security Documentation

## Overview

RoomX implements multiple layers of security to protect user data, prevent unauthorized access, and ensure safe real-time collaboration.

## Table of Contents

- [Authentication & Authorization](#authentication--authorization)
- [Data Protection](#data-protection)
- [API Security](#api-security)
- [Real-time Security](#real-time-security)
- [File Storage Security](#file-storage-security)
- [Input Validation](#input-validation)
- [Rate Limiting](#rate-limiting)
- [Security Best Practices](#security-best-practices)

---

## Authentication & Authorization

### JWT Implementation

RoomX uses JSON Web Tokens (JWT) for stateless authentication:

```
┌─────────────────────────────────────────────────┐
│                JWT Token Flow                    │
├─────────────────────────────────────────────────┤
│                                                  │
│  Client                  Server                  │
│    │                       │                    │
│    │── Login Request ────>│                    │
│    │                       │                    │
│    │<── Set-Cookie ───────│ (HTTP-only)        │
│    │    (access_token)    │                    │
│    │                       │                    │
│    │── Request + Cookie ─>│                    │
│    │                       │                    │
│    │<── Response ─────────│                    │
│    │                       │                    │
└─────────────────────────────────────────────────┘
```

### Token Configuration

| Token Type | Lifetime | Storage | Purpose |
|------------|----------|---------|---------|
| Access Token | 15 minutes | HTTP-only cookie | API authentication |
| Refresh Token | 7 days | Supabase managed | Token renewal |

### Authorization Levels

| Role | Permissions |
|------|-------------|
| Guest | View public rooms |
| Member | Join rooms, send messages, share screen |
| Admin | Manage room settings, remove participants |
| Owner | Delete room, manage members, transfer ownership |

### Row Level Security (RLS)

All database tables have RLS policies:

```sql
-- Example: Users can only see their own data
CREATE POLICY "Users see own profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Example: Room members can see room data
CREATE POLICY "Room members access" ON rooms
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM room_participants
      WHERE room_id = rooms.id
      AND user_id = auth.uid()
    )
  );
```

---

## Data Protection

### Encryption

| Layer | Method | Details |
|-------|--------|---------|
| Transit | TLS 1.3 | All HTTPS/WSS connections |
| At Rest | AES-256 | Supabase managed encryption |
| Secrets | Environment variables | Never in code |

### Data Classification

| Data Type | Sensitivity | Storage | Retention |
|-----------|-------------|---------|-----------|
| User credentials | High | Supabase Auth | Until deletion |
| Personal info | Medium | PostgreSQL | Until deletion |
| Chat messages | Medium | PostgreSQL | 90 days |
| Room files | Medium | Supabase Storage | Until room deletion |
| Analytics | Low | Local | 30 days |

### Backup Strategy

- **Database**: Daily automated backups via Supabase
- **Files**: Replicated across availability zones
- **Code**: Git version control with GitHub

---

## API Security

### Endpoint Protection

All API endpoints are protected with:

```typescript
// Middleware chain
app.use(corsMiddleware);
app.use(rateLimiter);
app.use(authMiddleware);
app.use(validationMiddleware);
```

### Request Validation

Every request is validated using Zod schemas:

```typescript
const createRoomSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  maxParticipants: z.number().min(2).max(10),
});
```

### CORS Configuration

```typescript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

### Security Headers

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'; ...
```

---

## Real-time Security

### Socket.IO Authentication

Every WebSocket connection is authenticated:

```typescript
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  const user = await verifyToken(token);
  if (!user) return next(new Error('Unauthorized'));
  socket.data.user = user;
  next();
});
```

### Room Access Control

```typescript
socket.on('join-room', async (roomId) => {
  // Verify user is a room member
  const isMember = await checkRoomMembership(roomId, socket.data.user.id);
  if (!isMember) return socket.emit('error', 'Access denied');
  
  // Check participant limit
  const participantCount = await getRoomParticipantCount(roomId);
  if (participantCount >= MAX_PARTICIPANTS) {
    return socket.emit('error', 'Room is full');
  }
  
  socket.join(roomId);
});
```

### Message Validation

All real-time messages are validated and sanitized:

```typescript
socket.on('send-message', async (data) => {
  // Validate schema
  const validated = messageSchema.parse(data);
  
  // Sanitize content
  const sanitized = sanitizeHtml(validated.content);
  
  // Rate limit check
  if (isRateLimited(socket.data.user.id)) {
    return socket.emit('error', 'Rate limit exceeded');
  }
  
  // Broadcast to room
  io.to(roomId).emit('new-message', {
    ...validated,
    content: sanitized,
    userId: socket.data.user.id,
    timestamp: Date.now(),
  });
});
```

### WebRTC Security

- **Signaling**: Encrypted via Socket.IO
- **Media**: DTLS/SRTP encryption
- **STUN/TURN**: Authentication required
- **ICE Candidates**: Validated before relay

---

## File Storage Security

### Upload Validation

```typescript
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/gif', 'image/webp',
  'application/pdf',
  'text/plain', 'text/markdown',
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

async function validateUpload(file: File) {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error('File type not allowed');
  }
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('File too large');
  }
}
```

### Access Control

```
┌─────────────────────────────────────────────────┐
│             File Access Flow                     │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Client requests upload URL                   │
│           │                                      │
│           ▼                                      │
│  2. Server validates user + room membership      │
│           │                                      │
│           ▼                                      │
│  3. Server generates signed URL (15 min TTL)     │
│           │                                      │
│           ▼                                      │
│  4. Client uploads directly to storage           │
│           │                                      │
│           ▼                                      │
│  5. Storage validates file type + size           │
│           │                                      │
│           ▼                                      │
│  6. File accessible only by room members         │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Signed URLs

- **TTL**: 15 minutes
- **Scope**: Single file operation
- **Refresh**: Required for each operation

---

## Input Validation

### Client-Side Validation

```typescript
// Form validation with Zod
const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});

// Real-time validation
const messageSchema = z.object({
  content: z.string().min(1).max(1000),
  type: z.enum(['text', 'file', 'system']),
});
```

### Server-Side Validation

```typescript
// Express middleware
const validate = (schema: ZodSchema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return res.status(400).json({ errors: result.error.flatten() });
  }
  req.body = result.data;
  next();
};
```

### Sanitization

```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize user content
const clean = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
  ALLOWED_ATTR: ['href'],
});
```

---

## Rate Limiting

### Configuration

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 5 requests | 15 minutes |
| API (general) | 100 requests | 1 minute |
| File upload | 10 requests | 1 minute |
| WebSocket messages | 30 messages | 1 second |

### Implementation

```typescript
const rateLimiter = new RateLimiter({
  store: new MemoryStore(),
  keyPrefix: 'rl',
  points: 100,
  duration: 60,
  blockDuration: 300,
});
```

### Progressive Enforcement

1. **Warning**: At 80% of limit
2. **Soft Block**: At 100% (429 response)
3. **Hard Block**: At 150% (5 minute ban)
4. **Account Review**: At 300% (manual review)

---

## Security Best Practices

### For Developers

1. **Never commit secrets**
   ```bash
   # .gitignore
   .env
   .env.local
   .env.*.local
   ```

2. **Use environment variables**
   ```typescript
   // ✅ Correct
   const supabaseUrl = process.env.SUPABASE_URL;
   
   // ❌ Wrong
   const supabaseUrl = 'https://xyz.supabase.co';
   ```

3. **Validate all inputs**
   ```typescript
   // Always validate, never trust client data
   const userId = req.params.id;
   if (!isValidUUID(userId)) {
     return res.status(400).json({ error: 'Invalid user ID' });
   }
   ```

4. **Use parameterized queries**
   ```typescript
   // ✅ Correct
   const { data } = await supabase
     .from('users')
     .select('*')
     .eq('id', userId);
   
   // ❌ Wrong (SQL injection risk)
   const query = `SELECT * FROM users WHERE id = '${userId}'`;
   ```

5. **Implement proper error handling**
   ```typescript
   // Don't expose internal errors
   try {
     await riskyOperation();
   } catch (error) {
     console.error('Internal error:', error);
     res.status(500).json({ error: 'Internal server error' });
   }
   ```

### For Users

1. **Use strong passwords**
   - Minimum 12 characters
   - Mix of uppercase, lowercase, numbers, symbols
   - Unique per service

2. **Enable 2FA** (when available)

3. **Be cautious with file uploads**
   - Only upload trusted files
   - Scan files before sharing

4. **Report suspicious activity**
   - Unusual login locations
   - Unexpected room invitations
   - Spam or harassment

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| P0 | Data breach, system compromise | Immediate |
| P1 | Authentication bypass | 1 hour |
| P2 | Authorization flaw | 4 hours |
| P3 | Information disclosure | 24 hours |
| P4 | Minor security issue | 1 week |

### Response Steps

1. **Identify**: Detect and confirm the issue
2. **Contain**: Limit the impact
3. **Eradicate**: Remove the threat
4. **Recover**: Restore normal operations
5. **Learn**: Document and improve

### Contact

For security vulnerabilities, email: security@roomx.app

---

## Compliance

### Data Privacy

- **GDPR**: Right to deletion, data portability
- **CCPA**: Consumer privacy rights
- **COPPA**: No users under 13

### Auditing

- Regular dependency audits (`pnpm audit`)
- Quarterly security reviews
- Annual penetration testing (planned)

---

## Security Checklist

### Pre-Deployment

- [ ] All secrets in environment variables
- [ ] CORS configured for production domains
- [ ] Rate limiting enabled
- [ ] Input validation on all endpoints
- [ ] RLS policies tested
- [ ] File upload restrictions in place
- [ ] Error messages don't leak internals
- [ ] Dependencies up to date

### Post-Deployment

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Monitoring alerts set up
- [ ] Backup verification
- [ ] Access logs reviewed
