import { useState, useRef, useCallback, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import BrowserError from './BrowserError';

interface BrowserContentProps {
  url: string;
  onUrlChange?: (url: string) => void;
}

export default function BrowserContent({ url, onUrlChange }: BrowserContentProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [url]);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
    try {
      const iframe = iframeRef.current;
      if (iframe?.contentWindow) {
        const title = iframe.contentDocument?.title || url;
        onUrlChange?.(title);
      }
    } catch {
      // Cross-origin — cannot access iframe content
    }
  }, [url, onUrlChange]);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const handleTryAnother = useCallback(() => {
    setHasError(false);
    onUrlChange?.('');
  }, [onUrlChange]);

  if (!url) {
    return (
      <div className="flex items-center justify-center h-full w-full bg-gray-950">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-4">
            <Globe className="w-8 h-8 text-gray-500" />
          </div>
          <p className="text-gray-400 text-sm">Enter a URL above to start browsing</p>
        </div>
      </div>
    );
  }

  if (hasError) {
    return <BrowserError url={url} onTryAnother={handleTryAnother} />;
  }

  return (
    <div className="relative h-full w-full bg-white">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-950 z-10">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
            <p className="text-sm text-gray-400">Loading...</p>
          </div>
        </div>
      )}
      <iframe
        ref={iframeRef}
        src={url}
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
        className="w-full h-full border-0"
        title="Browser content"
        onLoad={handleLoad}
        onError={handleError}
      />
    </div>
  );
}

function Globe({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </svg>
  );
}
