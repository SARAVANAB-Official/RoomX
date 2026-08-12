import { useState, useCallback } from 'react';
import {
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  Crown,
  Shield,
  User,
  MoreVertical,
  VolumeX,
  UserMinus,
  Ban,
  Users,
} from 'lucide-react';
import { useRoomStore } from '@/stores/useRoomStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRoom } from '@/hooks/useRoom';
import type { RoomMember } from '@roomx/shared';

interface ParticipantsListProps {
  onClose: () => void;
}

type UserRole = 'OWNER' | 'MODERATOR' | 'MEMBER' | 'GUEST';

const roleOrder: Record<UserRole, number> = {
  OWNER: 0,
  MODERATOR: 1,
  MEMBER: 2,
  GUEST: 3,
};

const roleLabels: Record<UserRole, string> = {
  OWNER: 'Owner',
  MODERATOR: 'Moderators',
  MEMBER: 'Members',
  GUEST: 'Guests',
};

const roleIcons: Record<UserRole, typeof Crown> = {
  OWNER: Crown,
  MODERATOR: Shield,
  MEMBER: User,
  GUEST: User,
};

function groupByRole(members: RoomMember[]): Map<UserRole, RoomMember[]> {
  const groups = new Map<UserRole, RoomMember[]>();
  const sorted = [...members].sort(
    (a, b) => (roleOrder[a.user?.role as UserRole] || 3) - (roleOrder[b.user?.role as UserRole] || 3)
  );

  for (const member of sorted) {
    const role = (member.user?.role as UserRole) || 'MEMBER';
    if (!groups.has(role)) {
      groups.set(role, []);
    }
    groups.get(role)!.push(member);
  }

  return groups;
}

export function ParticipantsList({ onClose }: ParticipantsListProps) {
  const members = useRoomStore((s) => s.members);
  const currentUser = useAuthStore((s) => s.user);
  const { kickMember } = useRoom();

  const [contextMenu, setContextMenu] = useState<string | null>(null);

  const groups = groupByRole(members);

  const isModeratorOrOwner = members.some(
    (m) =>
      m.userId === currentUser?.id &&
      (m.user?.role === 'OWNER' || m.user?.role === 'MODERATOR')
  );

  const handleContextMenu = useCallback((userId: string) => {
    setContextMenu((prev) => (prev === userId ? null : userId));
  }, []);

  const handleKick = useCallback(
    async (userId: string) => {
      await kickMember(userId);
      setContextMenu(null);
    },
    [kickMember]
  );

  const handleMute = useCallback((userId: string) => {
    const event = new CustomEvent('room:mute-user', { detail: userId });
    window.dispatchEvent(event);
    setContextMenu(null);
  }, []);

  const handleBan = useCallback((userId: string) => {
    const event = new CustomEvent('room:ban-user', { detail: userId });
    window.dispatchEvent(event);
    setContextMenu(null);
  }, []);

  return (
    <div className="h-full flex flex-col bg-gray-900/50">
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-white">Participants</h3>
          <span className="text-xs text-gray-400">({members.length})</span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {Array.from(groups.entries()).map(([role, roleMembers]) => {
          const RoleIcon = roleIcons[role];
          return (
            <div key={role}>
              <div className="flex items-center gap-2 px-2 mb-2">
                <RoleIcon className="w-3 h-3 text-gray-500" />
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  {roleLabels[role]}
                </span>
                <span className="text-[11px] text-gray-600">{roleMembers.length}</span>
              </div>

              <div className="space-y-1">
                {roleMembers.map((member) => (
                  <div
                    key={member.userId}
                    className="relative flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
                  >
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white overflow-hidden">
                        {member.user?.avatarUrl ? (
                          <img
                            src={member.user.avatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          member.user?.displayName?.charAt(0)?.toUpperCase() || '?'
                        )}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-gray-900" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200 truncate">
                        {member.user?.displayName || 'Unknown'}
                        {member.userId === currentUser?.id && (
                          <span className="text-xs text-gray-500 ml-1">(You)</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      {member.isMuted ? (
                        <MicOff className="w-3.5 h-3.5 text-red-400" />
                      ) : (
                        <Mic className="w-3.5 h-3.5 text-gray-500" />
                      )}
                      {!member.isCameraOn && (
                        <VideoOff className="w-3.5 h-3.5 text-red-400" />
                      )}
                      {member.isScreenSharing && (
                        <Monitor className="w-3.5 h-3.5 text-green-400" />
                      )}
                    </div>

                    {isModeratorOrOwner && member.userId !== currentUser?.id && role !== 'OWNER' && (
                      <div className="relative">
                        <button
                          onClick={() => handleContextMenu(member.userId)}
                          className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>

                        {contextMenu === member.userId && (
                          <div className="absolute right-0 top-full mt-1 z-50 w-40 bg-gray-900 border border-white/10 rounded-xl shadow-xl py-1 animate-fade-in">
                            <button
                              onClick={() => handleMute(member.userId)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                            >
                              <VolumeX className="w-3.5 h-3.5" />
                              Mute
                            </button>
                            <button
                              onClick={() => handleKick(member.userId)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-gray-300 hover:bg-white/10 transition-colors"
                            >
                              <UserMinus className="w-3.5 h-3.5" />
                              Kick
                            </button>
                            <button
                              onClick={() => handleBan(member.userId)}
                              className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              Ban
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
