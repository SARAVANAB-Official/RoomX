import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  LogIn,
  LayoutDashboard,
  Sparkles,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { useAuthStore } from '@/lib/store';
import { makeApi } from '@/lib/api';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Spinner from '@/components/ui/Spinner';
import RoomCard from '@/components/dashboard/RoomCard';
import EmptyState from '@/components/dashboard/EmptyState';
import { useToast } from '@/components/ui/Toast';

interface Room {
  id: string;
  name: string;
  code: string;
  createdAt: string;
  isActive: boolean;
  participantCount: number;
}

function RoomCardSkeleton() {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 animate-pulse">
      <div className="h-5 bg-white/10 rounded w-3/4 mb-3" />
      <div className="flex gap-2 mb-4">
        <div className="h-4 bg-white/10 rounded w-16" />
        <div className="h-4 bg-white/10 rounded w-14" />
      </div>
      <div className="flex gap-4 mb-4">
        <div className="h-3 bg-white/10 rounded w-20" />
        <div className="h-3 bg-white/10 rounded w-24" />
      </div>
      <div className="flex gap-2">
        <div className="h-9 bg-white/10 rounded-xl flex-1" />
        <div className="h-9 bg-white/10 rounded-xl w-10" />
        <div className="h-9 bg-white/10 rounded-xl w-10" />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuthStore();
  const addToast = useToast();

  const [myRooms, setMyRooms] = useState<Room[]>([]);
  const [recentRooms, setRecentRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      fetchRooms();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const fetchRooms = async () => {
    setLoading(true);
    try {
      const data = await makeApi<{ data: any[] }>('/api/rooms/mine');
      setMyRooms((data.data || []).map((r: any) => ({
        id: r.id,
        name: r.name,
        code: r.code,
        createdAt: r.created_at || r.createdAt,
        isActive: true,
        participantCount: r.participant_count || 0,
      })));
      setRecentRooms([]);
    } catch {
      setMyRooms([]);
      setRecentRooms([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoom = (id: string) => {
    setMyRooms((prev) => prev.filter((r) => r.id !== id));
  };

  const handleJoinRoom = () => {
    if (joinCode.trim()) {
      navigate(`/join/${joinCode.trim()}`);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
        <Spinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 border border-white/10 flex items-center justify-center mx-auto mb-6">
            <LayoutDashboard className="w-10 h-10 text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Welcome to RoomX</h1>
          <p className="text-gray-400 mb-8">
            Sign in to access your dashboard, manage rooms, and collaborate with your team.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link to="/login">
              <Button size="lg">
                Sign In
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary" size="lg">
                Create Account
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Profile Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <Avatar src={user.avatarUrl} name={user.displayName} size="lg" showOnline isOnline />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{user.displayName}</h1>
            <p className="text-sm text-gray-400">{user.email}</p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/create">
              <Button icon={<Plus className="w-4 h-4" />}>
                Create Room
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Join */}
      <div className="mb-8">
        <div className="flex items-center gap-3 max-w-md">
          <div className="flex-1">
            <Input
              placeholder="Enter room code..."
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
            />
          </div>
          <Button
            variant="secondary"
            onClick={handleJoinRoom}
            disabled={!joinCode.trim()}
            icon={<LogIn className="w-4 h-4" />}
          >
            Join
          </Button>
        </div>
      </div>

      {/* My Rooms */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            My Rooms
          </h2>
          <Link to="/create" className="text-sm text-indigo-400 hover:text-indigo-300 transition-colors">
            View all
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : myRooms.length === 0 ? (
          <EmptyState
            title="No rooms yet"
            description="Create your first room to start collaborating with your team."
            actionLabel="Create Room"
            onAction={() => navigate('/create')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myRooms.map((room) => (
              <RoomCard key={room.id} room={room} onDelete={handleDeleteRoom} />
            ))}
          </div>
        )}
      </section>

      {/* Recent Rooms */}
      <section>
        <h2 className="text-lg font-semibold text-white mb-6">Recent Rooms</h2>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 2 }).map((_, i) => (
              <RoomCardSkeleton key={i} />
            ))}
          </div>
        ) : recentRooms.length === 0 ? (
          <EmptyState
            title="No recent activity"
            description="Rooms you join will appear here for quick access."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentRooms.map((room) => (
              <RoomCard key={room.id} room={room} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
