import { create } from 'zustand';
import type { Room, RoomMember, RoomSettings } from '@roomx/shared';

interface RoomState {
  currentRoom: Room | null;
  members: RoomMember[];
  currentUserMembership: RoomMember | null;
  roomSettings: RoomSettings | null;
  isLocked: boolean;
  waitingRoom: string[];
  setCurrentRoom: (room: Room | null) => void;
  setMembers: (members: RoomMember[]) => void;
  updateSettings: (settings: Partial<RoomSettings>) => void;
  addMember: (member: RoomMember) => void;
  removeMember: (userId: string) => void;
  updateMember: (userId: string, updates: Partial<RoomMember>) => void;
  setLocked: (locked: boolean) => void;
  setCurrentUserMembership: (membership: RoomMember | null) => void;
  setWaitingRoom: (userIds: string[]) => void;
  addToWaitingRoom: (userId: string) => void;
  removeFromWaitingRoom: (userId: string) => void;
}

export const useRoomStore = create<RoomState>((set) => ({
  currentRoom: null,
  members: [],
  currentUserMembership: null,
  roomSettings: null,
  isLocked: false,
  waitingRoom: [],

  setCurrentRoom: (room) =>
    set({
      currentRoom: room,
      members: room?.members || [],
      roomSettings: room?.settings || null,
      isLocked: room?.settings.isLocked || false,
    }),

  setMembers: (members) => set({ members }),

  updateSettings: (settings) =>
    set((state) => ({
      roomSettings: state.roomSettings
        ? { ...state.roomSettings, ...settings }
        : null,
    })),

  addMember: (member) =>
    set((state) => ({
      members: [...state.members, member],
    })),

  removeMember: (userId) =>
    set((state) => ({
      members: state.members.filter((m) => m.userId !== userId),
    })),

  updateMember: (userId, updates) =>
    set((state) => ({
      members: state.members.map((m) =>
        m.userId === userId ? { ...m, ...updates } : m
      ),
    })),

  setLocked: (locked) => set({ isLocked: locked }),

  setCurrentUserMembership: (membership) => set({ currentUserMembership: membership }),

  setWaitingRoom: (userIds) => set({ waitingRoom: userIds }),

  addToWaitingRoom: (userId) =>
    set((state) => ({
      waitingRoom: [...state.waitingRoom, userId],
    })),

  removeFromWaitingRoom: (userId) =>
    set((state) => ({
      waitingRoom: state.waitingRoom.filter((id) => id !== userId),
    })),
}));
