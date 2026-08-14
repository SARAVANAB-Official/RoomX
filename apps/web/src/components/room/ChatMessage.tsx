import { useState, useRef, useEffect } from 'react';
import { Trash2, Reply, Smile } from 'lucide-react';
import type { ChatMessage as ChatMessageType, ChatReaction } from '@roomx/shared';
import { useAuthStore } from '@/stores/useAuthStore';
import EmojiPicker from './EmojiPicker';

interface ChatMessageProps {
  message: ChatMessageType;
  replyToMessage?: ChatMessageType | null;
  onReply?: (message: ChatMessageType) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  isModerator?: boolean;
}

function formatRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(date).toLocaleDateString();
}

function groupReactions(reactions: ChatReaction[]): { emoji: string; count: number; userIds: string[] }[] {
  const map = new Map<string, { count: number; userIds: string[] }>();
  for (const r of reactions) {
    const entry = map.get(r.emoji) || { count: 0, userIds: [] };
    entry.count++;
    entry.userIds.push(r.userId);
    map.set(r.emoji, entry);
  }
  return Array.from(map.entries()).map(([emoji, data]) => ({ emoji, ...data }));
}

function renderMessageContent(content: string): React.ReactNode {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = content.split(urlRegex);
  return parts.map((part, i) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-indigo-400 hover:text-indigo-300 underline"
        >
          {part}
        </a>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export default function ChatMessage({
  message,
  replyToMessage,
  onReply,
  onDelete,
  onReact,
  isModerator = false,
}: ChatMessageProps) {
  const user = useAuthStore((s) => s.user);
  const [showActions, setShowActions] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const isOwn = user?.id === message.senderId;
  const canDelete = isOwn || isModerator;

  const grouped = groupReactions(message.reactions ?? []);

  const isSystemMessage = message.senderId === 'system' || (message.content ?? '').startsWith('[system]');

  if (isSystemMessage) {
    return (
      <div className="flex justify-center py-1 px-4">
        <span className="text-xs text-gray-500 italic bg-white/[0.02] rounded-full px-3 py-1">
          {message.content.replace('[system]', '').trim()}
        </span>
      </div>
    );
  }

  return (
    <div
      className="group relative px-4 py-1.5 hover:bg-white/[0.02] transition-colors"
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => {
        setShowActions(false);
        setShowEmojiPicker(false);
      }}
    >
      {replyToMessage && (
        <div className="ml-10 mb-1 pl-3 border-l-2 border-indigo-500/40 text-xs text-gray-500 line-clamp-1">
          <span className="font-medium text-gray-400">{replyToMessage.senderName}</span>
          {' '}{replyToMessage.content}
        </div>
      )}

      <div className="flex gap-3">
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shrink-0 text-xs font-bold text-white mt-0.5">
          {message.senderName?.charAt(0)?.toUpperCase() || '?'}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-gray-200">{message.senderName}</span>
            <span className="text-[10px] text-gray-600">{formatRelativeTime(message.timestamp)}</span>
          </div>

          <p className="text-sm text-gray-300 break-words mt-0.5">
            {renderMessageContent(message.content)}
          </p>

          {grouped.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {grouped.map(({ emoji, count, userIds }) => {
                const didReact = userIds.includes(user?.id || '');
                return (
                  <button
                    key={emoji}
                    onClick={() => onReact?.(message.id, emoji)}
                    className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors ${
                      didReact
                        ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    <span>{emoji}</span>
                    <span>{count}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {showActions && (
        <div className="absolute top-1 right-2 flex items-center gap-0.5 glass-card !rounded-lg !p-0.5 !border-white/20">
          <div className="relative">
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="React"
            >
              <Smile className="w-3.5 h-3.5" />
            </button>
            {showEmojiPicker && (
              <div className="absolute bottom-full right-0 mb-1 z-50">
                <EmojiPicker
                  onSelect={(emoji) => {
                    onReact?.(message.id, emoji);
                    setShowEmojiPicker(false);
                  }}
                />
              </div>
            )}
          </div>

          <button
            onClick={() => onReply?.(message)}
            className="p-1.5 rounded-md hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            title="Reply"
          >
            <Reply className="w-3.5 h-3.5" />
          </button>

          {canDelete && (
            <button
              onClick={() => onDelete?.(message.id)}
              className="p-1.5 rounded-md hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
