import {
  Users,
  UserPlus,
  Settings,
  LogOut,
  Circle,
} from 'lucide-react';

interface TopBarProps {
  roomName: string;
  connected: boolean;
  connectError?: string | null;
  participantCount: number;
  onInvite: () => void;
  onSettings: () => void;
  onParticipants: () => void;
  onLeave: () => void;
  isOwner: boolean;
}

export function TopBar({
  roomName,
  connected,
  connectError,
  participantCount,
  onInvite,
  onSettings,
  onParticipants,
  onLeave,
  isOwner,
}: TopBarProps) {
  const statusColor = connected
    ? 'text-green-400'
    : connectError
      ? 'text-red-400'
      : 'text-yellow-400';
  const statusLabel = connected
    ? 'Connected'
    : connectError
      ? `Error: ${connectError}`
      : 'Connecting...';

  return (
    <div className="h-14 shrink-0 flex items-center justify-between px-4 bg-white/5 backdrop-blur-xl border-b border-white/10">
      <div className="flex items-center gap-3 min-w-0">
        <h1 className="text-sm font-semibold text-white truncate max-w-[200px]">
          {roomName}
        </h1>

        <div className="flex items-center gap-1.5" title={statusLabel}>
          <Circle className={`w-2 h-2 fill-current ${statusColor}`} />
          <span className="text-xs text-gray-400 hidden sm:inline">{statusLabel}</span>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onParticipants}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-gray-300 hover:bg-white/10 transition-colors"
          title="Participants"
        >
          <Users className="w-4 h-4" />
          <span className="text-xs font-medium">{participantCount}</span>
        </button>

        <button
          onClick={onInvite}
          className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Invite"
        >
          <UserPlus className="w-4 h-4" />
        </button>

        {isOwner && (
          <button
            onClick={onSettings}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}

        <button
          onClick={onLeave}
          className="ml-2 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 border border-red-500/20 transition-colors"
          title="Leave room"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>
    </div>
  );
}
