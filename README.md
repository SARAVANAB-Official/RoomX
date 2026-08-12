<div align="center">

# RoomX

### Collaborative Virtual Room Platform

[![CI](https://github.com/your-username/roomx/actions/workflows/ci.yml/badge.svg)](https://github.com/your-username/roomx/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)](https://www.typescriptlangorg/)

**RoomX is a real-time collaborative platform that brings teams together in virtual rooms with video chat, screen sharing, shared documents, YouTube synchronization, and instant messaging.**

[Features](#features) • [Tech Stack](#tech-stack) • [Quick Start](#quick-start) • [Deployment](#deployment) • [Contributing](#contributing)

</div>

---

## Features

### Real-Time Communication
- **HD Video Chat** - Crystal-clear peer-to-peer video calls with up to 10 participants
- **Screen Sharing** - Share your entire screen or specific application windows
- **Instant Messaging** - Real-time chat with message history and typing indicators

### Collaboration Tools
- **Shared Documents** - Collaborative text editing with live cursor positions
- **YouTube Sync** - Watch videos together with synchronized playback controls
- **File Sharing** - Upload and share files within rooms securely

### Room Management
- **Invite Links** - Generate unique invite codes for easy room access
- **Role-Based Access** - Owner, Admin, and Member roles with appropriate permissions
- **Room Settings** - Customizable room configurations and participant limits

### User Experience
- **Dark/Light Mode** - Theme support for comfortable viewing
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Progressive Web App** - Install as a native app on any device

### Security & Privacy
- **End-to-End Encryption** - WebRTC encrypted peer connections
- **Row Level Security** - Database-level access control via Supabase
- **Secure Authentication** - JWT-based auth with HTTP-only cookies

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 | UI framework |
| **Build** | Vite | Fast development & bundling |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Language** | TypeScript | Type safety |
| **Backend** | Express.js | REST API server |
| **Real-time** | Socket.IO | WebSocket communication |
| **Peer-to-Peer** | WebRTC | Video/audio/data streaming |
| **Database** | PostgreSQL | Data persistence |
| **Auth** | Supabase Auth | Authentication & authorization |
| **Storage** | Supabase Storage | File storage |
| **Monorepo** | pnpm + Turborepo | Package management |
| **CI/CD** | GitHub Actions | Automated testing & deployment |
| **Hosting** | Vercel + Railway | Frontend + Backend hosting |

---

## Project Structure

```
roomx/
├── .github/
│   └── workflows/
│       └── ci.yml                    # GitHub Actions CI/CD
├── apps/
│   ├── web/                          # React frontend
│   │   ├── public/                   # Static assets
│   │   ├── src/
│   │   │   ├── components/           # UI components
│   │   │   │   ├── ui/              # Base components
│   │   │   │   ├── room/            # Room components
│   │   │   │   └── chat/            # Chat components
│   │   │   ├── contexts/            # React contexts
│   │   │   ├── hooks/               # Custom hooks
│   │   │   ├── pages/               # Route pages
│   │   │   ├── services/            # API & socket services
│   │   │   ├── stores/              # State management
│   │   │   ├── types/               # TypeScript types
│   │   │   └── utils/               # Utility functions
│   │   ├── index.html
│   │   ├── tailwind.config.js
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   └── server/                       # Express backend
│       ├── src/
│       │   ├── config/               # Configuration
│       │   ├── middleware/           # Express middleware
│       │   ├── routes/               # API routes
│       │   ├── services/             # Business logic
│       │   ├── socket/               # Socket.IO handlers
│       │   └── index.ts              # Entry point
│       ├── Dockerfile
│       ├── tsconfig.json
│       └── package.json
├── packages/
│   └── shared/                       # Shared utilities
│       ├── src/
│       │   ├── types/                # Shared types
│       │   ├── utils/                # Shared utilities
│       │   └── constants/            # Constants
│       ├── migrations/               # Database migrations
│       └── package.json
├── docs/                             # Documentation
│   ├── architecture.md
│   ├── deployment.md
│   ├── security.md
│   └── api.md
├── pnpm-workspace.yaml
├── turbo.json
├── vercel.json
├── LICENSE
├── README.md
├── CONTRIBUTING.md
└── SECURITY.md
```

---

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20 or higher
- [pnpm](https://pnpm.io/) 9 or higher
- [Supabase](https://supabase.com/) account (free tier works)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/your-username/roomx.git
   cd roomx
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Set up environment variables**

   ```bash
   # Frontend
   cp apps/web/.env.example apps/web/.env.local

   # Backend
   cp apps/server/.env.example apps/server/.env
   ```

4. **Configure Supabase**

   - Create a new project at [supabase.com](https://supabase.com)
   - Copy your project URL and API keys
   - Update `.env.local` and `.env` with your credentials

5. **Run database migrations**

   ```bash
   # Using Supabase CLI
   supabase db push
   
   # Or run SQL manually via Supabase Dashboard
   ```

6. **Start development server**

   ```bash
   pnpm dev
   ```

7. **Open your browser**

   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3001](http://localhost:3001)

---

## Environment Variables

### Frontend (`apps/web/.env.local`)

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_SUPABASE_URL` | Supabase project URL | Yes |
| `VITE_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `VITE_API_URL` | Backend API URL | Yes |
| `VITE_WS_URL` | Backend WebSocket URL | Yes |

### Backend (`apps/server/.env`)

| Variable | Description | Required |
|----------|-------------|----------|
| `NODE_ENV` | Environment mode | Yes |
| `PORT` | Server port | Yes |
| `SUPABASE_URL` | Supabase project URL | Yes |
| `SUPABASE_ANON_KEY` | Supabase anonymous key | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | Yes |
| `JWT_SECRET` | Secret for JWT signing | Yes |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `ALLOWED_ORIGINS` | Comma-separated allowed origins | Yes |

---

## Database Setup

### Tables

The database consists of the following tables:

- `users` - User profiles and authentication data
- `rooms` - Virtual room configurations
- `room_participants` - Room membership and roles
- `messages` - Chat message history
- `shared_documents` - Collaborative document storage

### Running Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

### Storage Buckets

Create the following storage buckets in Supabase:

| Bucket | Public | Purpose |
|--------|--------|---------|
| `avatars` | Yes | User profile pictures |
| `room-files` | No | Shared room files |
| `screenshots` | No | Screen captures |

---

## Development Commands

```bash
# Start all apps in development mode
pnpm dev

# Build all packages and apps
pnpm build

# Run linting
pnpm lint

# Run type checking
pnpm typecheck

# Run all tests
pnpm test

# Clean all node_modules and dist
pnpm clean

# Build specific package
pnpm --filter @roomx/shared build
pnpm --filter @roomx/server build
pnpm --filter @roomx/web build
```

---

## Deployment

### Frontend (Vercel)

1. Push code to GitHub
2. Import repository in [Vercel](https://vercel.com)
3. Configure:
   - **Framework**: Other
   - **Root Directory**: `apps/web`
   - **Build Command**: `cd ../.. && pnpm --filter @roomx/web build`
   - **Output Directory**: `dist`
4. Add environment variables
5. Deploy

### Backend (Railway)

1. Create new project in [Railway](https://railway.app)
2. Deploy from GitHub repository
3. Configure Dockerfile path: `apps/server/Dockerfile`
4. Add environment variables
5. Deploy

### Database (Supabase)

1. Create project at [supabase.com](https://supabase.com)
2. Run database migrations
3. Configure storage buckets
4. Set up Row Level Security policies

For detailed instructions, see [docs/deployment.md](docs/deployment.md).

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTS                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐    │
│  │   Web App    │  │  Mobile Web │  │  Desktop    │    │
│  │  (React/Vite)│  │   (PWA)    │  │  (Electron) │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └────────────────┼────────────────┘            │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │ HTTPS / WSS
┌──────────────────────────┼──────────────────────────────┐
│                    SERVER LAYER                         │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐    │
│  │  Express.js  │  │  Socket.IO  │  │  WebRTC     │    │
│  │   (REST)     │  │  (Real-time)│  │  (P2P)      │    │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘    │
│         └────────────────┼────────────────┘            │
│                          │                              │
└──────────────────────────┼──────────────────────────────┘
                           │
┌──────────────────────────┼──────────────────────────────┐
│                    DATA LAYER                           │
│  ┌─────────────┐  ┌──────┴──────┐  ┌─────────────┐    │
│  │   Supabase  │  │  PostgreSQL │  │   Storage   │    │
│  │   (Auth)    │  │  (Database) │  │  (Files)    │    │
│  └─────────────┘  └─────────────┘  └─────────────┘    │
└─────────────────────────────────────────────────────────┘
```

For detailed architecture documentation, see [docs/architecture.md](docs/architecture.md).

---

## Testing

### Running Tests

```bash
# Run all tests
pnpm test

# Run tests for specific package
pnpm --filter @roomx/server test
pnpm --filter @roomx/web test

# Run tests in watch mode
pnpm --filter @roomx/web test:watch
```

### Test Structure

- **Unit Tests**: Individual function and component tests
- **Integration Tests**: API endpoint and socket event tests
- **E2E Tests**: Full user flow tests (coming soon)

---

## Browser Compatibility

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | 90+ | ✅ Fully Supported |
| Firefox | 88+ | ✅ Fully Supported |
| Safari | 14+ | ✅ Fully Supported |
| Edge | 90+ | ✅ Fully Supported |
| Opera | 76+ | ✅ Fully Supported |
| iOS Safari | 14+ | ✅ Fully Supported |
| Chrome Android | 90+ | ✅ Fully Supported |

### WebRTC Requirements

- HTTPS connection (required for production)
- Camera and microphone permissions
- WebSocket support
- TURN server access (for NAT traversal)

---

## Known Limitations

### iframe Restrictions

- Screen sharing of iframes may be blocked by browser security policies
- YouTube embeds require user interaction to enable audio
- Cross-origin iframes cannot be captured

### WebRTC Requirements

- Requires HTTPS in production
- Some corporate firewalls may block WebRTC connections
- Mobile browsers may have reduced quality on cellular networks

### Storage Limits

- Free tier Supabase: 1GB storage, 50,000 monthly active users
- File upload limit: 10MB per file
- Maximum 10 participants per room

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `pnpm test`
5. Commit: `git commit -m 'feat: add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

---

## Security

For security concerns, please see our [Security Policy](SECURITY.md).

To report a vulnerability, email security@roomx.app.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

- [Supabase](https://supabase.com/) - Backend infrastructure
- [Socket.IO](https://socket.io/) - Real-time communication
- [Simple Peer](https://github.com/feross/simple-peer) - WebRTC simplification
- [Tailwind CSS](https://tailwindcss.com/) - Styling framework
- [Vite](https://vitejs.dev/) - Build tool
- [React](https://react.dev/) - UI framework

---

<div align="center">

**Made with ❤️ by the RoomX team**

[Report Bug](https://github.com/your-username/roomx/issues) • [Request Feature](https://github.com/your-username/roomx/issues) • [Documentation](docs/)

</div>
