import { useState, useRef, useEffect, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  Send,
  Search,
  Pin,
  X,
  Loader2,
  MessageSquare,
} from 'lucide-react';
import type { ChatMessage } from '@roomx/shared';
import { useChatStore } from '@/stores/useChatStore';
import { useRoomStore } from '@/stores/useRoomStore';
import { useAuthStore } from '@/stores/useAuthStore';
import ChatMessageComponent from './ChatMessage';

interface ChatPanelProps {
  socket: Socket | null;
}

export default function ChatPanel({ socket }: ChatPanelProps) {
  const messages = useChatStore((s) => s.messages);
  const typingUsers = useChatStore((s) => s.typingUsers);
  const members = useRoomStore((s) => s.members);
  const user = useAuthStore((s) => s.user);

  const [input, setInput] = useState('');
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const pinnedMessages = messages.filter(
    (m) => !m.isDeleted && (m.reactions ?? []).some((r) => r.emoji === '📌')
  );

  const filteredMessages = searchQuery
    ? messages.filter(
        (m) =>
          !m.isDeleted &&
          (m.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.senderName.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : messages.filter((m) => !m.isDeleted);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || !socket) return;

    const messageData = {
      content: text,
      replyTo: replyTo?.id || undefined,
    };

    socket.emit('chat:message', messageData);
    setInput('');
    setReplyTo(null);
    handleTypingStop();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTypingStart = () => {
    if (!isTyping && socket) {
      setIsTyping(true);
      socket.emit('chat:typing', { isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => handleTypingStop(), 2000);
  };

  const handleTypingStop = () => {
    if (isTyping && socket) {
      setIsTyping(false);
      socket.emit('chat:typing', { isTyping: false });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleDelete = (messageId: string) => {
    socket?.emit('chat:message-delete', { messageId });
  };

  const handleReact = (messageId: string, emoji: string) => {
    socket?.emit('chat:react', { messageId, emoji });
  };

  const getMemberName = (userId: string): string => {
    const member = members.find((m) => m.userId === userId);
    return member?.user.displayName || 'Unknown';
  };

  const typingNames = typingUsers
    .filter((id) => id !== user?.id)
    .map((id) => getMemberName(id));

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-gray-200">Chat</span>
          {pinnedMessages.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
              <Pin className="w-3 h-3" />
              {pinnedMessages.length}
            </span>
          )}
        </div>
        <button
          onClick={() => setShowSearch(!showSearch)}
          className={`p-1.5 rounded-lg transition-colors ${
            showSearch ? 'bg-white/10 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'
          }`}
        >
          {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 py-2 border-b border-white/10">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="w-full glass-input !py-1.5 !px-3 text-xs !rounded-lg"
          />
        </div>
      )}

      {/* Pinned messages */}
      {pinnedMessages.length > 0 && !searchQuery && (
        <div className="px-4 py-2 border-b border-white/10 bg-yellow-400/[0.03]">
          <div className="flex items-center gap-1.5 text-[10px] text-yellow-400 font-medium mb-1">
            <Pin className="w-3 h-3" />
            Pinned
          </div>
          {pinnedMessages.slice(0, 2).map((msg) => (
            <p key={msg.id} className="text-xs text-gray-400 line-clamp-1">
              <span className="font-medium text-gray-300">{msg.senderName}:</span> {msg.content}
            </p>
          ))}
        </div>
      )}

      {/* Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto py-2 space-y-0.5"
      >
        {filteredMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <MessageSquare className="w-8 h-8 mb-2" />
            <p className="text-xs">{searchQuery ? 'No messages found' : 'No messages yet'}</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <ChatMessageComponent
              key={msg.id}
              message={msg}
              replyToMessage={
                msg.replyTo
                  ? messages.find((m) => m.id === msg.replyTo) || null
                  : null
              }
              onReply={setReplyTo}
              onDelete={handleDelete}
              onReact={handleReact}
              isModerator={
                user?.role === 'OWNER' || user?.role === 'MODERATOR'
              }
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Typing indicator */}
      {typingNames.length > 0 && (
        <div className="px-4 py-1 text-[10px] text-gray-500">
          {typingNames.length === 1
            ? `${typingNames[0]} is typing...`
            : `${typingNames.join(', ')} are typing...`}
        </div>
      )}

      {/* Reply indicator */}
      {replyTo && (
        <div className="mx-4 mb-1 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-between">
          <div className="text-xs min-w-0">
            <span className="text-indigo-400 font-medium">Replying to {replyTo.senderName}</span>
            <span className="text-gray-500 ml-2 line-clamp-1">{replyTo.content}</span>
          </div>
          <button
            onClick={() => setReplyTo(null)}
            className="text-gray-500 hover:text-white shrink-0 ml-2"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              handleTypingStart();
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 glass-input !py-2 !px-3 text-sm !rounded-xl"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all text-white"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
