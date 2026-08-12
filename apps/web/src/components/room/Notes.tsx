import { useState, useEffect, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { FileText, Check } from 'lucide-react';

interface NotesProps {
  socket: Socket | null;
}

export default function Notes({ socket }: NotesProps) {
  const [content, setContent] = useState('');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isRemoteUpdate = useRef(false);

  useEffect(() => {
    if (!socket) return;

    const handleNotesUpdate = ({ content: newContent }: { content: string }) => {
      isRemoteUpdate.current = true;
      setContent(newContent);
      setLastSaved(new Date());
      setTimeout(() => {
        isRemoteUpdate.current = false;
      }, 100);
    };

    socket.on('notes:update', handleNotesUpdate);
    return () => {
      socket.off('notes:update', handleNotesUpdate);
    };
  }, [socket]);

  const debouncedSend = useCallback(
    (value: string) => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        if (socket && !isRemoteUpdate.current) {
          setIsSaving(true);
          socket.emit('notes:update', { content: value });
          setTimeout(() => {
            setIsSaving(false);
            setLastSaved(new Date());
          }, 500);
        }
      }, 500);
    },
    [socket]
  );

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setContent(value);
    debouncedSend(value);
  };

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = 'auto';
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoResize();
  }, [content]);

  const getStatusText = (): string => {
    if (isSaving) return 'Saving...';
    if (lastSaved) return `Saved ${lastSaved.toLocaleTimeString()}`;
    return 'Not saved';
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-gray-200">Notes</span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-gray-500">
          {isSaving ? (
            <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
          ) : (
            <Check className="w-3 h-3 text-green-400" />
          )}
          {getStatusText()}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleChange}
          placeholder="Start writing collaborative notes..."
          className="w-full min-h-full bg-transparent text-sm text-gray-200 leading-relaxed resize-none focus:outline-none placeholder-gray-600 font-mono"
          spellCheck={false}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/10 text-[10px] text-gray-600 flex items-center justify-between">
        <span>{content.length} characters</span>
        <span>{content.split('\n').length} lines</span>
      </div>
    </div>
  );
}
