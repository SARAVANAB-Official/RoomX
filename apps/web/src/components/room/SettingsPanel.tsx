import { useState } from 'react';
import {
  X,
  Monitor,
  FileUp,
  MessageSquare,
  Video,
  Mic,
  Globe2,
  Users,
  UserPlus,
  DoorOpen,
  Lock,
  Unlock,
  Trash2,
  Loader2,
} from 'lucide-react';
import { useRoomStore } from '@/stores/useRoomStore';
import { useRoom } from '@/hooks/useRoom';

interface SettingsPanelProps {
  onClose: () => void;
}

const toggleSettings: { key: string; label: string; icon: typeof Monitor }[] = [
  { key: 'allowScreenShare', label: 'Screen Sharing', icon: Monitor },
  { key: 'allowFileShare', label: 'File Sharing', icon: FileUp },
  { key: 'allowChat', label: 'Chat', icon: MessageSquare },
  { key: 'allowCamera', label: 'Camera', icon: Video },
  { key: 'allowMicrophone', label: 'Microphone', icon: Mic },
  { key: 'allowBrowserSync', label: 'Browser Sync', icon: Globe2 },
  { key: 'allowGuests', label: 'Allow Guests', icon: UserPlus },
  { key: 'multiplePresenters', label: 'Multiple Presenters', icon: Users },
  { key: 'waitingRoom', label: 'Waiting Room', icon: DoorOpen },
];

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const currentRoom = useRoomStore((s) => s.currentRoom);
  const roomSettings = useRoomStore((s) => s.roomSettings);
  const { updateRoomSettings, lockRoom, unlockRoom } = useRoom();

  const [roomName, setRoomName] = useState(currentRoom?.name || '');
  const [saving, setSaving] = useState(false);
  const [ending, setEnding] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await updateRoomSettings({ ...roomSettings } as any);
    setSaving(false);
  };

  const handleToggle = async (key: string) => {
    if (!roomSettings) return;
    const newValue = !(roomSettings as any)[key];
    await updateRoomSettings({ [key]: newValue });
  };

  const handleLockToggle = async () => {
    if (roomSettings?.isLocked) {
      await unlockRoom();
    } else {
      await lockRoom();
    }
  };

  const handleEndRoom = async () => {
    if (!confirm('Are you sure you want to end this room for everyone?')) return;
    setEnding(true);
    // In a real app, this would call an API to end the room
    setTimeout(() => {
      setEnding(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-sm bg-gray-900/95 backdrop-blur-xl border-l border-white/10 shadow-2xl animate-slide-in-right overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-white/10 sticky top-0 bg-gray-900/95 backdrop-blur-xl z-10">
          <h2 className="text-lg font-semibold text-white">Room Settings</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">
              Room Name
            </label>
            <input
              type="text"
              value={roomName}
              onChange={(e) => setRoomName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
            />
          </div>

          <div>
            <button
              onClick={handleLockToggle}
              className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
            >
              <div className="flex items-center gap-3">
                {roomSettings?.isLocked ? (
                  <Lock className="w-4 h-4 text-red-400" />
                ) : (
                  <Unlock className="w-4 h-4 text-green-400" />
                )}
                <span className="text-sm text-gray-300">
                  {roomSettings?.isLocked ? 'Room is Locked' : 'Room is Unlocked'}
                </span>
              </div>
              <div
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  roomSettings?.isLocked ? 'bg-red-600' : 'bg-gray-700'
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    roomSettings?.isLocked ? 'left-5' : 'left-1'
                  }`}
                />
              </div>
            </button>
          </div>

          <div>
            <h3 className="text-sm font-medium text-gray-300 mb-3">Permissions</h3>
            <div className="space-y-2">
              {toggleSettings.map((s) => (
                <button
                  key={s.key}
                  onClick={() => handleToggle(s.key)}
                  className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <s.icon className="w-4 h-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{s.label}</span>
                  </div>
                  <div
                    className={`relative w-10 h-6 rounded-full transition-colors ${
                      (roomSettings as any)?.[s.key] ? 'bg-indigo-600' : 'bg-gray-700'
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        (roomSettings as any)?.[s.key] ? 'left-5' : 'left-1'
                      }`}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <button
              onClick={handleEndRoom}
              disabled={ending}
              className="w-full flex items-center justify-center gap-2 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/40 rounded-xl font-medium transition-colors disabled:opacity-50"
            >
              {ending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
              End Room
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
