-- =============================================
-- DEVELOPMENT SEED DATA
-- =============================================

-- Test User
INSERT INTO users (id, email, display_name, avatar_url, is_guest)
VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'test@roomx.dev',
  'Test User',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
  false
);

-- Test Room Owner (second user for testing)
INSERT INTO users (id, email, display_name, avatar_url, is_guest)
VALUES (
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'owner@roomx.dev',
  'Room Owner',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=owner',
  false
);

-- Test Room
INSERT INTO rooms (
  id,
  room_code,
  name,
  owner_id,
  privacy,
  is_active,
  max_participants,
  allow_screen_share,
  allow_file_share,
  allow_chat,
  allow_camera,
  allow_microphone,
  allow_browser_sync,
  allow_guests,
  multiple_presenters,
  waiting_room_enabled
)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'TEST001',
  'Development Test Room',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  'public',
  true,
  50,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  true,
  false
);

-- Room Members
INSERT INTO room_members (room_id, user_id, role, is_muted)
VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'owner', false),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'member', false);

-- Room Notes
INSERT INTO notes (room_id, content, updated_by)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  '# Welcome to RoomX!

This is a collaborative space for testing and development.

## Features
- Real-time chat
- Screen sharing
- File sharing
- Collaborative notes
- Whiteboard',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'
);

-- Room Whiteboard
INSERT INTO whiteboards (room_id, state)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  '{"operations": [], "tool": "pen", "color": "#000000", "size": 2}'
);

-- Browser Session
INSERT INTO browser_sessions (room_id, active_url, tabs, sync_mode, presenter_id)
VALUES (
  'c3d4e5f6-a7b8-9012-cdef-123456789012',
  'https://roomx.dev',
  '[{"title": "RoomX Dashboard", "url": "https://roomx.dev", "active": true}]',
  'presenter',
  'b2c3d4e5-f6a7-8901-bcde-f12345678901'
);

-- Sample Messages
INSERT INTO messages (room_id, user_id, content)
VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'Welcome to the test room!'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Thanks for having me!');

-- Room Events
INSERT INTO room_events (room_id, user_id, event_type, metadata)
VALUES
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'b2c3d4e5-f6a7-8901-bcde-f12345678901', 'room_created', '{"name": "Development Test Room"}'),
  ('c3d4e5f6-a7b8-9012-cdef-123456789012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'member_joined', '{}');
