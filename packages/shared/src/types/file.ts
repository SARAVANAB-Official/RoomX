export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  DOCUMENT = 'DOCUMENT',
  TEXT = 'TEXT',
  OTHER = 'OTHER'
}

export interface FileMetadata {
  id: string;
  name: string;
  originalName: string;
  mimeType: string;
  size: number;
  type: FileType;
  url: string;
  thumbnailUrl?: string;
  uploadedBy: string;
  roomId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileUpload {
  id: string;
  file: File;
  name: string;
  size: number;
  type: FileType;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  metadata?: FileMetadata;
}