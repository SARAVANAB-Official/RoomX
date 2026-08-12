# RoomX Architecture

## System Overview

RoomX is a collaborative virtual room platform built as a monorepo using Turborepo. It enables real-time collaboration through features like screen sharing, YouTube synchronization, shared documents, and chat.

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENTS                                  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
│  │   Web App    │  │  Mobile Web │  │  Desktop    │            │
│  │  (React/Vite)│  │   (PWA)    │  │  (Electron) │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
                    ┌──────┴──────┐
                    │   HTTPS     │
                    │   WSS       │
                    └──────┬──────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    SERVER LAYER                                 │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐            │
│  │  Express.js  │  │  Socket.IO  │  │  WebRTC     │            │
│  │   (REST)     │  │  (Real-time)│  │  (P2P)      │            │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
│         │                │                │                     │
│         └────────────────┼────────────────┘                     │
│                          │                                      │
└──────────────────────────┼──────────────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────────────┐
│                    DATA LAYER                                   │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐            │
│  │   Supabase  │  │  PostgreSQL │  │   Storage   │            │
│  │   (Auth)    │  │  (Database) │  │  (Files)    │            │
│  └─────────────┘  └─────────────┘  └─────────────┘            │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Frontend Architecture

### Technology Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: React Context + Hooks
- **Real-time**: Socket.IO Client
- **Peer-to-peer**: Simple Peer (WebRTC)

### Project Structure

```
apps/web/
├── src/
│   ├── components/      # Reusable UI components
│   │   ├── ui/         # Base UI components
│   │   ├── room/       # Room-specific components
│   │   └── chat/       # Chat components
│   ├── contexts/       # React contexts
│   ├── hooks/          # Custom hooks
│   ├── pages/          # Route pages
│   ├── services/       # API and socket services
│   ├── stores/         # State stores
│   ├── types/          # TypeScript types
│   └── utils/          # Utility functions
├── public/             # Static assets
└── index.html          # Entry point
```

### Component Architecture

```
App
├── AuthProvider
│   └── ThemeProvider
│       └── Router
│           ├── LoginPage
│           ├── RegisterPage
│           ├── DashboardPage
│           │   ├── RoomList
│           │   └── CreateRoomModal
│           └── RoomPage
│               ├── VideoGrid
│               │   └── VideoPlayer
│               ├── ScreenShare
│               ├── YouTubePlayer
│               ├── DocumentEditor
│               ├── ChatPanel
│               │   └── ChatMessage
│               ├── ParticipantList
│               └── RoomControls
```

### Key Hooks

| Hook | Purpose |
|------|---------|
| `useSocket` | Socket.IO connection management |
| `useWebRTC` | WebRTC peer connections |
| `useRoom` | Room state and operations |
| `useChat` | Chat messaging |
| `useYouTube` | YouTube player sync |
| `useDocument` | Collaborative editing |

## Backend Architecture

### Technology Stack

- **Runtime**: Node.js 20
- **Framework**: Express.js
- **Real-time**: Socket.IO
- **Database**: PostgreSQL (via Supabase)
- **Authentication**: Supabase Auth

### Project Structure

```
apps/server/
├── src/
│   ├── config/         # Configuration files
│   ├── middleware/      # Express middleware
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── socket/         # Socket.IO handlers
│   ├── types/          # TypeScript types
│   └── index.ts        # Entry point
└── Dockerfile
```

### API Design

RESTful endpoints for CRUD operations:
- `/api/auth` - Authentication
- `/api/rooms` - Room management
- `/api/users` - User operations

Socket.IO for real-time:
- Room events (join, leave, disconnect)
- Media events (video, audio, screen share)
- Chat events (messages, typing)
- Collaboration events (document, YouTube)

## Database Schema

### Tables

```
┌─────────────────────────────────────────────────┐
│                    users                         │
├─────────────────────────────────────────────────┤
│ id (UUID, PK)                                   │
│ email (TEXT, UNIQUE)                            │
│ username (TEXT, UNIQUE)                         │
│ avatar_url (TEXT, NULLABLE)                     │
│ status (USER_STATUS)                            │
│ last_seen (TIMESTAMPTZ)                         │
│ created_at (TIMESTAMPTZ)                        │
│ updated_at (TIMESTAMPTZ)                        │
└─────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────┐
│                    rooms                         │
├─────────────────────────────────────────────────┤
│ id (UUID, PK)                                   │
│ name (TEXT)                                     │
│ description (TEXT, NULLABLE)                    │
│ invite_code (TEXT, UNIQUE)                      │
│ created_by (UUID, FK → users)                   │
│ max_participants (INTEGER, DEFAULT 10)          │
│ is_active (BOOLEAN, DEFAULT true)               │
│ settings (JSONB)                                │
│ created_at (TIMESTAMPTZ)                        │
│ updated_at (TIMESTAMPTZ)                        │
└─────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────┐
│              room_participants                   │
├─────────────────────────────────────────────────┤
│ id (UUID, PK)                                   │
│ room_id (UUID, FK → rooms)                      │
│ user_id (UUID, FK → users)                      │
│ role (ROOM_ROLE, DEFAULT 'member')              │
│ joined_at (TIMESTAMPTZ)                         │
└─────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────┐
│                   messages                       │
├─────────────────────────────────────────────────┤
│ id (UUID, PK)                                   │
│ room_id (UUID, FK → rooms)                      │
│ user_id (UUID, FK → users)                      │
│ content (TEXT)                                  │
│ type (MESSAGE_TYPE, DEFAULT 'text')             │
│ metadata (JSONB, NULLABLE)                      │
│ created_at (TIMESTAMPTZ)                        │
└─────────────────────────────────────────────────┘
                          │
                          │ 1:N
                          ▼
┌─────────────────────────────────────────────────┐
│              shared_documents                    │
├─────────────────────────────────────────────────┤
│ id (UUID, PK)                                   │
│ room_id (UUID, FK → rooms)                      │
│ title (TEXT)                                    │
│ content (TEXT, DEFAULT '')                      │
│ last_edited_by (UUID, FK → users)               │
│ created_at (TIMESTAMPTZ)                        │
│ updated_at (TIMESTAMPTZ)                        │
└─────────────────────────────────────────────────┘
```

### Storage Buckets

| Bucket | Purpose | Access |
|--------|---------|--------|
| `avatars` | User profile pictures | Public read, authenticated write |
| `room-files` | Shared room files | Room members only |
| `screenshots` | Screen captures | Room members only |

## Real-time Communication

### Socket.IO Events

#### Connection Flow

```
Client                          Server
  │                               │
  │──── connect ─────────────────>│
  │                               │
  │<──── authenticated ───────────│
  │                               │
  │──── join-room ───────────────>│
  │                               │
  │<──── room-joined ─────────────│
  │                               │
  │<──── participant-joined ──────│ (broadcast)
  │                               │
  │──── signal ──────────────────>│
  │                               │
  │<──── signal ──────────────────│ (relay)
  │                               │
```

#### Event Categories

| Category | Events |
|----------|--------|
| Room | `join-room`, `leave-room`, `room-joined`, `participant-joined`, `participant-left` |
| Media | `video-toggle`, `audio-toggle`, `screen-share-start`, `screen-share-stop` |
| Chat | `send-message`, `new-message`, `typing`, `stop-typing` |
| Collaboration | `document-update`, `youtube-sync`, `youtube-play`, `youtube-pause` |
| Signaling | `signal` (WebRTC) |

### WebRTC Architecture

```
  Peer A                         Peer B
    │                               │
    │──── Offer ──────────────────>│
    │                               │
    │<──── Answer ─────────────────│
    │                               │
    │──── ICE Candidate ──────────>│
    │                               │
    │<──── ICE Candidate ──────────│
    │                               │
    │<──── P2P Connection ─────────│
    │                               │
```

- **Signaling**: Socket.IO relays SDP offers/answers and ICE candidates
- **STUN/TURN**: Supabase provides TURN servers for NAT traversal
- **Media**: Direct P2P for video/audio/screen share

## Authentication Flow

```
┌─────────────────────────────────────────────────┐
│                 Login Flow                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. User enters credentials                      │
│           │                                      │
│           ▼                                      │
│  2. POST /api/auth/login                         │
│           │                                      │
│           ▼                                      │
│  3. Supabase Auth validates                      │
│           │                                      │
│           ▼                                      │
│  4. JWT token returned                           │
│           │                                      │
│           ▼                                      │
│  5. Token stored in HTTP-only cookie             │
│           │                                      │
│           ▼                                      │
│  6. User redirected to dashboard                 │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Token Management

- **Access Token**: Short-lived (15 minutes)
- **Refresh Token**: Long-lived (7 days)
- **Auto-refresh**: Token refreshes automatically before expiry

## File Storage Flow

```
┌─────────────────────────────────────────────────┐
│                Upload Flow                       │
├─────────────────────────────────────────────────┤
│                                                  │
│  1. Client requests signed URL                   │
│           │                                      │
│           ▼                                      │
│  2. Server generates signed URL                  │
│           │                                      │
│           ▼                                      │
│  3. Client uploads directly to Supabase         │
│           │                                      │
│           ▼                                      │
│  4. Upload complete notification                 │
│           │                                      │
│           ▼                                      │
│  5. File metadata saved to database              │
│                                                  │
└─────────────────────────────────────────────────┘
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────┐
│                  GitHub                          │
│         (Source Code Repository)                 │
└──────────────────────┬──────────────────────────┘
                       │
                       │ Push to main
                       ▼
┌─────────────────────────────────────────────────┐
│               GitHub Actions                     │
│            (CI/CD Pipeline)                      │
│  ┌─────────────────────────────────────────┐    │
│  │ 1. Install dependencies                 │    │
│  │ 2. Lint                                 │    │
│  │ 3. Type check                           │    │
│  │ 4. Test                                 │    │
│  │ 5. Build                                │    │
│  └─────────────────────────────────────────┘    │
└──────────────────────┬──────────────────────────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
┌─────────────────────┐  ┌─────────────────────┐
│       Vercel         │  │      Railway        │
│    (Frontend)        │  │    (Backend)        │
│  ┌─────────────┐    │  │  ┌─────────────┐    │
│  │  React App  │    │  │  │ Express.js  │    │
│  │  Static     │    │  │  │ Socket.IO   │    │
│  └─────────────┘    │  │  └─────────────┘    │
└─────────────────────┘  └──────────┬──────────┘
                                    │
                                    │
                         ┌──────────┴──────────┐
                         │                     │
                         ▼                     ▼
              ┌─────────────────┐  ┌─────────────────┐
              │    Supabase     │  │    Supabase     │
              │   (Auth/API)    │  │   (Storage)     │
              └─────────────────┘  └─────────────────┘
```

### Environment Separation

| Environment | Frontend | Backend | Database |
|-------------|----------|---------|----------|
| Development | localhost:5173 | localhost:3001 | Supabase Local |
| Preview | vercel.app | railway.app | Supabase Project |
| Production | roomx.vercel.app | roomx.railway.app | Supabase Project |

## Performance Considerations

### Frontend

- **Code Splitting**: Route-based lazy loading
- **Image Optimization**: WebP format, lazy loading
- **Caching**: Service worker for offline support
- **Bundle Size**: Tree shaking, minimal dependencies

### Backend

- **Connection Pooling**: PostgreSQL connection pool
- **Rate Limiting**: 100 requests per minute per user
- **WebSocket**: Connection limits per room
- **Caching**: Redis for session data (future)

### Database

- **Indexes**: Optimized queries for common operations
- **RLS**: Row Level Security for data isolation
- **Pagination**: Cursor-based pagination for large datasets

## Scalability

### Current Limits

| Resource | Limit |
|----------|-------|
| Participants per room | 10 |
| Concurrent rooms | Unlimited |
| File size | 10MB |
| Storage per room | 1GB |
| Messages per second | 100 |

### Future Improvements

- Redis for session caching
- WebSocket clustering
- CDN for static assets
- Database read replicas
- Kubernetes deployment
