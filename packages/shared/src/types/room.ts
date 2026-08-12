import { User } from './user.js';

export enum RoomPrivacy {
  PUBLIC = 'PUBLIC',
  PASSWORD = 'PASSWORD',
  PRIVATE = 'PRIVATE'
}

export interface RoomSettings {
  password?: string;
  maxParticipants: number;
  allowScreenShare: boolean;
  allowFileShare: boolean;
  allowChat: boolean;
  allowCamera: boolean;
  allowMicrophone: boolean;
  allowBrowserSync: boolean;
  allowGuests: boolean;
  waitingRoom: boolean;
  multiplePresenters: boolean;
  isLocked: boolean;
}

export interface RoomMember {
  id: string;
  roomId: string;
  userId: string;
  user: User;
  isMuted: boolean;
  isCameraOn: boolean;
  isScreenSharing: boolean;
  isHandRaised: boolean;
  joinedAt: Date;
  leftAt?: Date;
}

export interface RoomInvite {
  id: string;
  roomId: string;
  invitedBy: string;
  email?: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  usedAt?: Date;
}

export interface Room {
  id: string;
  name: string;
  description?: string;
  privacy: RoomPrivacy;
  settings: RoomSettings;
  ownerId: string;
  owner: User;
  members: RoomMember[];
  memberCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastActiveAt: Date;
}