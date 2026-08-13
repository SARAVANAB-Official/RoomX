import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useRoomStore } from '@/stores/useRoomStore';
import { useChatStore } from '@/stores/useChatStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { usePollStore } from '@/stores/usePollStore';
import { useBrowserStore } from '@/stores/useBrowserStore';
import { useAuthStore } from '@/stores/useAuthStore';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

interface UseSocketReturn {
  socket: Socket | null;
  connected: boolean;
  connectError: string | null;
  connect: () => void;
  disconnect: () => void;
}

export function useSocket(roomId?: string): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const user = useAuthStore((s) => s.user);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    const currentUser = useAuthStore.getState().user;
    const session = useAuthStore.getState().session;

    console.log('[Socket] connecting to', SOCKET_URL, 'token present:', !!session?.access_token, 'user:', currentUser?.displayName);

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
      auth: {
        token: session?.access_token || '',
        displayName: currentUser?.displayName || 'Guest',
      },
    });

    socket.on('connect', () => {
      console.log('[Socket] connected, id:', socket.id);
      setConnected(true);
      setConnectError(null);
      const currentUser = useAuthStore.getState().user;
      const currentRoomId = useRoomStore.getState().currentRoom?.id || roomId;
      if (currentRoomId && currentUser) {
        socket.emit('room:join', {
          roomId: currentRoomId,
          userId: currentUser.id,
          displayName: currentUser.displayName,
        }, (response: any) => {
          if (response?.success) {
            console.log('[Socket] room:join success, members:', response.data?.members?.length);
          } else {
            console.error('[Socket] room:join failed:', response?.error);
            setConnectError(response?.error || 'Failed to join room');
          }
        });
      } else {
        console.warn('[Socket] connect but no roomId or user', { currentRoomId, hasUser: !!currentUser });
      }
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] disconnected, reason:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        socket.connect();
      }
    });

    socket.on('connect_error', (err) => {
      console.error('[Socket] connect_error:', err.message);
      setConnectError(err.message);
    });

    socket.on('room:state', (room) => {
      console.log('[Socket] room:state received');
      useRoomStore.getState().setCurrentRoom(room);
    });

    socket.on('room:member-joined', ({ member }) => {
      console.log('[Socket] member-joined:', member?.userId);
      useRoomStore.getState().addMember(member);
    });

    socket.on('room:member-left', ({ userId }) => {
      console.log('[Socket] member-left:', userId);
      useRoomStore.getState().removeMember(userId);
      useMediaStore.getState().removeRemoteStream(userId);
    });

    socket.on('room:member-updated', ({ member }) => {
      useRoomStore.getState().updateMember(member.userId, member);
    });

    socket.on('room:settings-updated', ({ settings }) => {
      useRoomStore.getState().updateSettings(settings);
    });

    socket.on('room:locked', () => useRoomStore.getState().setLocked(true));
    socket.on('room:unlocked', () => useRoomStore.getState().setLocked(false));

    socket.on('chat:message', (message) => {
      useChatStore.getState().addMessage(message);
    });

    socket.on('chat:typing', ({ userId, isTyping }) => {
      useChatStore.getState().setTyping(userId, isTyping);
    });

    socket.on('chat:message-deleted', ({ messageId }) => {
      useChatStore.getState().removeMessage(messageId);
    });

    socket.on('media:state-changed', ({ userId, state: mediaState }) => {
      useRoomStore.getState().updateMember(userId, {
        isMuted: !mediaState.micOn,
        isCameraOn: mediaState.cameraOn,
        isScreenSharing: mediaState.screenSharing,
      });
      useMediaStore.getState().setSpeaking(mediaState.isSpeaking);
    });

    socket.on('screen-share:started', ({ userId }) => {
      useRoomStore.getState().updateMember(userId, { isScreenSharing: true });
    });

    socket.on('screen-share:stopped', ({ userId }) => {
      useRoomStore.getState().updateMember(userId, { isScreenSharing: false });
    });

    socket.on('browser:state-update', ({ state: browserState }) => {
      useBrowserStore.getState().setTabs(browserState.tabs);
      useBrowserStore.getState().setActiveTab(browserState.activeTabId);
    });

    socket.on('browser:sync-started', ({ state: browserState }) => {
      useBrowserStore.getState().setTabs(browserState.tabs);
      useBrowserStore.getState().setActiveTab(browserState.activeTabId);
      useBrowserStore.getState().setSyncMode('presenter');
    });

    socket.on('browser:sync-stopped', () => {
      useBrowserStore.getState().setSyncMode('off');
    });

    socket.on('poll:created', (poll) => {
      usePollStore.getState().addPoll(poll);
    });

    socket.on('poll:vote', ({ pollId, optionId, userId: voterId }) => {
      usePollStore.getState().votePoll(pollId, optionId, voterId);
    });

    socket.on('poll:closed', ({ result }) => {
      usePollStore.getState().closePoll(result.id);
      usePollStore.getState().updatePoll(result.id, result);
    });

    socket.on('poll:updated', (poll) => {
      usePollStore.getState().updatePoll(poll.id, poll);
    });

    socket.on('hand:raised', ({ userId }) => {
      useRoomStore.getState().updateMember(userId, { isHandRaised: true });
    });

    socket.on('hand:lowered', ({ userId }) => {
      useRoomStore.getState().updateMember(userId, { isHandRaised: false });
    });

    socket.on('moderation:kicked', ({ userId }) => {
      useRoomStore.getState().removeMember(userId);
    });

    socket.on('moderation:promoted', ({ userId, newRole }) => {
      const member = useRoomStore.getState().members.find((m) => m.userId === userId);
      if (member) {
        useRoomStore.getState().updateMember(userId, {
          user: { ...member.user, role: newRole },
        } as any);
      }
    });

    socket.on('moderation:demoted', ({ userId, newRole }) => {
      const member = useRoomStore.getState().members.find((m) => m.userId === userId);
      if (member) {
        useRoomStore.getState().updateMember(userId, {
          user: { ...member.user, role: newRole },
        } as any);
      }
    });

    socketRef.current = socket;
    socket.connect();
  }, [roomId]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.removeAllListeners();
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setConnected(false);
  }, []);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return { socket: socketRef.current, connected, connectError, connect, disconnect };
}
