import { useState, useRef, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import {
  Upload,
  File as FileIcon,
  Image,
  Film,
  Music,
  FileText,
  FileCode,
  Download,
  Eye,
  Trash2,
  X,
  FolderOpen,
} from 'lucide-react';
import { FileType } from '@roomx/shared';
import type { FileMetadata } from '@roomx/shared';
import { useAuthStore } from '@/stores/useAuthStore';
import { useRoomStore } from '@/stores/useRoomStore';
import FilePreview from './FilePreview';
import { makeApi } from '@/lib/api';

interface FilePanelProps {
  socket: Socket | null;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const ALLOWED_TYPES: Record<string, FileType> = {
  'image/': FileType.IMAGE,
  'video/': FileType.VIDEO,
  'audio/': FileType.AUDIO,
  'application/pdf': FileType.DOCUMENT,
  'text/': FileType.TEXT,
};

function getFileType(mimeType: string): FileType {
  for (const [prefix, type] of Object.entries(ALLOWED_TYPES)) {
    if (mimeType.startsWith(prefix) || mimeType === prefix) return type;
  }
  return FileType.OTHER;
}

function getTypeIcon(type: FileType) {
  switch (type) {
    case 'IMAGE': return <Image className="w-4 h-4 text-indigo-400" />;
    case 'VIDEO': return <Film className="w-4 h-4 text-purple-400" />;
    case 'AUDIO': return <Music className="w-4 h-4 text-green-400" />;
    case 'DOCUMENT': return <FileText className="w-4 h-4 text-red-400" />;
    case 'TEXT': return <FileCode className="w-4 h-4 text-yellow-400" />;
    default: return <FileIcon className="w-4 h-4 text-gray-400" />;
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FilePanel({ socket }: FilePanelProps) {
  const user = useAuthStore((s) => s.user);
  const currentRoom = useRoomStore((s) => s.currentRoom);

  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [uploads, setUploads] = useState<
    { id: string; name: string; progress: number; status: 'uploading' | 'completed' | 'error'; error?: string }[]
  >([]);
  const [isDragging, setIsDragging] = useState(false);
  const [previewFile, setPreviewFile] = useState<FileMetadata | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) return 'File too large (max 50MB)';
    const isAllowed = Object.keys(ALLOWED_TYPES).some(
      (prefix) => file.type.startsWith(prefix) || file.type === prefix
    );
    if (!isAllowed) return 'File type not supported';
    return null;
  };

  const uploadFile = async (file: File) => {
    const error = validateFile(file);
    if (error) {
      setUploads((prev) => [
        ...prev,
        { id: crypto.randomUUID(), name: file.name, progress: 0, status: 'error', error },
      ]);
      return;
    }

    const uploadId = crypto.randomUUID();
    setUploads((prev) => [
      ...prev,
      { id: uploadId, name: file.name, progress: 0, status: 'uploading' },
    ]);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('roomId', currentRoom?.id || '');

      const metadata = await makeApi<FileMetadata>('/api/files/upload', {
        method: 'POST',
        body: formData,
        headers: {},
      });

      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, progress: 100, status: 'completed' } : u))
      );
      setFiles((prev) => [metadata, ...prev]);

      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 2000);
    } catch {
      setUploads((prev) =>
        prev.map((u) =>
          u.id === uploadId ? { ...u, status: 'error', error: 'Upload failed' } : u
        )
      );
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      droppedFiles.forEach(uploadFile);
    },
    [currentRoom]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    selected.forEach(uploadFile);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="flex flex-col h-full glass rounded-2xl border border-white/10 overflow-hidden">
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-indigo-400" />
          <span className="font-semibold text-sm text-gray-200">Files</span>
          {files.length > 0 && (
            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">
              {files.length}
            </span>
          )}
        </div>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-medium text-white transition-colors"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`mx-4 mt-3 border-2 border-dashed rounded-xl transition-colors ${
          isDragging
            ? 'border-indigo-500 bg-indigo-500/10'
            : 'border-white/10 hover:border-white/20'
        }`}
      >
        <div className="flex flex-col items-center justify-center py-6 text-center">
          <Upload className="w-6 h-6 text-gray-500 mb-2" />
          <p className="text-xs text-gray-500">
            Drag & drop files here or{' '}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="text-indigo-400 hover:text-indigo-300 underline"
            >
              browse
            </button>
          </p>
          <p className="text-[10px] text-gray-600 mt-1">Max 50MB</p>
        </div>
      </div>

      {/* Upload progress */}
      {uploads.length > 0 && (
        <div className="px-4 pt-3 space-y-2">
          {uploads.map((u) => (
            <div key={u.id} className="glass-card !rounded-lg !p-2.5">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-300 truncate max-w-[200px]">{u.name}</span>
                {u.status === 'error' && (
                  <span className="text-[10px] text-red-400">{u.error}</span>
                )}
              </div>
              {u.status === 'uploading' && (
                <div className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${u.progress}%` }}
                  />
                </div>
              )}
              {u.status === 'completed' && (
                <span className="text-[10px] text-green-400">Uploaded</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* File list */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-600">
            <FolderOpen className="w-8 h-8 mb-2" />
            <p className="text-xs">No files shared yet</p>
          </div>
        ) : (
          files.map((file) => (
            <div
              key={file.id}
              className="glass-card !rounded-xl !p-3 flex items-center gap-3 hover:bg-white/[0.03] transition-colors group"
            >
              <div className="w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                {getTypeIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">{file.originalName}</p>
                <p className="text-[10px] text-gray-500">
                  {formatFileSize(file.size)} &middot; {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => setPreviewFile(file)}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Preview"
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
                <a
                  href={file.url}
                  download={file.originalName}
                  className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                  title="Download"
                >
                  <Download className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))
        )}
      </div>

      {previewFile && (
        <FilePreview file={previewFile} onClose={() => setPreviewFile(null)} />
      )}
    </div>
  );
}
