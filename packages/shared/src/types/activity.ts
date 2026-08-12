import { User } from './user.js';
import { Room } from './room.js';

export enum ActivityType {
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  USER_MUTED = 'USER_MUTED',
  USER_UNMUTED = 'USER_UNMUTED',
  USER_CAMERA_ON = 'USER_CAMERA_ON',
  USER_CAMERA_OFF = 'USER_CAMERA_OFF',
  USER_SCREEN_SHARE_ON = 'USER_SCREEN_SHARE_ON',
  USER_SCREEN_SHARE_OFF = 'USER_SCREEN_SHARE_OFF',
  USER_HAND_RAISED = 'USER_HAND_RAISED',
  USER_HAND_LOWERED = 'USER_HAND_LOWERED',
  MESSAGE_SENT = 'MESSAGE_SENT',
  FILE_UPLOADED = 'FILE_UPLOADED',
  POLL_CREATED = 'POLL_CREATED',
  POLL_VOTE = 'POLL_VOTE',
  POLL_CLOSED = 'POLL_CLOSED',
  WHITEBOARD_UPDATED = 'WHITEBOARD_UPDATED',
  NOTES_UPDATED = 'NOTES_UPDATED',
  BROWSER_SYNC_STARTED = 'BROWSER_SYNC_STARTED',
  BROWSER_SYNC_ENDED = 'BROWSER_SYNC_ENDED',
  ROOM_LOCKED = 'ROOM_LOCKED',
  ROOM_UNLOCKED = 'ROOM_UNLOCKED',
  USER_PROMOTED = 'USER_PROMOTED',
  USER_DEMOTED = 'USER_DEMOTED',
  USER_KICKED = 'USER_KICKED',
  USER_BANNED = 'USER_BANNED'
}

export interface ActivityEvent {
  id: string;
  roomId: string;
  type: ActivityType;
  userId: string;
  user: User;
  targetUserId?: string;
  targetUser?: User;
  roomId_ref?: string;
  room?: Room;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}