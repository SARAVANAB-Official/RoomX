import { X, Download, FileText, Film, Music, File as FileIcon } from 'lucide-react';
import type { FileMetadata, FileType } from '@roomx/shared';

interface FilePreviewProps {
  file: FileMetadata;
  onClose: () => void;
}

function getFileCategory(mimeType: string): 'image' | 'video' | 'audio' | 'text' | 'pdf' | 'other' {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (mimeType.startsWith('text/') || mimeType.includes('json') || mimeType.includes('javascript')) return 'text';
  return 'other';
}

export default function FilePreview({ file, onClose }: FilePreviewProps) {
  const category = getFileCategory(file.mimeType);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
      <div
        className="glass-card w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            {category === 'image' && <FileText className="w-5 h-5 text-indigo-400 shrink-0" />}
            {category === 'video' && <Film className="w-5 h-5 text-purple-400 shrink-0" />}
            {category === 'audio' && <Music className="w-5 h-5 text-green-400 shrink-0" />}
            {category === 'pdf' && <FileText className="w-5 h-5 text-red-400 shrink-0" />}
            {category === 'other' && <FileIcon className="w-5 h-5 text-gray-400 shrink-0" />}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-gray-200 truncate">{file.originalName}</h3>
              <p className="text-[10px] text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={file.url}
              download={file.originalName}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Download"
            >
              <Download className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[300px]">
          {category === 'image' && (
            <img
              src={file.url}
              alt={file.originalName}
              className="max-w-full max-h-[70vh] object-contain rounded-lg"
            />
          )}

          {category === 'video' && (
            <video
              src={file.url}
              controls
              className="max-w-full max-h-[70vh] rounded-lg"
            >
              Your browser does not support video playback.
            </video>
          )}

          {category === 'audio' && (
            <div className="w-full max-w-md flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <Music className="w-10 h-10 text-green-400" />
              </div>
              <audio src={file.url} controls className="w-full" />
            </div>
          )}

          {category === 'pdf' && (
            <iframe
              src={file.url}
              className="w-full h-[70vh] rounded-lg border border-white/10"
              title={file.originalName}
            />
          )}

          {category === 'text' && (
            <pre className="w-full max-h-[70vh] overflow-auto p-4 rounded-lg bg-black/30 border border-white/10 text-sm text-gray-300 font-mono whitespace-pre-wrap">
              {/* Text preview would need fetch, show info instead */}
              <span className="text-gray-500">Text file preview not available. Click download to view.</span>
            </pre>
          )}

          {category === 'other' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                <FileIcon className="w-10 h-10 text-gray-400" />
              </div>
              <div>
                <p className="text-sm text-gray-300 font-medium">{file.originalName}</p>
                <p className="text-xs text-gray-500 mt-1">{file.mimeType}</p>
                <p className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
              </div>
              <a
                href={file.url}
                download={file.originalName}
                className="glass-button !text-sm !px-4 !py-2"
              >
                <Download className="w-4 h-4 mr-2 inline" />
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
