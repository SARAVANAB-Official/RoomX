export const MAX_ROOM_NAME = 100;
export const MAX_MESSAGE_LENGTH = 5000;
export const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

export const REACTION_EMOJIS = [
  '👍',
  '👎',
  '❤️',
  '😂',
  '😮',
  '😢',
  '🎉',
  '🚀',
  '👀',
  '🔥',
  '💯',
  '✅'
] as const;

export const SUPPORTED_FILE_TYPES = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'webp',
  'svg',
  'mp4',
  'webm',
  'avi',
  'mov',
  'mp3',
  'wav',
  'ogg',
  'pdf',
  'doc',
  'docx',
  'xls',
  'xlsx',
  'ppt',
  'pptx',
  'txt',
  'md',
  'json',
  'csv',
  'zip',
  'rar'
] as const;

export const DEFAULT_STUN_SERVER = 'stun:stun.l.google.com:19302';