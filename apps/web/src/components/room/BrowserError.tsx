import { Globe, AlertTriangle, ExternalLink, ArrowLeft } from 'lucide-react';

interface BrowserErrorProps {
  url: string;
  onTryAnother?: () => void;
}

export default function BrowserError({ url, onTryAnother }: BrowserErrorProps) {
  return (
    <div className="flex items-center justify-center h-full w-full bg-gray-950">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-8 max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">
          This website doesn't allow embedding
        </h3>
        <p className="text-gray-400 text-sm mb-4">
          The site restricts being displayed inside an iframe due to security policies.
        </p>
        <div className="bg-white/5 rounded-lg px-4 py-2 mb-6 overflow-hidden">
          <p className="text-xs text-gray-500 truncate font-mono">{url}</p>
        </div>
        <div className="flex flex-col gap-2">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-colors font-medium text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            Open in New Tab
          </a>
          {onTryAnother && (
            <button
              onClick={onTryAnother}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 rounded-xl transition-colors font-medium text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              Try Another URL
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
