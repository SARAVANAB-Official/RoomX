import { X, UserCheck, UserX, Ban } from 'lucide-react';

interface WaitingRoomProps {
  waitingUsers: string[];
  onAdmit: (userId: string) => void;
  onReject: (userId: string) => void;
  onBan: (userId: string) => void;
  onClose: () => void;
}

export function WaitingRoom({ waitingUsers, onAdmit, onReject, onBan, onClose }: WaitingRoomProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Waiting Room</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {waitingUsers.length} {waitingUsers.length === 1 ? 'person' : 'people'} waiting
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          {waitingUsers.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <p className="text-gray-400 text-sm">No one waiting</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {waitingUsers.map((userId) => (
                <div
                  key={userId}
                  className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-xl"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm font-bold text-white">
                      {userId.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm text-gray-300 font-medium">{userId}</span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onAdmit(userId)}
                      className="p-2 rounded-lg text-green-400 hover:bg-green-500/10 transition-colors"
                      title="Admit"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onReject(userId)}
                      className="p-2 rounded-lg text-gray-400 hover:bg-white/10 transition-colors"
                      title="Reject"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onBan(userId)}
                      className="p-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors"
                      title="Reject & Ban"
                    >
                      <Ban className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
