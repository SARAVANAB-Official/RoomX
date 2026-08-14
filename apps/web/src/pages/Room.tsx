import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRoomStore } from '@/stores/useRoomStore';
import { useMediaStore } from '@/stores/useMediaStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import { useRoom } from '@/hooks/useRoom';
import { useSocket } from '@/hooks/useSocket';
import { useWebRTC } from '@/hooks/useWebRTC';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { TopBar } from '@/components/room/TopBar';
import { BottomBar } from '@/components/room/BottomBar';
import { VideoGrid } from '@/components/room/VideoGrid';
import { InviteModal } from '@/components/room/InviteModal';
import { SettingsPanel } from '@/components/room/SettingsPanel';
import { ParticipantsList } from '@/components/room/ParticipantsList';
import ChatPanel from '@/components/room/ChatPanel';

type LoadingState = 'loading' | 'ready' | 'not-found' | 'unauthorized' | 'error';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const members = useRoomStore((s) => s.members);
  const activePanel = useWorkspaceStore((s) => s.activePanel);
  const sidebarOpen = useWorkspaceStore((s) => s.sidebarOpen);

  const [loadingState, setLoadingState] = useState<LoadingState>('loading');
  const [showInvite, setShowInvite] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showChat, setShowChat] = useState(false);

  const { fetchRoom, leaveRoom, isOwner } = useRoom();
  const { socket, connected, connectError } = useSocket(roomId);
  const { getLocalMedia, startScreenShare, stopScreenShare, cleanup: cleanupWebRTC } = useWebRTC();
  const hasLeftRef = useRef(false);

  useEffect(() => {
    if (!roomId) {
      setLoadingState('not-found');
      return;
    }
    if (!user) {
      setLoadingState('unauthorized');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoadingState('loading');
      const room = await fetchRoom(roomId);
      if (cancelled) return;

      if (!room) {
        setLoadingState('not-found');
        return;
      }

      const isMember = room.members?.some((m) => m.userId === user.id);
      if (!isMember && room.privacy === 'PRIVATE') {
        setLoadingState('unauthorized');
        return;
      }

      setLoadingState('ready');
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [roomId, user, fetchRoom]);

  useEffect(() => {
    if (loadingState !== 'ready' || !user || !socket) return;

    const initMedia = async () => {
      await getLocalMedia({ audio: true, video: true });
    };
    initMedia();
  }, [loadingState, user, socket, getLocalMedia]);

  useEffect(() => {
    return () => {
      cleanupWebRTC();
      if (!hasLeftRef.current) {
        leaveRoom();
      }
      useMediaStore.getState().setLocalStream(null);
      useMediaStore.getState().stopScreenShare();
    };
  }, [cleanupWebRTC, leaveRoom]);

  useEffect(() => {
    const handleToggleChat = () => setShowChat((prev) => !prev);
    window.addEventListener('room:toggle-chat', handleToggleChat);
    return () => window.removeEventListener('room:toggle-chat', handleToggleChat);
  }, []);

  const handleLeave = useCallback(async () => {
    hasLeftRef.current = true;
    cleanupWebRTC();
    await leaveRoom();
    navigate('/');
  }, [cleanupWebRTC, leaveRoom, navigate]);

  if (loadingState === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-400 text-sm">Joining room...</p>
        </div>
      </div>
    );
  }

  if (loadingState === 'not-found') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Room not found</h2>
          <p className="text-gray-400 mb-6">This room may have been deleted or doesn't exist.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loadingState === 'unauthorized') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-yellow-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Unauthorized</h2>
          <p className="text-gray-400 mb-6">You don't have permission to join this room.</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loadingState === 'error') {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">Something went wrong</h2>
          <p className="text-gray-400 mb-6">Failed to connect to the room.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="h-screen flex flex-col bg-gray-950 overflow-hidden">
        <TopBar
          roomName={currentRoom?.name || 'Room'}
          connected={connected}
          connectError={connectError}
          participantCount={members.length}
          onInvite={() => setShowInvite(true)}
          onSettings={() => setShowSettings(true)}
          onParticipants={() => setShowParticipants(!showParticipants)}
          onLeave={handleLeave}
          isOwner={isOwner}
        />

        <div className="flex-1 flex overflow-hidden">
          {showParticipants && (
            <div className="w-72 shrink-0 border-r border-white/10 animate-slide-in-left">
              <ParticipantsList onClose={() => setShowParticipants(false)} />
            </div>
          )}

          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto p-4">
              {activePanel === 'screen' && <VideoGrid />}
              {activePanel === 'browser' && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Browser workspace
                </div>
              )}
              {activePanel === 'whiteboard' && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Whiteboard workspace
                </div>
              )}
              {activePanel === 'files' && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Files workspace
                </div>
              )}
              {activePanel === 'notes' && (
                <div className="h-full flex items-center justify-center text-gray-500">
                  Notes workspace
                </div>
              )}
            </div>
          </div>

          {showChat && (
            <div className="w-80 shrink-0 border-l border-white/10 animate-slide-in-right">
              <div className="h-full p-2">
                <ChatPanel socket={socket} />
              </div>
            </div>
          )}
        </div>

        <BottomBar
          onToggleScreenShare={() => {
            if (useMediaStore.getState().screenSharing) {
              stopScreenShare(socket!, roomId!);
            } else {
              startScreenShare(socket!, roomId!);
            }
          }}
          onOpenInvite={() => setShowInvite(true)}
          onLeave={handleLeave}
        />
      </div>

      {showInvite && currentRoom && (
        <InviteModal
          roomId={currentRoom.id}
          roomName={currentRoom.name}
          onClose={() => setShowInvite(false)}
        />
      )}

      {showSettings && isOwner && currentRoom && (
        <SettingsPanel onClose={() => setShowSettings(false)} />
      )}
    </ErrorBoundary>
  );
}
