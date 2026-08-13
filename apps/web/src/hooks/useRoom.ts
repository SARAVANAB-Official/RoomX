import { useCallback } from 'react';
import { useRoomStore } from '@/stores/useRoomStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { makeApi } from '@/lib/api';
import type { Room, RoomPrivacy, RoomSettings } from '@roomx/shared';

interface CreateRoomInput {
  name: string;
  description?: string;
  privacy: RoomPrivacy;
  settings?: Partial<RoomSettings>;
}

export function useRoom() {
  const user = useAuthStore((s) => s.user);
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const members = useRoomStore((s) => s.members);
  const currentUserMembership = useRoomStore((s) => s.currentUserMembership);
  const isLocked = useRoomStore((s) => s.isLocked);
  const waitingRoom = useRoomStore((s) => s.waitingRoom);
  const setCurrentRoom = useRoomStore((s) => s.setCurrentRoom);
  const setMembers = useRoomStore((s) => s.setMembers);
  const setCurrentUserMembership = useRoomStore((s) => s.setCurrentUserMembership);

  const createRoom = useCallback(async (input: CreateRoomInput): Promise<Room | null> => {
    try {
      return await makeApi<Room>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify(input),
      });
    } catch {
      return null;
    }
  }, []);

  const joinRoom = useCallback(async (roomId: string, password?: string): Promise<boolean> => {
    try {
      const room = await makeApi<Room>(`/api/rooms/${roomId}/join`, {
        method: 'POST',
        body: JSON.stringify({ password }),
      });
      setCurrentRoom(room);
      return true;
    } catch {
      return false;
    }
  }, []);

  const leaveRoom = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await makeApi(`/api/rooms/${currentRoom.id}/leave`, { method: 'POST' });
      setCurrentRoom(null);
      setMembers([]);
      setCurrentUserMembership(null);
      return true;
    } catch {
      return false;
    }
  }, [currentRoom]);

  const lockRoom = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await makeApi(`/api/rooms/${currentRoom.id}/lock`, { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }, [currentRoom]);

  const unlockRoom = useCallback(async (): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await makeApi(`/api/rooms/${currentRoom.id}/unlock`, { method: 'POST' });
      return true;
    } catch {
      return false;
    }
  }, [currentRoom]);

  const admitFromWaitingRoom = useCallback(async (userId: string): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await makeApi(`/api/rooms/${currentRoom.id}/admit`, {
        method: 'POST',
        body: JSON.stringify({ userId }),
      });
      return true;
    } catch {
      return false;
    }
  }, [currentRoom]);

  const kickMember = useCallback(async (userId: string, reason?: string): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await makeApi(`/api/rooms/${currentRoom.id}/kick`, {
        method: 'POST',
        body: JSON.stringify({ userId, reason }),
      });
      return true;
    } catch {
      return false;
    }
  }, [currentRoom]);

  const updateRoomSettings = useCallback(async (settings: Partial<RoomSettings>): Promise<boolean> => {
    if (!currentRoom) return false;
    try {
      await makeApi(`/api/rooms/${currentRoom.id}/settings`, {
        method: 'PATCH',
        body: JSON.stringify(settings),
      });
      return true;
    } catch {
      return false;
    }
  }, [currentRoom]);

  const fetchRoom = useCallback(async (roomId: string): Promise<Room | null> => {
    try {
      const room = await makeApi<Room>(`/api/rooms/${roomId}`);
      setCurrentRoom(room);
      return room;
    } catch {
      return null;
    }
  }, []);

  return {
    currentRoom,
    members,
    currentUserMembership,
    isLocked,
    waitingRoom,
    isOwner: currentRoom?.ownerId === user?.id,
    createRoom,
    joinRoom,
    leaveRoom,
    lockRoom,
    unlockRoom,
    admitFromWaitingRoom,
    kickMember,
    updateRoomSettings,
    fetchRoom,
  };
}
