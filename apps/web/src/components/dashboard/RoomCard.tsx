import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Copy, Trash2, Users, Calendar } from 'lucide-react';
import Badge from '@/components/ui/Badge';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';

interface RoomCardProps {
  room: {
    id: string;
    name: string;
    code: string;
    createdAt: string;
    isActive: boolean;
    participantCount: number;
  };
  onDelete?: (id: string) => void;
}

export default function RoomCard({ room, onDelete }: RoomCardProps) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const addToast = useToast();

  const handleCopyLink = () => {
    const link = `${window.location.origin}/join/${room.code}`;
    navigator.clipboard.writeText(link);
    addToast({ type: 'success', message: 'Room link copied to clipboard' });
  };

  const handleDelete = () => {
    onDelete?.(room.id);
    setShowDeleteModal(false);
    addToast({ type: 'success', message: 'Room deleted successfully' });
  };

  const createdDate = new Date(room.createdAt);
  const timeAgo = getTimeAgo(createdDate);

  return (
    <>
      <div className="group bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:bg-white/[0.08] hover:border-white/20 transition-all duration-200">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-white truncate">{room.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <code className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded">
                {room.code}
              </code>
              <Badge
                variant={room.isActive ? 'success' : 'default'}
                dot
              >
                {room.isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
          <span className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" />
            {room.participantCount} participants
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            {timeAgo}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/room/${room.id}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded-xl transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Open
          </Link>
          <button
            onClick={handleCopyLink}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
            title="Copy link"
          >
            <Copy className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 hover:text-red-400 hover:bg-red-500/10 hover:border-red-500/20 transition-colors"
            title="Delete room"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Room"
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDelete}>
              Delete Room
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-400">
          Are you sure you want to delete <span className="text-white font-medium">{room.name}</span>?
          This action cannot be undone. All participants will be disconnected.
        </p>
      </Modal>
    </>
  );
}

function getTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, 'year'],
    [2592000, 'month'],
    [604800, 'week'],
    [86400, 'day'],
    [3600, 'hour'],
    [60, 'minute'],
  ];

  for (const [secs, label] of intervals) {
    const count = Math.floor(seconds / secs);
    if (count >= 1) {
      return `${count} ${label}${count > 1 ? 's' : ''} ago`;
    }
  }
  return 'Just now';
}
