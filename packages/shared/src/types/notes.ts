export interface NotesContent {
  roomId: string;
  content: string;
  lastEditedBy: string;
  lastEditedAt: Date;
  version: number;
  collaborators: string[];
}

export interface NotesUpdate {
  roomId: string;
  content: string;
  version: number;
  userId: string;
  timestamp: Date;
  operation: 'insert' | 'delete' | 'replace';
  position: number;
  length?: number;
  text?: string;
}