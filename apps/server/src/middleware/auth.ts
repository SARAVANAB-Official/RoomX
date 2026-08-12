import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
import { UnauthorizedError } from "../utils/errors.js";

export interface AuthPayload {
  userId: string;
  email?: string;
  role?: string;
}

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authPayload?: AuthPayload;
    }
  }
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7);
  }
  return null;
}

export function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    throw new UnauthorizedError("Missing authorization token");
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.userId = payload.userId;
    req.authPayload = payload;
    next();
  } catch {
    throw new UnauthorizedError("Invalid or expired token");
  }
}

export function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as AuthPayload;
    req.userId = payload.userId;
    req.authPayload = payload;
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
}

export function authenticateSocket(
  handshakeAuth: Record<string, unknown>
): AuthPayload | null {
  const token = handshakeAuth.token as string | undefined;
  if (!token) return null;

  try {
    return jwt.verify(token, config.jwtSecret) as AuthPayload;
  } catch {
    return null;
  }
}
