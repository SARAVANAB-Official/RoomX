import { useRef, useEffect, useState, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Maximize2,
  Minimize2,
  Crown,
  Shield,
  Hand,
  Monitor,
  Wifi,
  WifiOff,
} from 'lucide-react';
import type { RoomMember } from '@roomx/shared';
import { useMediaStore } from '@/stores/useMediaStore';

interface VideoCardProps {
  member: RoomMember;
  stream?: MediaStream | null;
  isLocal?: boolean;
  connectionQuality?: 'good' | 'fair' | 'poor';
  speaking?: boolean;
}

export function VideoCard({
  member,
  stream,
  isLocal = false,
  connectionQuality = 'good',
  speaking = false,
}: VideoCardProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const toggleFullscreen = useCallback(() => {
    if (!cardRef.current) return;
    if (!fullscreen) {
      cardRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setFullscreen(!fullscreen);
  }, [fullscreen]);

  const role = member.user?.role;
  const isOwner = role === 'OWNER';
  const isModerator = role === 'MODERATOR';
  const micOff = member.isMuted;
  const cameraOff = !member.isCameraOn;

  const qualityIcon = connectionQuality === 'good' ? (
    <Wifi className="w-3 h-3 text-green-400" />
  ) : connectionQuality === 'fair' ? (
    <Wifi className="w-3 h-3 text-yellow-400" />
  ) : (
    <WifiOff className="w-3 h-3 text-red-400" />
  );

  return (
    <div
      ref={cardRef}
      className={`relative group rounded-xl overflow-hidden bg-gray-900 border transition-all ${
        speaking
          ? 'border-indigo-500/60 shadow-[0_0_15px_rgba(99,102,241,0.3)]'
          : 'border-white/10'
      } ${fullscreen ? 'fixed inset-0 z-50 rounded-none' : ''}`}
    >
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${cameraOff ? 'hidden' : ''}`}
      />

      {cameraOff && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl font-bold text-white">
            {member.user?.displayName?.charAt(0)?.toUpperCase() || '?'}
          </div>
        </div>
      )}

      {member.isScreenSharing && (
        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 bg-green-500/20 border border-green-500/40 rounded-md text-[10px] font-medium text-green-400">
          <Monitor className="w-3 h-3" />
          Presenting
        </div>
      )}

      {member.isHandRaised && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 bg-yellow-500/20 border border-yellow-500/40 rounded-md">
          <Hand className="w-3 h-3 text-yellow-400" />
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            {isOwner && <Crown className="w-3 h-3 text-yellow-400 shrink-0" />}
            {isModerator && <Shield className="w-3 h-3 text-blue-400 shrink-0" />}
            <span className="text-xs font-medium text-white truncate">
              {member.user?.displayName || 'Unknown'}
              {isLocal && ' (You)'}
            </span>
          </div>

          <div className="flex items-center gap-1">
            {micOff ? (
              <MicOff className="w-3 h-3 text-red-400" />
            ) : (
              <Mic className="w-3 h-3 text-gray-400" />
            )}
            {cameraOff && (
              <VideoOff className="w-3 h-3 text-red-400" />
            )}
          </div>
        </div>
      </div>

      <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {qualityIcon}
      </div>

      <button
        onClick={toggleFullscreen}
        className="absolute top-2 right-2 p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/70"
      >
        {fullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}
