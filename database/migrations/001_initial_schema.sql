-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- USERS TABLE
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  display_name TEXT NOT NULL DEFAULT 'Guest',
  avatar_url TEXT,
  is_guest BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROOMS TABLE
-- =============================================
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  privacy TEXT CHECK (privacy IN ('public', 'password', 'private')) DEFAULT 'public',
  password_hash TEXT,
  is_locked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  max_participants INT DEFAULT 50,
  allow_screen_share BOOLEAN DEFAULT true,
  allow_file_share BOOLEAN DEFAULT true,
  allow_chat BOOLEAN DEFAULT true,
  allow_camera BOOLEAN DEFAULT true,
  allow_microphone BOOLEAN DEFAULT true,
  allow_browser_sync BOOLEAN DEFAULT true,
  allow_guests BOOLEAN DEFAULT true,
  multiple_presenters BOOLEAN DEFAULT false,
  waiting_room_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROOM MEMBERS
-- =============================================
CREATE TABLE room_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'moderator', 'member', 'guest')) DEFAULT 'member',
  is_muted BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- =============================================
-- ROOM INVITES
-- =============================================
CREATE TABLE room_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  invited_by UUID NOT NULL REFERENCES users(id),
  email TEXT,
  invite_code TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- MESSAGES
-- =============================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  reply_to_id UUID REFERENCES messages(id),
  is_pinned BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- MESSAGE REACTIONS
-- =============================================
CREATE TABLE message_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(message_id, user_id, emoji)
);

-- =============================================
-- FILES
-- =============================================
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  original_name TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  storage_path TEXT NOT NULL,
  file_type TEXT CHECK (file_type IN ('image', 'video', 'audio', 'document', 'text', 'other')) DEFAULT 'other',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- POLLS
-- =============================================
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  is_anonymous BOOLEAN DEFAULT false,
  status TEXT CHECK (status IN ('active', 'closed')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE poll_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(poll_id, user_id)
);

-- =============================================
-- NOTES
-- =============================================
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  content TEXT DEFAULT '',
  updated_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- WHITEBOARDS
-- =============================================
CREATE TABLE whiteboards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  state JSONB DEFAULT '{"operations": []}',
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- ROOM EVENTS (Activity Log)
-- =============================================
CREATE TABLE room_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id),
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- BROWSER SESSIONS
-- =============================================
CREATE TABLE browser_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID UNIQUE NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  active_url TEXT,
  tabs JSONB DEFAULT '[]',
  sync_mode TEXT CHECK (sync_mode IN ('off', 'presenter', 'everyone')) DEFAULT 'off',
  presenter_id UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- BANS
-- =============================================
CREATE TABLE bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  banned_by UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- =============================================
-- WAITING ROOM
-- =============================================
CREATE TABLE waiting_room (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(room_id, user_id)
);

-- =============================================
-- NOTIFICATIONS
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =============================================
-- INDEXES
-- =============================================
CREATE INDEX idx_rooms_owner ON rooms(owner_id);
CREATE INDEX idx_rooms_code ON rooms(room_code);
CREATE INDEX idx_rooms_active ON rooms(is_active);
CREATE INDEX idx_room_members_room ON room_members(room_id);
CREATE INDEX idx_room_members_user ON room_members(user_id);
CREATE INDEX idx_messages_room ON messages(room_id);
CREATE INDEX idx_messages_created ON messages(created_at);
CREATE INDEX idx_files_room ON files(room_id);
CREATE INDEX idx_polls_room ON polls(room_id);
CREATE INDEX idx_room_events_room ON room_events(room_id);
CREATE INDEX idx_room_events_created ON room_events(created_at);
CREATE INDEX idx_bans_room_user ON bans(room_id, user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- =============================================
-- RLS POLICIES
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE whiteboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE browser_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE waiting_room ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Users can read their own data
CREATE POLICY users_self_select ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_self_update ON users FOR UPDATE USING (auth.uid() = id);

-- Rooms: members can read, owner can update
CREATE POLICY rooms_public_read ON rooms FOR SELECT USING (privacy = 'public' OR is_active = true);
CREATE POLICY rooms_owner_update ON rooms FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY rooms_auth_insert ON rooms FOR INSERT WITH CHECK (auth.uid() = owner_id);

-- Room members
CREATE POLICY room_members_select ON room_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members rm WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid())
);
CREATE POLICY room_members_insert ON room_members FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Messages: room members can read, sender can insert
CREATE POLICY messages_select ON messages FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid())
);
CREATE POLICY messages_insert ON messages FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Files: room members can read/insert
CREATE POLICY files_select ON files FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = files.room_id AND room_members.user_id = auth.uid())
);
CREATE POLICY files_insert ON files FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Polls: room members can read, creator can insert
CREATE POLICY polls_select ON polls FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = polls.room_id AND room_members.user_id = auth.uid())
);
CREATE POLICY polls_insert ON polls FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Similar for poll_options, poll_votes, notes, whiteboards, etc.
CREATE POLICY poll_options_select ON poll_options FOR SELECT USING (
  EXISTS (SELECT 1 FROM polls p JOIN room_members rm ON rm.room_id = p.room_id WHERE p.id = poll_options.poll_id AND rm.user_id = auth.uid())
);
CREATE POLICY poll_votes_select ON poll_votes FOR SELECT USING (
  EXISTS (SELECT 1 FROM polls p JOIN room_members rm ON rm.room_id = p.room_id WHERE p.id = poll_votes.poll_id AND rm.user_id = auth.uid())
);
CREATE POLICY poll_votes_insert ON poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notifications: user can read their own
CREATE POLICY notifications_select ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY notifications_insert ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bans
CREATE POLICY bans_select ON bans FOR SELECT USING (
  EXISTS (SELECT 1 FROM room_members WHERE room_members.room_id = bans.room_id AND room_members.user_id = auth.uid())
);

-- =============================================
-- FUNCTIONS
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER rooms_updated_at BEFORE UPDATE ON rooms FOR EACH ROW EXECUTE FUNCTION update_updated_at();
