import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  Monitor,
  FileUp,
  MessageSquare,
  Video,
  Mic,
  Globe2,
  Users,
  UserPlus,
  DoorOpen,
  Settings2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { makeApi } from '@/lib/api';
import { RoomPrivacy } from '@roomx/shared';

interface Settings {
  allowScreenShare: boolean;
  allowFileShare: boolean;
  allowChat: boolean;
  allowCamera: boolean;
  allowMicrophone: boolean;
  allowBrowserSync: boolean;
  allowGuests: boolean;
  multiplePresenters: boolean;
  waitingRoom: boolean;
}

const defaultSettings: Settings = {
  allowScreenShare: true,
  allowFileShare: true,
  allowChat: true,
  allowCamera: true,
  allowMicrophone: true,
  allowBrowserSync: true,
  allowGuests: true,
  multiplePresenters: true,
  waitingRoom: false,
};

const toggleSettings: { key: keyof Settings; label: string; icon: typeof Monitor }[] = [
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

export default function CreateRoom() {
  const [roomName, setRoomName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [privacy, setPrivacy] = useState<RoomPrivacy>(RoomPrivacy.PUBLIC);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [maxParticipants, setMaxParticipants] = useState(50);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const toggleSetting = (key: keyof Settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!roomName.trim()) newErrors.roomName = 'Room name is required';
    else if (roomName.length > 100) newErrors.roomName = 'Room name must be 100 characters or less';
    if (!displayName.trim()) newErrors.displayName = 'Display name is required';
    if (privacy === RoomPrivacy.PASSWORD && !password.trim()) newErrors.password = 'Password is required for private rooms';
    if (maxParticipants < 2 || maxParticipants > 100) newErrors.maxParticipants = 'Must be between 2 and 100';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const room = await makeApi<{ id: string }>('/api/rooms', {
        method: 'POST',
        body: JSON.stringify({
          name: roomName,
          maxParticipants,
          isPrivate: privacy !== RoomPrivacy.PUBLIC,
        }),
      });
      navigate(`/room/${room.id}`);
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Failed to create room' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Create a Room</h1>
          <p className="text-gray-400">Set up your collaborative space</p>
        </div>

        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8">
          {errors.general && (
            <div className="mb-6 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              {errors.general}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="roomName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Room Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="roomName"
                  type="text"
                  required
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                    errors.roomName ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder="Team standup"
                />
                {errors.roomName && <p className="mt-1 text-xs text-red-400">{errors.roomName}</p>}
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Your Display Name <span className="text-red-400">*</span>
                </label>
                <input
                  id="displayName"
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                    errors.displayName ? 'border-red-500/50' : 'border-white/10'
                  }`}
                  placeholder={user?.displayName || 'Your name'}
                />
                {errors.displayName && <p className="mt-1 text-xs text-red-400">{errors.displayName}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-3">
                  Privacy
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: RoomPrivacy.PUBLIC, label: 'Public', icon: Globe, desc: 'Anyone can join' },
                    { value: RoomPrivacy.PASSWORD, label: 'Password', icon: Lock, desc: 'Needs password' },
                    { value: RoomPrivacy.PRIVATE, label: 'Private', icon: EyeOff, desc: 'Invite only' },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPrivacy(option.value)}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        privacy === option.value
                          ? 'bg-indigo-500/20 border-indigo-500/50 text-white'
                          : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                      }`}
                    >
                      <option.icon className="w-5 h-5 mx-auto mb-1" />
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs opacity-60">{option.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {privacy === RoomPrivacy.PASSWORD && (
                <div>
                  <label htmlFor="roomPassword" className="block text-sm font-medium text-gray-300 mb-1.5">
                    Room Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                    <input
                      id="roomPassword"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full pl-11 pr-12 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                        errors.password ? 'border-red-500/50' : 'border-white/10'
                      }`}
                      placeholder="Enter room password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password}</p>}
                </div>
              )}

              <div>
                <label htmlFor="maxParticipants" className="block text-sm font-medium text-gray-300 mb-1.5">
                  Max Participants
                </label>
                <input
                  id="maxParticipants"
                  type="number"
                  min={2}
                  max={100}
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(Number(e.target.value))}
                  className={`w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all ${
                    errors.maxParticipants ? 'border-red-500/50' : 'border-white/10'
                  }`}
                />
                {errors.maxParticipants && <p className="mt-1 text-xs text-red-400">{errors.maxParticipants}</p>}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <Settings2 className="w-5 h-5 text-gray-400" />
                <h3 className="text-sm font-medium text-gray-300">Room Settings</h3>
              </div>
              <div className="space-y-2">
                {toggleSettings.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    onClick={() => toggleSetting(s.key)}
                    className="flex items-center justify-between w-full p-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/[0.08] transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <s.icon className="w-4 h-4 text-gray-400" />
                      <span className="text-sm text-gray-300">{s.label}</span>
                    </div>
                    <div
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        settings[s.key] ? 'bg-indigo-600' : 'bg-gray-700'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                          settings[s.key] ? 'left-5' : 'left-1'
                        }`}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 text-white rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating room...
                </>
              ) : (
                'Create Room'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
