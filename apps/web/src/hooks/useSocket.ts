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

    const tokenPresent = !!session?.access_token;
    const tokenType = session?.access_token?.split('.')?.length === 3 ? 'JWT' : 'unknown';

    console.log('[Socket] === DIAGNOSTIC ===');
    console.log('[Socket] SOCKET_URL:', SOCKET_URL);
    console.log('[Socket] path: /socket.io');
    console.log('[Socket] token present:', tokenPresent, 'token type:', tokenType);
    console.log('[Socket] user:', currentUser?.displayName || 'none', 'id present:', !!currentUser?.id);
    console.log('[Socket] roomId:', roomId || 'none');
    console.log('[Socket] transport: polling -> websocket (upgrade allowed)');
    console.log('[Socket] reconnection: true, max attempts: 10');

    if (!currentUser) {
      console.warn('[Socket] WARNING: No user in auth store. Socket will connect without auth.');
    }
    if (!tokenPresent) {
      console.warn('[Socket] WARNING: No access token. Room join may fail.');
    }

    const socket = io(SOCKET_URL, {
      path: "/socket.io",
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 15000,
      transports: ["polling", "websocket"],
      auth: {
        token: session?.access_token || '',
        displayName: currentUser?.displayName || 'Guest',
      },
    });

    socket.on('connect', () => {
      console.log('[Socket] CONNECTED - id:', socket.id, 'transport:', socket.io.engine?.transport?.name || 'unknown');
      setConnected(true);
      setConnectError(null);

      const currentRoomId = useRoomStore.getState().currentRoom?.id || roomId;
      const currentUserId = useAuthStore.getState().user?.id;
      const currentUserDisplayName = useAuthStore.getState().user?.displayName;

      console.log('[Socket] room:join attempt - roomId:', currentRoomId || 'NONE', 'userId present:', !!currentUserId);

      if (currentRoomId && currentUserId) {
        socket.emit('room:join', {
          roomId: currentRoomId,
        }, (response: any) => {
          if (response?.success) {
            console.log('[Socket] room:join SUCCESS - members:', response.data?.members?.length || 0);
          } else {
            console.error('[Socket] room:join FAILED:', response?.error);
            setConnectError('room:join failed: ' + (response?.error || 'unknown'));
          }
        });
      } else if (!currentRoomId) {
        console.warn('[Socket] connected but no roomId available');
      } else if (!currentUserId) {
        console.warn('[Socket] connected but no userId available - cannot join room');
        setConnectError('No user identity available');
      }
    });

    socket.on('connect_error', (err: any) => {
      console.error('[Socket] CONNECT_ERROR:', err.message);
      console.error('[Socket] connect_error type:', err.type || 'unknown');
      console.error('[Socket] connect_error description:', err.description || 'none');
      console.error('[Socket] connect_error context:', err.context || 'none');
      if (err.data) {
        console.error('[Socket] connect_error data:', JSON.stringify(err.data).substring(0, 200));
      }
      const errorMsg = err.message || 'Connection failed';
      setConnectError(errorMsg);
    });

    socket.on('disconnect', (reason) => {
      console.log('[Socket] DISCONNECTED - reason:', reason);
      setConnected(false);
      if (reason === 'io server disconnect') {
        console.log('[Socket] server initiated disconnect - reconnecting');
        socket.connect();
      }
    });

    socket.on('reconnect_attempt', (attempt) => {
      console.log('[Socket] RECONNECT_ATTEMPT:', attempt, '/10');
    });

    socket.on('reconnect', (attempt) => {
      console.log('[Socket] RECONNECTED after', attempt, 'attempts');
      setConnected(true);
      setConnectError(null);
    });

    socket.on('reconnect_error', (err) => {
      console.error('[Socket] RECONNECT_ERROR:', err.message);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket] RECONNECT_FAILED - all 10 attempts exhausted');
      setConnectError('Reconnection failed after 10 attempts');
    });

    socket.io.engine?.once('upgrade', (transport: any) => {
      console.log('[Socket] TRANSPORT_UPGRADE:', transport?.name || 'unknown');
    });

    socket.io.on('ping', () => {
      console.log('[Socket] PING');
    });

    socket.on('room:state', (room) => {
      console.log('[Socket] room:state received - roomId:', room?.roomId, 'members:', room?.members?.length || 0);
      useRoomStore.getState().setCurrentRoom(room);
    });

    socket.on('room:member-joined', ({ member }) => {
      console.log('[Socket] member-joined:', member?.userId, member?.displayName);
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
      console.log('[Socket] DISCONNECT called');
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
