import { BarChart3, Users, Lock, Vote } from 'lucide-react';
import type { Poll, PollOption } from '@roomx/shared';
import { useAuthStore } from '@/stores/useAuthStore';

interface PollCardProps {
  poll: Poll;
  onVote?: (pollId: string, optionId: string) => void;
  onClose?: (pollId: string) => void;
}

export default function PollCard({ poll, onVote, onClose }: PollCardProps) {
  const user = useAuthStore((s) => s.user);
  const isClosed = poll.status === 'CLOSED';
  const hasVoted = poll.options.some((opt) =>
    (opt.votes ?? []).some((v) => v.userId === user?.id)
  );
  const canVote = !isClosed && !hasVoted && user;
  const canClose = poll.createdBy === user?.id && !isClosed;

  const votedOptionId = poll.options.find((opt) =>
    (opt.votes ?? []).some((v) => v.userId === user?.id)
  )?.id;

  return (
    <div className="glass-card !rounded-xl !p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-gray-200 line-clamp-2">{poll.question}</h4>
          <div className="flex items-center gap-3 mt-1.5">
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Users className="w-3 h-3" />
              {poll.totalVotes} vote{poll.totalVotes !== 1 ? 's' : ''}
            </span>
            {poll.isAnonymous && (
              <span className="flex items-center gap-1 text-[10px] text-gray-500">
                <Lock className="w-3 h-3" />
                Anonymous
              </span>
            )}
          </div>
        </div>
        <span
          className={`shrink-0 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            isClosed
              ? 'bg-gray-500/20 text-gray-400'
              : 'bg-green-500/20 text-green-400'
          }`}
        >
          {isClosed ? 'Closed' : 'Active'}
        </span>
      </div>

      {/* Options */}
      <div className="space-y-2">
        {poll.options.map((option) => {
          const percentage = poll.totalVotes > 0
            ? Math.round((option.voteCount / poll.totalVotes) * 100)
            : 0;
          const isSelected = votedOptionId === option.id;

          return (
            <div key={option.id} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-300">{option.text}</span>
                <span className="text-[10px] text-gray-500">
                  {option.voteCount} ({percentage}%)
                </span>
              </div>
              <div className="relative w-full h-6 rounded-lg bg-white/5 overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 rounded-lg transition-all duration-500 ${
                    isSelected
                      ? 'bg-indigo-500/40 border border-indigo-500/60'
                      : 'bg-white/10 border border-white/5'
                  }`}
                  style={{ width: `${percentage}%` }}
                />
                <div className="relative z-10 flex items-center justify-between px-3 h-full">
                  <span className="text-[10px] text-gray-300">{option.text}</span>
                  {canVote && !isSelected && (
                    <button
                      onClick={() => onVote?.(poll.id, option.id)}
                      className="px-2 py-0.5 rounded text-[10px] font-medium bg-white/10 hover:bg-indigo-500/30 text-gray-300 hover:text-indigo-300 transition-colors"
                    >
                      <Vote className="w-3 h-3 mr-1 inline" />
                      Vote
                    </button>
                  )}
                  {isSelected && (
                    <span className="text-[10px] font-medium text-indigo-400">
                      Your vote
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {canClose && (
        <button
          onClick={() => onClose?.(poll.id)}
          className="w-full py-1.5 rounded-lg border border-white/10 text-[10px] text-gray-400 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/5 transition-colors font-medium"
        >
          Close Poll
        </button>
      )}
    </div>
  );
}
