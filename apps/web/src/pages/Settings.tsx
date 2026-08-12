import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Settings as SettingsIcon, Monitor, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Toggle from '@/components/ui/Toggle';
import Spinner from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/Toast';

interface SettingsState {
  displayName: string;
  avatarUrl: string;
  theme: 'dark' | 'light' | 'system';
  defaultCamera: string;
  defaultMic: string;
  chatNotifications: boolean;
  joinNotifications: boolean;
  showOnlineStatus: boolean;
  allowDMs: boolean;
}

export default function Settings() {
  const { user, loading: authLoading } = useAuthStore();
  const addToast = useToast();

  const [settings, setSettings] = useState<SettingsState>({
    displayName: '',
    avatarUrl: '',
    theme: 'dark',
    defaultCamera: '',
    defaultMic: '',
    chatNotifications: true,
    joinNotifications: true,
    showOnlineStatus: true,
    allowDMs: true,
  });

  const [saving, setSaving] = useState(false);
  const [devices, setDevices] = useState<{ cameras: MediaDeviceInfo[]; mics: MediaDeviceInfo[] }>({
    cameras: [],
    mics: [],
  });

  useEffect(() => {
    if (user) {
      setSettings((prev) => ({
        ...prev,
        displayName: user.displayName || '',
        avatarUrl: user.avatarUrl || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      setDevices({
        cameras: allDevices.filter((d) => d.kind === 'videoinput'),
        mics: allDevices.filter((d) => d.kind === 'audioinput'),
      });
    } catch {
      // Device enumeration not available
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Simulated save - replace with actual API
      await new Promise((r) => setTimeout(r, 600));
      localStorage.setItem('roomx-settings', JSON.stringify(settings));
      addToast({ type: 'success', message: 'Settings saved successfully' });
    } catch {
      addToast({ type: 'error', message: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner size="lg" text="Loading settings..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <SettingsIcon className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Settings</h1>
          <p className="text-gray-400 mb-8">
            Sign in to access your settings and customize your RoomX experience.
          </p>
          <Link to="/login">
            <Button size="lg">
              Sign In
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const themeOptions: { value: SettingsState['theme']; label: string; icon: typeof Monitor }[] = [
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Customize your RoomX experience</p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Profile</h2>
          <div className="flex items-center gap-4 mb-6">
            <Avatar src={settings.avatarUrl || user.avatarUrl} name={settings.displayName || user.displayName} size="lg" />
            <div>
              <p className="text-sm font-medium text-white">{user.displayName}</p>
              <p className="text-xs text-gray-500">{user.email}</p>
            </div>
          </div>
          <div className="space-y-4">
            <Input
              label="Display Name"
              value={settings.displayName}
              onChange={(e) => setSettings((prev) => ({ ...prev, displayName: e.target.value }))}
              placeholder="Your display name"
            />
            <Input
              label="Avatar URL"
              value={settings.avatarUrl}
              onChange={(e) => setSettings((prev) => ({ ...prev, avatarUrl: e.target.value }))}
              placeholder="https://example.com/avatar.jpg"
            />
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                value={user.email || ''}
                disabled
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed here</p>
            </div>
          </div>
        </div>

        {/* Appearance Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Appearance</h2>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-3">Theme</label>
            <div className="flex gap-3">
              {themeOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <button
                    key={option.value}
                    onClick={() => setSettings((prev) => ({ ...prev, theme: option.value }))}
                    className={`
                      flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all
                      ${settings.theme === option.value
                        ? 'bg-indigo-600/20 border-indigo-500/40 text-indigo-400'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                      }
                    `}
                  >
                    <Icon className="w-4 h-4" />
                    {option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Audio/Video Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Audio & Video</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Camera</label>
              <select
                value={settings.defaultCamera}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultCamera: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">Select camera</option>
                {devices.cameras.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">Default Microphone</label>
              <select
                value={settings.defaultMic}
                onChange={(e) => setSettings((prev) => ({ ...prev, defaultMic: e.target.value }))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
              >
                <option value="">Select microphone</option>
                {devices.mics.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Microphone ${device.deviceId.slice(0, 8)}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Notifications Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Notifications</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Chat Notifications</p>
                <p className="text-xs text-gray-500">Receive notifications for new messages</p>
              </div>
              <Toggle
                checked={settings.chatNotifications}
                onChange={(checked) => setSettings((prev) => ({ ...prev, chatNotifications: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Join Notifications</p>
                <p className="text-xs text-gray-500">Get notified when someone joins a room</p>
              </div>
              <Toggle
                checked={settings.joinNotifications}
                onChange={(checked) => setSettings((prev) => ({ ...prev, joinNotifications: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Privacy Section */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
          <h2 className="text-lg font-semibold text-white mb-6">Privacy</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Show Online Status</p>
                <p className="text-xs text-gray-500">Let others see when you're online</p>
              </div>
              <Toggle
                checked={settings.showOnlineStatus}
                onChange={(checked) => setSettings((prev) => ({ ...prev, showOnlineStatus: checked }))}
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Allow Direct Messages</p>
                <p className="text-xs text-gray-500">Allow other users to send you DMs</p>
              </div>
              <Toggle
                checked={settings.allowDMs}
                onChange={(checked) => setSettings((prev) => ({ ...prev, allowDMs: checked }))}
              />
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving} disabled={saving}>
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
