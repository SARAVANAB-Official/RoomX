import { useState, useEffect, useRef, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, User, Loader2, Video, VideoOff, Mic, MicOff, AlertCircle } from 'lucide-react';
import { makeApi, ApiError } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';

export default function JoinRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [manualRoomId, setManualRoomId] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roomInfo, setRoomInfo] = useState<{
    name: string;
    requiresPassword: boolean;
    isFull: boolean;
    isBanned: boolean;
  } | null>(null);
  const [fetchingRoom, setFetchingRoom] = useState(false);

  const [cameraOn, setCameraOn] = useState(true);
  const [micOn, setMicOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const activeRoomId = roomId || manualRoomId;

  useEffect(() => {
    if (!activeRoomId) return;
    setFetchingRoom(true);
    setError('');

    makeApi<{ name: string; privacy: string; memberCount: number; settings: { maxParticipants: number } }>(
      `/api/rooms/${activeRoomId}`,
    )
      .then((data) => {
        setRoomInfo({
          name: data.name,
          requiresPassword: data.privacy === 'PASSWORD',
          isFull: data.memberCount >= data.settings?.maxParticipants,
          isBanned: false,
        });
      })
      .catch((err: unknown) => {
        setRoomInfo(null);
        let msg = 'Could not connect to server';
        if (err instanceof ApiError) {
          const errBody = err.body as any;
          msg = errBody?.error?.message || err.message || msg;
        } else if (err instanceof Error) {
          msg = err.message || msg;
        }
        setError(msg);
      })
      .finally(() => setFetchingRoom(false));
  }, [activeRoomId]);

  useEffect(() => {
    let mounted = true;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (mounted && videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
        }
      } catch {
        if (mounted) setCameraOn(false);
      }
    };

    startCamera();

    return () => {
      mounted = false;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const toggleCamera = () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setCameraOn(track.enabled);
    }
  };

  const toggleMic = () => {
    const track = streamRef.current?.getAudioTracks()[0];
    if (track) {
      track.enabled = !track.enabled;
      setMicOn(track.enabled);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!activeRoomId) {
      setError('Please enter a room ID');
      return;
    }
    if (!displayName.trim()) {
      setError('Display name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await makeApi<{ message: string; userId?: string; guestToken?: string }>(
        `/api/rooms/${activeRoomId}/join`,
        {
          method: 'POST',
          body: JSON.stringify({ displayName, password }),
        },
      );

      if (result.guestToken && result.userId) {
        const store = useAuthStore.getState();
        store.setSession({
          access_token: result.guestToken,
          refresh_token: '',
          expires_in: 86400,
          token_type: 'bearer',
          user: { id: result.userId },
        } as any);
        store.setUser({
          id: result.userId,
          displayName: displayName,
          role: 'member' as any,
          status: 'online' as any,
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSeenAt: new Date(),
        } as any);
      }

      navigate(`/room/${activeRoomId}`);
    } catch (err: unknown) {
      let msg = 'Could not connect to server';
      if (err instanceof ApiError) {
        const errBody = err.body as any;
        msg = errBody?.error?.error?.message || errBody?.error?.message || err.message || msg;
      } else if (err instanceof Error) {
        msg = err.message || msg;
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-2">Join Room</h1>
            <p className="text-gray-400">Enter your details to join</p>
          </div>

          {error && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              {error}
            </div>
          )}

          {roomInfo && (
            <div className="mb-6 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-sm">
              <p className="text-indigo-300 font-medium">{roomInfo.name}</p>
              {roomInfo.isFull && <p className="text-red-400 mt-1">Room is full</p>}
              {roomInfo.isBanned && <p className="text-red-400 mt-1">You are banned from this room</p>}
            </div>
          )}

          <div className="mb-6 rounded-xl overflow-hidden border border-white/10 bg-gray-900 aspect-video relative">
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
            {!cameraOn && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <VideoOff className="w-12 h-12 text-gray-600" />
              </div>
            )}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                type="button"
                onClick={toggleCamera}
                className={`p-2.5 rounded-full transition-colors ${
                  cameraOn ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'
                }`}
              >
                {cameraOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              </button>
              <button
                type="button"
                onClick={toggleMic}
                className={`p-2.5 rounded-full transition-colors ${
                  micOn ? 'bg-white/20 text-white' : 'bg-red-500/80 text-white'
                }`}
              >
                {micOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!roomId && (
              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Room ID or Link
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={manualRoomId}
                  onChange={(e) => setManualRoomId(e.target.value)}
                  className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  placeholder="Enter room ID or paste link"
                />
              </div>
            )}

            {fetchingRoom && (
              <div className="flex items-center justify-center gap-2 text-gray-400 text-sm py-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading room info...
              </div>
            )}

            <div>
              <label htmlFor="joinDisplayName" className="block text-sm font-medium text-gray-300 mb-1.5">
                Display Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  id="joinDisplayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  placeholder="Your display name"
                />
              </div>
            </div>

            {roomInfo?.requiresPassword && (
              <div>
                <label htmlFor="joinPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Room Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                  <input
                    id="joinPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-11 pr-12 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                    placeholder="Enter room password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !!error || !activeRoomId}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Joining room...
                </>
              ) : (
                'Join Room'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
