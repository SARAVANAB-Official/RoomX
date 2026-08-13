import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { supabaseAdmin } from "../lib/supabase.js";
import { config } from "../config/index.js";
import { UnauthorizedError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authPayload?: {
        userId: string;
        email?: string;
        isGuest?: boolean;
      };
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

async function resolveUser(token: string): Promise<{ userId: string; email?: string; isGuest?: boolean } | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      return { userId: data.user.id, email: data.user.email, isGuest: false };
    }
  } catch {
    // not a Supabase token
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    if (payload.userId) {
      return { userId: payload.userId, email: payload.email, isGuest: payload.isGuest || false };
    }
  } catch {
    // not a valid guest token either
  }

  return null;
}

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError("Missing authorization token"));
  }

  const user = await resolveUser(token);
  if (!user) {
    return next(new UnauthorizedError("Invalid or expired token"));
  }

  req.userId = user.userId;
  req.authPayload = user;
  next();
}

export async function authenticateOptional(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next();
  }

  const user = await resolveUser(token);
  if (user) {
    req.userId = user.userId;
    req.authPayload = user;
  }
  next();
}

export async function authenticateSocket(
  handshakeAuth: Record<string, unknown>
): Promise<{ userId: string; email?: string; isGuest?: boolean } | null> {
  const token = handshakeAuth.token as string | undefined;
  if (!token) return null;

  return await resolveUser(token);
}
