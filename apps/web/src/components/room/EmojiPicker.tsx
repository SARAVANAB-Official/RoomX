import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  onClose?: () => void;
}

const EMOJI_LIST = ['👍', '❤️', '😂', '👏', '🎉', '🔥', '😮', '😢'];

export default function EmojiPicker({ onSelect, onClose }: EmojiPickerProps) {
  return (
    <div className="glass-card p-2 inline-flex flex-wrap gap-1 w-fit max-w-[200px]">
      {EMOJI_LIST.map((emoji) => (
        <button
          key={emoji}
          onClick={() => {
            onSelect(emoji);
            onClose?.();
          }}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-lg"
        >
          {emoji}
        </button>
      ))}
    </div>
  );
}

export { EMOJI_LIST };
