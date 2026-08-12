import { useState } from 'react';
import { Socket } from 'socket.io-client';
import { Plus, X, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import type { Poll } from '@roomx/shared';
import { usePollStore } from '@/stores/usePollStore';
import { useAuthStore } from '@/stores/useAuthStore';
import PollCard from './PollCard';

interface PollPanelProps {
  socket: Socket | null;
}

export default function PollPanel({ socket }: PollPanelProps) {
  const polls = usePollStore((s) => s.polls);
  const user = useAuthStore((s) => s.user);

  const [showCreate, setShowCreate] = useState(false);
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showClosed, setShowClosed] = useState(false);

  const activePolls = polls.filter((p) => p.status === 'ACTIVE');
  const closedPolls = polls.filter((p) => p.status === 'CLOSED');

  const handleAddOption = () => {
    if (options.length < 6) setOptions([...options, '']);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) setOptions(options.filter((_, i) => i !== index));
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleCreate = () => {
    if (!question.trim() || options.filter((o) => o.trim()).length < 2 || !socket) return;

    socket.emit('poll:create', {
      question: question.trim(),
      options: options.filter((o) => o.trim()).map((text) => ({ text: text.trim() })),
      isAnonymous,
    });

    setQuestion('');
    setOptions(['', '']);
    setIsAnonymous(false);
    setShowCreate(false);
  };

  const handleVote = (pollId: string, optionId: string) => {
    socket?.emit('poll:vote', { pollId, optionId });
  };

  const handleClose = (pollId: string) => {
    socket?.emit('poll:close', { pollId });
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-gray-200">Polls</span>
          {activePolls.length > 0 && (
            <span className="text-[10px] text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full">
              {activePolls.length} active
            </span>
          )}
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className={`p-1.5 rounded-lg transition-colors ${
            showCreate ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {showCreate ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="px-4 py-3 border-b border-white/10 space-y-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask a question..."
            className="w-full glass-input !py-2 !px-3 text-sm !rounded-lg"
          />

          <div className="space-y-2">
            {options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handleOptionChange(i, e.target.value)}
                  placeholder={`Option ${i + 1}`}
                  className="flex-1 glass-input !py-1.5 !px-3 text-xs !rounded-lg"
                />
                {options.length > 2 && (
                  <button
                    onClick={() => handleRemoveOption(i)}
                    className="p-1 rounded text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {options.length < 6 && (
            <button
              onClick={handleAddOption}
              className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              + Add option
            </button>
          )}

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="rounded border-white/20 bg-white/5 text-indigo-500 focus:ring-indigo-500/50"
              />
              Anonymous voting
            </label>
            <button
              onClick={handleCreate}
              disabled={!question.trim() || options.filter((o) => o.trim()).length < 2}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed text-xs font-medium text-white transition-colors"
            >
              Create Poll
            </button>
          </div>
        </div>
      )}

      {/* Polls list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {activePolls.length === 0 && closedPolls.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <BarChart3 className="w-8 h-8 mb-2" />
            <p className="text-xs">No polls yet</p>
          </div>
        )}

        {activePolls.map((poll) => (
          <PollCard
            key={poll.id}
            poll={poll}
            onVote={handleVote}
            onClose={handleClose}
          />
        ))}

        {closedPolls.length > 0 && (
          <div>
            <button
              onClick={() => setShowClosed(!showClosed)}
              className="flex items-center gap-1.5 text-[10px] text-gray-500 hover:text-gray-300 transition-colors mb-2"
            >
              {showClosed ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Closed polls ({closedPolls.length})
            </button>
            {showClosed && (
              <div className="space-y-3">
                {closedPolls.map((poll) => (
                  <PollCard key={poll.id} poll={poll} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
