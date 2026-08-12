export interface ChatMessage {
  id: string;
  roomId: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  isEdited: boolean;
  editedAt?: Date;
  replyTo?: string;
  reactions: ChatReaction[];
  isDeleted: boolean;
}

export interface ChatReaction {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: Date;
}

export interface TypingIndicator {
  userId: string;
  roomId: string;
  isTyping: boolean;
  timestamp: Date;
}