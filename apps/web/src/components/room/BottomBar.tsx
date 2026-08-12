import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Globe,
  Hand,
  Smile,
  MessageSquare,
  LogOut,
} from 'lucide-react';
import { useMediaStore } from '@/stores/useMediaStore';
import { useChatStore } from '@/stores/useChatStore';
import { useWorkspaceStore } from '@/stores/useWorkspaceStore';
import EmojiPicker from './EmojiPicker';

interface BottomBarProps {
  onToggleScreenShare: () => void;
  onOpenInvite: () => void;
  onLeave: () => void;
}

export function BottomBar({ onToggleScreenShare, onOpenInvite, onLeave }: BottomBarProps) {
  const micOn = useMediaStore((s) => s.micOn);
  const cameraOn = useMediaStore((s) => s.cameraOn);
  const screenSharing = useMediaStore((s) => s.screenSharing);
  const handRaised = useMediaStore((s) => s.handRaised);
  const toggleMic = useMediaStore((s) => s.toggleMic);
  const toggleCamera = useMediaStore((s) => s.toggleCamera);
  const toggleHand = useMediaStore((s) => s.toggleHand);

  const activePanel = useWorkspaceStore((s) => s.activePanel);
  const setPanel = useWorkspaceStore((s) => s.setPanel);

  const unreadCount = useChatStore((s) => s.unreadCount);
  const clearUnread = useChatStore((s) => s.clearUnread);

  const [showReactions, setShowReactions] = useState(false);
  const reactionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (reactionsRef.current && !reactionsRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReaction = useCallback((emoji: string) => {
    const event = new CustomEvent('room:reaction', { detail: emoji });
    window.dispatchEvent(event);
    setShowReactions(false);
  }, []);

  const buttons = [
    {
      icon: micOn ? Mic : MicOff,
      label: micOn ? 'Mute' : 'Unmute',
      onClick: toggleMic,
      active: micOn,
      danger: !micOn,
    },
    {
      icon: cameraOn ? Video : VideoOff,
      label: cameraOn ? 'Turn off camera' : 'Turn on camera',
      onClick: toggleCamera,
      active: cameraOn,
      danger: !cameraOn,
    },
    {
      icon: Monitor,
      label: screenSharing ? 'Stop sharing' : 'Share screen',
      onClick: onToggleScreenShare,
      active: screenSharing,
      highlight: screenSharing,
    },
    {
      icon: Globe,
      label: 'Browser',
      onClick: () => setPanel(activePanel === 'browser' ? 'screen' : 'browser'),
      active: activePanel === 'browser',
    },
    {
      icon: Hand,
      label: handRaised ? 'Lower hand' : 'Raise hand',
      onClick: toggleHand,
      active: handRaised,
      highlight: handRaised,
      highlightColor: 'text-yellow-400',
    },
  ];

  return (
    <div className="h-16 shrink-0 flex items-center justify-center px-4 bg-white/5 backdrop-blur-xl border-t border-white/10 gap-2">
      {buttons.map((btn) => (
        <button
          key={btn.label}
          onClick={btn.onClick}
          className={`relative group w-11 h-11 rounded-full flex items-center justify-center transition-all ${
            btn.highlight
              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/40'
              : btn.danger
                ? 'bg-red-500/20 text-red-400 border border-red-500/40'
                : btn.active
                  ? 'bg-white/10 text-white border border-white/20'
                  : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white'
          }`}
        >
          <btn.icon className="w-5 h-5" />

          <span className="absolute bottom-full mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
            {btn.label}
          </span>
        </button>
      ))}

      <div className="relative" ref={reactionsRef}>
        <button
          onClick={() => setShowReactions(!showReactions)}
          className="relative group w-11 h-11 rounded-full flex items-center justify-center bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
        >
          <Smile className="w-5 h-5" />

          <span className="absolute bottom-full mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
            Reactions
          </span>
        </button>

        {showReactions && (
          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 z-50">
            <EmojiPicker onSelect={handleReaction} onClose={() => setShowReactions(false)} />
          </div>
        )}
      </div>

      <button
        onClick={() => {
          clearUnread();
          const event = new CustomEvent('room:toggle-chat');
          window.dispatchEvent(event);
        }}
        className="relative group w-11 h-11 rounded-full flex items-center justify-center bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all"
      >
        <MessageSquare className="w-5 h-5" />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center px-1 text-[10px] font-bold text-white bg-indigo-500 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}

        <span className="absolute bottom-full mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
          Chat
        </span>
      </button>

      <button
        onClick={onLeave}
        className="relative group w-11 h-11 rounded-full flex items-center justify-center bg-red-500/20 text-red-400 border border-red-500/40 hover:bg-red-500/30 transition-all"
      >
        <LogOut className="w-5 h-5" />

        <span className="absolute bottom-full mb-2 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap border border-white/10">
          Leave
        </span>
      </button>
    </div>
  );
}
