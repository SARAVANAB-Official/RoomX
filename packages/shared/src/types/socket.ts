import { MediaState } from './media.js';
import { ChatMessage, TypingIndicator } from './chat.js';
import { FileMetadata } from './file.js';
import { WhiteboardState } from './whiteboard.js';
import { NotesContent, NotesUpdate } from './notes.js';
import { Poll } from './poll.js';
import { BrowserState } from './browser.js';
import { RoomMember, Room } from './room.js';
import { ActivityEvent } from './activity.js';

export interface ServerEvents {
  // Room events
  'room:join': (data: { roomId: string; userId: string; displayName: string }) => void;
  'room:leave': (data: { roomId: string; userId: string }) => void;
  'room:state': (data: Room) => void;
  'room:member-joined': (data: { roomId: string; member: RoomMember }) => void;
  'room:member-left': (data: { roomId: string; userId: string }) => void;
  'room:member-updated': (data: { roomId: string; member: RoomMember }) => void;
  'room:settings-updated': (data: { roomId: string; settings: Room['settings'] }) => void;
  'room:locked': (data: { roomId: string; lockedBy: string }) => void;
  'room:unlocked': (data: { roomId: string; unlockedBy: string }) => void;
  'room:error': (data: { message: string; code?: string }) => void;

  // WebRTC signaling
  'webrtc:signal': (data: {
    type: 'offer' | 'answer' | 'candidate' | 'renegotiate' | 'ice';
    from: string;
    to: string;
    roomId: string;
    payload: unknown;
  }) => void;
  'webrtc:ready': (data: { roomId: string; userId: string }) => void;
  'webrtc:cleanup': (data: { roomId: string; userId: string }) => void;

  // Media state
  'media:state-changed': (data: {
    roomId: string;
    userId: string;
    state: MediaState;
  }) => void;
  'media:mute-all': (data: { roomId: string; mutedBy: string }) => void;
  'media:muted': (data: { roomId: string; userId: string; mutedBy: string }) => void;

  // Screen share
  'screen-share:started': (data: {
    roomId: string;
    userId: string;
    streamId: string;
  }) => void;
  'screen-share:stopped': (data: { roomId: string; userId: string }) => void;
  'screen-share:stream': (data: {
    roomId: string;
    userId: string;
    stream: unknown;
  }) => void;

  // Chat
  'chat:message': (data: ChatMessage) => void;
  'chat:typing': (data: TypingIndicator) => void;
  'chat:message-deleted': (data: { messageId: string; roomId: string }) => void;
  'chat:message-edited': (data: ChatMessage) => void;

  // Browser sync
  'browser:sync-started': (data: {
    roomId: string;
    controllerId: string;
    state: BrowserState;
  }) => void;
  'browser:sync-stopped': (data: { roomId: string }) => void;
  'browser:action': (data: {
    roomId: string;
    action: string;
    payload: unknown;
    userId: string;
  }) => void;
  'browser:state-update': (data: { roomId: string; state: BrowserState }) => void;

  // File sharing
  'file:upload-started': (data: {
    fileId: string;
    roomId: string;
    userId: string;
    fileName: string;
    fileSize: number;
  }) => void;
  'file:upload-progress': (data: {
    fileId: string;
    roomId: string;
    progress: number;
  }) => void;
  'file:upload-completed': (data: FileMetadata) => void;
  'file:upload-error': (data: {
    fileId: string;
    roomId: string;
    error: string;
  }) => void;
  'file:shared': (data: FileMetadata) => void;
  'file:deleted': (data: { fileId: string; roomId: string }) => void;

  // Whiteboard
  'whiteboard:operation': (data: {
    roomId: string;
    operation: WhiteboardState;
    userId: string;
  }) => void;
  'whiteboard:state-sync': (data: {
    roomId: string;
    state: WhiteboardState[];
  }) => void;
  'whiteboard:clear': (data: { roomId: string; userId: string }) => void;

  // Notes
  'notes:sync': (data: NotesContent) => void;
  'notes:update': (data: NotesUpdate) => void;
  'notes:cursor-move': (data: {
    roomId: string;
    userId: string;
    position: number;
  }) => void;

  // Polls
  'poll:created': (data: Poll) => void;
  'poll:vote': (data: {
    pollId: string;
    optionId: string;
    userId: string;
    roomId: string;
  }) => void;
  'poll:closed': (data: { pollId: string; roomId: string; result: Poll }) => void;
  'poll:updated': (data: Poll) => void;

  // Reactions
  'reaction:added': (data: {
    roomId: string;
    messageId: string;
    emoji: string;
    userId: string;
  }) => void;
  'reaction:removed': (data: {
    roomId: string;
    messageId: string;
    emoji: string;
    userId: string;
  }) => void;

  // Hand raise
  'hand:raised': (data: { roomId: string; userId: string }) => void;
  'hand:lowered': (data: { roomId: string; userId: string }) => void;

  // Moderation
  'moderation:kicked': (data: {
    roomId: string;
    userId: string;
    kickedBy: string;
    reason?: string;
  }) => void;
  'moderation:banned': (data: {
    roomId: string;
    userId: string;
    bannedBy: string;
    reason?: string;
  }) => void;
  'moderation:promoted': (data: {
    roomId: string;
    userId: string;
    promotedBy: string;
    newRole: string;
  }) => void;
  'moderation:demoted': (data: {
    roomId: string;
    userId: string;
    demotedBy: string;
    newRole: string;
  }) => void;

  // Activity feed
  'activity:new': (data: ActivityEvent) => void;

  // Connection
  'user:connected': (data: { userId: string; socketId: string }) => void;
  'user:disconnected': (data: { userId: string }) => void;
}

export interface ClientEvents {
  // Room events
  'room:join': (data: { roomId: string; userId: string; displayName: string }) => void;
  'room:leave': (data: { roomId: string }) => void;
  'room:create': (data: {
    name: string;
    description?: string;
    privacy: string;
    settings?: Partial<Room['settings']>;
  }) => void;
  'room:update-settings': (data: {
    roomId: string;
    settings: Partial<Room['settings']>;
  }) => void;

  // WebRTC signaling
  'webrtc:signal': (data: {
    type: 'offer' | 'answer' | 'candidate' | 'renegotiate' | 'ice';
    to: string;
    roomId: string;
    payload: unknown;
  }) => void;
  'webrtc:ready': (data: { roomId: string }) => void;

  // Media state
  'media:update-state': (data: {
    roomId: string;
    state: Partial<MediaState>;
  }) => void;
  'media:mute-user': (data: { roomId: string; userId: string }) => void;
  'media:mute-all': (data: { roomId: string }) => void;

  // Screen share
  'screen-share:start': (data: { roomId: string }) => void;
  'screen-share:stop': (data: { roomId: string }) => void;

  // Chat
  'chat:send-message': (data: {
    roomId: string;
    content: string;
    replyTo?: string;
  }) => void;
  'chat:typing': (data: { roomId: string; isTyping: boolean }) => void;
  'chat:delete-message': (data: { messageId: string; roomId: string }) => void;
  'chat:edit-message': (data: {
    messageId: string;
    roomId: string;
    content: string;
  }) => void;

  // Browser sync
  'browser:start-sync': (data: { roomId: string }) => void;
  'browser:stop-sync': (data: { roomId: string }) => void;
  'browser:action': (data: {
    roomId: string;
    action: string;
    payload?: unknown;
  }) => void;

  // File sharing
  'file:upload-start': (data: {
    roomId: string;
    fileName: string;
    fileSize: number;
    fileType: string;
  }) => void;
  'file:upload-progress': (data: { fileId: string; progress: number }) => void;
  'file:delete': (data: { fileId: string; roomId: string }) => void;

  // Whiteboard
  'whiteboard:operation': (data: {
    roomId: string;
    operation: WhiteboardState;
  }) => void;
  'whiteboard:clear': (data: { roomId: string }) => void;
  'whiteboard:sync': (data: { roomId: string }) => void;

  // Notes
  'notes:update': (data: {
    roomId: string;
    content: string;
    version: number;
    operation: 'insert' | 'delete' | 'replace';
    position: number;
    length?: number;
    text?: string;
  }) => void;
  'notes:sync': (data: { roomId: string }) => void;
  'notes:cursor-move': (data: { roomId: string; position: number }) => void;

  // Polls
  'poll:create': (data: {
    roomId: string;
    question: string;
    options: string[];
    allowMultipleVotes?: boolean;
    isAnonymous?: boolean;
    endsAt?: Date;
  }) => void;
  'poll:vote': (data: { pollId: string; optionId: string }) => void;
  'poll:close': (data: { pollId: string; roomId: string }) => void;

  // Reactions
  'reaction:add': (data: {
    roomId: string;
    messageId: string;
    emoji: string;
  }) => void;
  'reaction:remove': (data: {
    roomId: string;
    messageId: string;
    emoji: string;
  }) => void;

  // Hand raise
  'hand:raise': (data: { roomId: string }) => void;
  'hand:lower': (data: { roomId: string }) => void;

  // Moderation
  'moderation:kick': (data: {
    roomId: string;
    userId: string;
    reason?: string;
  }) => void;
  'moderation:ban': (data: {
    roomId: string;
    userId: string;
    reason?: string;
  }) => void;
  'moderation:promote': (data: {
    roomId: string;
    userId: string;
    newRole: string;
  }) => void;
  'moderation:demote': (data: {
    roomId: string;
    userId: string;
    newRole: string;
  }) => void;
  'moderation:lock-room': (data: { roomId: string }) => void;
  'moderation:unlock-room': (data: { roomId: string }) => void;
}