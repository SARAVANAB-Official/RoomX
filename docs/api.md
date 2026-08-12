# API Documentation

RoomX provides a RESTful API for backend operations and Socket.IO for real-time communication.

## Table of Contents

- [Base URL](#base-url)
- [Authentication](#authentication)
- [Error Responses](#error-responses)
- [REST API Endpoints](#rest-api-endpoints)
  - [Auth](#auth-endpoints)
  - [Users](#user-endpoints)
  - [Rooms](#room-endpoints)
- [Socket.IO Events](#socketio-events)
  - [Connection](#connection-events)
  - [Room](#room-events)
  - [Media](#media-events)
  - [Chat](#chat-events)
  - [Collaboration](#collaboration-events)

---

## Base URL

```
Production:  https://your-backend.up.railway.app/api
Development: http://localhost:3001/api
```

## Authentication

Most endpoints require authentication via JWT token in an HTTP-only cookie.

```http
Cookie: access_token=eyJhbGciOiJIUzI1NiIs...
```

Or via Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

## Error Responses

All errors follow a consistent format:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "issue": "Invalid email format"
    }
  }
}
```

### Error Codes

| Code | Status | Description |
|------|--------|-------------|
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `UNAUTHORIZED` | 401 | Missing or invalid authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `CONFLICT` | 409 | Resource already exists |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## REST API Endpoints

### Auth Endpoints

#### Register

```http
POST /api/auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "username": "johndoe"
}
```

**Response (201):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "avatar_url": null,
    "created_at": "2025-01-01T00:00:00.000Z"
  },
  "message": "Registration successful"
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Invalid email or password |
| `409` | Email or username already exists |

---

#### Login

```http
POST /api/auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "avatar_url": "https://...",
    "status": "online"
  }
}
```

**Response Headers:**

```http
Set-Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
```

**Errors:**

| Code | Condition |
|------|-----------|
| `400` | Missing required fields |
| `401` | Invalid credentials |

---

#### Logout

```http
POST /api/auth/logout
```

**Authentication Required:** Yes

**Response (200):**

```json
{
  "message": "Logged out successfully"
}
```

**Response Headers:**

```http
Set-Cookie: access_token=; Max-Age=0
```

---

#### Get Current User

```http
GET /api/auth/me
```

**Authentication Required:** Yes

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "johndoe",
    "avatar_url": "https://...",
    "status": "online",
    "last_seen": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `401` | Not authenticated |

---

### User Endpoints

#### Get User Profile

```http
GET /api/users/:id
```

**Authentication Required:** Yes

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "username": "johndoe",
    "avatar_url": "https://...",
    "status": "online",
    "last_seen": "2025-01-01T00:00:00.000Z",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### Update Profile

```http
PUT /api/users/:id
```

**Authentication Required:** Yes (own profile only)

**Request Body:**

```json
{
  "username": "newname",
  "avatar_url": "https://..."
}
```

**Response (200):**

```json
{
  "user": {
    "id": "uuid",
    "username": "newname",
    "avatar_url": "https://...",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### Upload Avatar

```http
POST /api/users/:id/avatar
```

**Authentication Required:** Yes (own profile only)

**Request Body:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `avatar` | File | Yes |

**Constraints:**

- Max size: 2MB
- Allowed types: `image/jpeg`, `image/png`, `image/webp`

**Response (200):**

```json
{
  "avatar_url": "https://..."
}
```

---

### Room Endpoints

#### Create Room

```http
POST /api/rooms
```

**Authentication Required:** Yes

**Request Body:**

```json
{
  "name": "My Room",
  "description": "A collaborative space",
  "max_participants": 10
}
```

**Response (201):**

```json
{
  "room": {
    "id": "uuid",
    "name": "My Room",
    "description": "A collaborative space",
    "invite_code": "ABC123",
    "created_by": "uuid",
    "max_participants": 10,
    "is_active": true,
    "settings": {},
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### List Rooms

```http
GET /api/rooms
```

**Authentication Required:** Yes

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 20 | Items per page |
| `search` | string | - | Search by name |

**Response (200):**

```json
{
  "rooms": [
    {
      "id": "uuid",
      "name": "My Room",
      "description": "A collaborative space",
      "participant_count": 5,
      "is_active": true,
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

#### Get Room Details

```http
GET /api/rooms/:id
```

**Authentication Required:** Yes (room member)

**Response (200):**

```json
{
  "room": {
    "id": "uuid",
    "name": "My Room",
    "description": "A collaborative space",
    "invite_code": "ABC123",
    "created_by": "uuid",
    "max_participants": 10,
    "is_active": true,
    "settings": {},
    "participants": [
      {
        "id": "uuid",
        "user_id": "uuid",
        "username": "johndoe",
        "avatar_url": "https://...",
        "role": "owner",
        "joined_at": "2025-01-01T00:00:00.000Z"
      }
    ],
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### Join Room

```http
POST /api/rooms/:id/join
```

**Authentication Required:** Yes

**Request Body:**

```json
{
  "invite_code": "ABC123"
}
```

**Response (200):**

```json
{
  "room": {
    "id": "uuid",
    "name": "My Room",
    ...
  },
  "participant": {
    "id": "uuid",
    "role": "member",
    "joined_at": "2025-01-01T00:00:00.000Z"
  }
}
```

**Errors:**

| Code | Condition |
|------|-----------|
| `404` | Room not found |
| `400` | Invalid invite code |
| `409` | Room is full |

---

#### Leave Room

```http
POST /api/rooms/:id/leave
```

**Authentication Required:** Yes

**Response (200):**

```json
{
  "message": "Left room successfully"
}
```

---

#### Update Room

```http
PUT /api/rooms/:id
```

**Authentication Required:** Yes (admin or owner)

**Request Body:**

```json
{
  "name": "Updated Room Name",
  "description": "Updated description",
  "max_participants": 15
}
```

**Response (200):**

```json
{
  "room": {
    "id": "uuid",
    "name": "Updated Room Name",
    ...
  }
}
```

---

#### Delete Room

```http
DELETE /api/rooms/:id
```

**Authentication Required:** Yes (owner only)

**Response (200):**

```json
{
  "message": "Room deleted successfully"
}
```

---

#### Get Room Messages

```http
GET /api/rooms/:id/messages
```

**Authentication Required:** Yes (room member)

**Query Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `limit` | number | 50 | Messages to fetch |
| `before` | string | - | Cursor for pagination |

**Response (200):**

```json
{
  "messages": [
    {
      "id": "uuid",
      "content": "Hello everyone!",
      "type": "text",
      "user": {
        "id": "uuid",
        "username": "johndoe",
        "avatar_url": "https://..."
      },
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ],
  "has_more": true
}
```

---

#### Get Room Documents

```http
GET /api/rooms/:id/documents
```

**Authentication Required:** Yes (room member)

**Response (200):**

```json
{
  "documents": [
    {
      "id": "uuid",
      "title": "Meeting Notes",
      "content": "# Meeting Notes\n\n...",
      "last_edited_by": {
        "id": "uuid",
        "username": "johndoe"
      },
      "created_at": "2025-01-01T00:00:00.000Z",
      "updated_at": "2025-01-01T01:00:00.000Z"
    }
  ]
}
```

---

#### Create Document

```http
POST /api/rooms/:id/documents
```

**Authentication Required:** Yes (room member)

**Request Body:**

```json
{
  "title": "New Document",
  "content": ""
}
```

**Response (201):**

```json
{
  "document": {
    "id": "uuid",
    "title": "New Document",
    "content": "",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### Update Document

```http
PUT /api/rooms/:roomId/documents/:documentId
```

**Authentication Required:** Yes (room member)

**Request Body:**

```json
{
  "content": "# Updated content\n\n...",
  "title": "Updated Title"
}
```

**Response (200):**

```json
{
  "document": {
    "id": "uuid",
    "title": "Updated Title",
    "content": "# Updated content\n\n...",
    "updated_at": "2025-01-01T01:00:00.000Z"
  }
}
```

---

#### Upload File

```http
POST /api/rooms/:id/files
```

**Authentication Required:** Yes (room member)

**Request Body:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `file` | File | Yes |

**Constraints:**

- Max size: 10MB
- Allowed types: Images, PDF, text files

**Response (201):**

```json
{
  "file": {
    "id": "uuid",
    "name": "document.pdf",
    "url": "https://...",
    "size": 1024,
    "type": "application/pdf",
    "uploaded_by": "uuid",
    "created_at": "2025-01-01T00:00:00.000Z"
  }
}
```

---

#### Get Room Files

```http
GET /api/rooms/:id/files
```

**Authentication Required:** Yes (room member)

**Response (200):**

```json
{
  "files": [
    {
      "id": "uuid",
      "name": "document.pdf",
      "url": "https://...",
      "size": 1024,
      "type": "application/pdf",
      "uploaded_by": {
        "id": "uuid",
        "username": "johndoe"
      },
      "created_at": "2025-01-01T00:00:00.000Z"
    }
  ]
}
```

---

## Socket.IO Events

### Connection

Connect to the Socket.IO server:

```typescript
import { io } from 'socket.io-client';

const socket = io('https://your-backend.up.railway.app', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Connection Events

#### `connect`

Emitted when connected to the server.

```typescript
socket.on('connect', () => {
  console.log('Connected:', socket.id);
});
```

#### `disconnect`

Emitted when disconnected from the server.

```typescript
socket.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

#### `connect_error`

Emitted when connection fails.

```typescript
socket.on('connect_error', (error) => {
  console.error('Connection error:', error.message);
});
```

---

### Room Events

#### `join-room`

Join a room to start receiving events.

```typescript
socket.emit('join-room', roomId);
```

**Response Events:**

- `room-joined` - Successfully joined
- `error` - Join failed

---

#### `room-joined`

Emitted when successfully joined a room.

```typescript
socket.on('room-joined', (data) => {
  // data.room - Room details
  // data.participants - Existing participants
});
```

---

#### `leave-room`

Leave the current room.

```typescript
socket.emit('leave-room', roomId);
```

---

#### `participant-joined`

Emitted when a new participant joins.

```typescript
socket.on('participant-joined', (participant) => {
  // participant.id
  // participant.user_id
  // participant.username
  // participant.avatar_url
});
```

---

#### `participant-left`

Emitted when a participant leaves.

```typescript
socket.on('participant-left', (data) => {
  // data.user_id
  // data.username
});
```

---

### Media Events

#### `video-toggle`

Toggle video on/off.

```typescript
socket.emit('video-toggle', { enabled: true });
```

---

#### `audio-toggle`

Toggle audio on/off.

```typescript
socket.emit('audio-toggle', { enabled: true });
```

---

#### `screen-share-start`

Start screen sharing.

```typescript
socket.emit('screen-share-start');
```

**Response Events:**

- `screen-share-started` - Sharing started
- `error` - Start failed

---

#### `screen-share-stop`

Stop screen sharing.

```typescript
socket.emit('screen-share-stop');
```

---

#### `screen-share-started`

Emitted when someone starts screen sharing.

```typescript
socket.on('screen-share-started', (data) => {
  // data.user_id
  // data.username
});
```

---

#### `screen-share-stopped`

Emitted when someone stops screen sharing.

```typescript
socket.on('screen-share-stopped', (data) => {
  // data.user_id
});
```

---

#### `signal`

WebRTC signaling for peer connections.

```typescript
// Send signal
socket.emit('signal', {
  to: targetUserId,
  signal: webrtcSignal
});

// Receive signal
socket.on('signal', (data) => {
  // data.from - Sender user ID
  // data.signal - WebRTC signal data
});
```

---

### Chat Events

#### `send-message`

Send a message to the room.

```typescript
socket.emit('send-message', {
  content: 'Hello everyone!',
  type: 'text'
});
```

---

#### `new-message`

Emitted when a new message is received.

```typescript
socket.on('new-message', (message) => {
  // message.id
  // message.content
  // message.type
  // message.user - { id, username, avatar_url }
  // message.created_at
});
```

---

#### `typing`

Indicate user is typing.

```typescript
socket.emit('typing');
```

---

#### `stop-typing`

Indicate user stopped typing.

```typescript
socket.emit('stop-typing');
```

---

#### `user-typing`

Emitted when another user is typing.

```typescript
socket.on('user-typing', (data) => {
  // data.user_id
  // data.username
});
```

---

#### `user-stop-typing`

Emitted when another user stops typing.

```typescript
socket.on('user-stop-typing', (data) => {
  // data.user_id
});
```

---

### Collaboration Events

#### `document-update`

Update shared document content.

```typescript
socket.emit('document-update', {
  documentId: 'uuid',
  content: 'Updated content...',
  title: 'Updated Title'
});
```

---

#### `document-changed`

Emitted when a document is updated.

```typescript
socket.on('document-changed', (data) => {
  // data.document_id
  // data.content
  // data.title
  // data.user_id
  // data.username
});
```

---

#### `youtube-sync`

Sync YouTube player state.

```typescript
socket.emit('youtube-sync', {
  videoId: 'dQw4w9WgXcQ',
  currentTime: 30,
  isPlaying: true
});
```

---

#### `youtube-play`

Play YouTube video.

```typescript
socket.emit('youtube-play', {
  videoId: 'dQw4w9WgXcQ',
  currentTime: 30
});
```

---

#### `youtube-pause`

Pause YouTube video.

```typescript
socket.emit('youtube-pause', {
  currentTime: 30
});
```

---

#### `youtube-state-changed`

Emitted when YouTube player state changes.

```typescript
socket.on('youtube-state-changed', (data) => {
  // data.video_id
  // data.current_time
  // data.is_playing
  // data.user_id
  // data.username
});
```

---

## Rate Limits

| Event/Endpoint | Limit | Window |
|----------------|-------|--------|
| REST API (general) | 100 | 1 minute |
| Auth endpoints | 5 | 15 minutes |
| File upload | 10 | 1 minute |
| Socket messages | 30 | 1 second |
| Socket joins | 10 | 1 minute |

---

## WebSocket Protocol

### Message Format

All Socket.IO messages follow this format:

```json
{
  "event": "event-name",
  "data": { ... },
  "timestamp": 1234567890
}
```

### Error Events

```typescript
socket.on('error', (error) => {
  // error.code - Error code
  // error.message - Human-readable message
});
```

### Reconnection

Socket.IO automatically handles reconnection with exponential backoff:

```typescript
socket.on('connect', () => {
  if (socket.recovered) {
    // Connection was recovered
    console.log('Reconnected successfully');
  }
});
```
