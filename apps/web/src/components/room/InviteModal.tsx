import { useState, useCallback } from 'react';
import { X, Copy, Check, Share2, QrCode } from 'lucide-react';

interface InviteModalProps {
  roomId: string;
  roomName: string;
  onClose: () => void;
}

export function InviteModal({ roomId, roomName, onClose }: InviteModalProps) {
  const [copied, setCopied] = useState(false);

  const roomUrl = `${window.location.origin}/join/${roomId}`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(roomUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const textArea = document.createElement('textarea');
      textArea.value = roomUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [roomUrl]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join ${roomName}`,
          text: `Join the room "${roomName}" on RoomX`,
          url: roomUrl,
        });
      } catch {
        // user cancelled or error
      }
    } else {
      handleCopy();
    }
  }, [roomUrl, roomName, handleCopy]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md mx-4 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl animate-fade-in">
        <div className="flex items-center justify-between p-5 border-b border-white/10">
          <div>
            <h2 className="text-lg font-semibold text-white">Invite to Room</h2>
            <p className="text-sm text-gray-400 mt-0.5">{roomName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Link
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 font-mono truncate">
                {roomUrl}
              </div>
              <button
                onClick={handleCopy}
                className={`p-2.5 rounded-xl border transition-all ${
                  copied
                    ? 'bg-green-500/20 border-green-500/40 text-green-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Room Code
            </label>
            <div className="px-3 py-2.5 bg-white/5 border border-white/10 rounded-xl text-sm text-gray-300 font-mono text-center tracking-wider">
              {roomId}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="w-32 h-32 bg-white/5 border border-white/10 rounded-xl flex flex-col items-center justify-center gap-2">
              <QrCode className="w-12 h-12 text-gray-600" />
              <span className="text-[10px] text-gray-500">QR Code</span>
            </div>
          </div>

          <button
            onClick={handleShare}
            className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-medium transition-colors"
          >
            <Share2 className="w-4 h-4" />
            Share Invite
          </button>
        </div>
      </div>
    </div>
  );
}
