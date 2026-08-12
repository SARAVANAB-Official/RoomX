import { z } from 'zod';

export const validateRoomName = (name: string): boolean => {
  const schema = z.string().min(1).max(100).regex(/^[a-zA-Z0-9\s\-_]+$/);
  return schema.safeParse(name).success;
};

export const validateUrl = (url: string): boolean => {
  const schema = z.string().url();
  return schema.safeParse(url).success;
};

export const validateDisplayName = (name: string): boolean => {
  const schema = z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_@.]+$/);
  return schema.safeParse(name).success;
};

export const validatePassword = (password: string): boolean => {
  const schema = z.string().min(4).max(100);
  return schema.safeParse(password).success;
};

export const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[<>:"/\\|?*]/g, '')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 255);
};

export const validateFileType = (
  filename: string,
  allowedTypes: string[]
): boolean => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (!extension) return false;
  return allowedTypes.includes(extension);
};