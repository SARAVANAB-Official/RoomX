import { useState, useCallback, type KeyboardEvent } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  RotateCw,
  Home,
  Plus,
  Wifi,
  WifiOff,
  Users,
  Monitor,
} from 'lucide-react';

type SyncMode = 'off' | 'presenter' | 'everyone';

interface BrowserToolbarProps {
  url: string;
  onNavigate: (url: string) => void;
  onBack: () => void;
  onForward: () => void;
  onReload: () => void;
  onHome: () => void;
  onNewTab: () => void;
  syncMode: SyncMode;
  onSyncModeChange: (mode: SyncMode) => void;
}

const BLOCKED_PROTOCOLS = ['javascript:', 'data:', 'file:', 'vbscript:', 'blob:', 'about:'];

function validateUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  const lower = trimmed.toLowerCase();
  for (const proto of BLOCKED_PROTOCOLS) {
    if (lower.startsWith(proto)) return null;
  }

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
    return `https://${trimmed}`;
  }

  try {
    new URL(trimmed);
    return trimmed;
  } catch {
    return null;
  }
}

const SYNC_LABELS: Record<SyncMode, string> = {
  off: 'Sync OFF',
  presenter: 'Presenter Only',
  everyone: 'Everyone',
};

export default function BrowserToolbar({
  url,
  onNavigate,
  onBack,
  onForward,
  onReload,
  onHome,
  onNewTab,
  syncMode,
  onSyncModeChange,
}: BrowserToolbarProps) {
  const [inputValue, setInputValue] = useState(url);
  const [isFocused, setIsFocused] = useState(false);

  const handleGo = useCallback(() => {
    const validated = validateUrl(inputValue);
    if (validated) {
      onNavigate(validated);
      setInputValue(validated);
    }
  }, [inputValue, onNavigate]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleGo();
      }
    },
    [handleGo]
  );

  const cycleSyncMode = useCallback(() => {
    const modes: SyncMode[] = ['off', 'presenter', 'everyone'];
    const idx = modes.indexOf(syncMode);
    onSyncModeChange(modes[(idx + 1) % modes.length]);
  }, [syncMode, onSyncModeChange]);

  return (
    <div className="flex items-center gap-1 px-2 py-1.5 bg-white/5 backdrop-blur-md border-b border-white/10">
      <button
        onClick={onBack}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Back"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <button
        onClick={onForward}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Forward"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      <button
        onClick={onReload}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Reload"
      >
        <RotateCw className="w-4 h-4" />
      </button>

      <button
        onClick={onHome}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="Home"
      >
        <Home className="w-4 h-4" />
      </button>

      <div className="flex-1 flex items-center mx-1">
        <div
          className={`flex items-center flex-1 bg-white/5 border rounded-lg px-3 py-1 transition-colors ${
            isFocused ? 'border-indigo-500/50 bg-white/10' : 'border-white/10'
          }`}
        >
          <span className="text-gray-500 text-xs select-none mr-1.5">https://</span>
          <input
            type="text"
            value={inputValue.replace(/^https?:\/\//, '')}
            onChange={(e) => {
              const prefix = inputValue.match(/^https?:\/\//)?.[0] || 'https://';
              setInputValue(prefix + e.target.value);
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            onKeyDown={handleKeyDown}
            placeholder="Enter URL..."
            className="flex-1 bg-transparent text-white text-xs outline-none placeholder-gray-600"
          />
        </div>
      </div>

      <button
        onClick={onNewTab}
        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        title="New Tab"
      >
        <Plus className="w-4 h-4" />
      </button>

      <div className="w-px h-5 bg-white/10 mx-1" />

      <button
        onClick={cycleSyncMode}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
          syncMode === 'off'
            ? 'text-gray-500 hover:bg-white/5'
            : syncMode === 'presenter'
              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
              : 'bg-green-500/10 text-green-400 border border-green-500/20'
        }`}
        title={`Sync: ${SYNC_LABELS[syncMode]}`}
      >
        {syncMode === 'off' ? (
          <WifiOff className="w-3.5 h-3.5" />
        ) : syncMode === 'presenter' ? (
          <Monitor className="w-3.5 h-3.5" />
        ) : (
          <Users className="w-3.5 h-3.5" />
        )}
        <span>{SYNC_LABELS[syncMode]}</span>
      </button>
    </div>
  );
}
