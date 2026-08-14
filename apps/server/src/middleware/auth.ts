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
    const payload = jwt.verify(token, config.jwtSecret) as any;
    if (payload.userId) {
      return { userId: payload.userId, email: payload.email, isGuest: payload.isGuest || false };
    }
  } catch {
    // not a backend-signed token
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (!error && data.user) {
      return { userId: data.user.id, email: data.user.email, isGuest: false };
    }
  } catch {
    // not a Supabase token either
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
    console.log("[Auth] REJECT - no token - path:", req.path);
    return next(new UnauthorizedError("Missing authorization token"));
  }

  const user = await resolveUser(token);
  if (!user) {
    console.log("[Auth] REJECT - invalid token - path:", req.path, "tokenLength:", token.length);
    return next(new UnauthorizedError("Invalid or expired token"));
  }

  console.log("[Auth] OK - path:", req.path, "userId:", user.userId.substring(0, 8) + "...", "isGuest:", user.isGuest);
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
    console.log("[AuthOptional] anonymous - path:", req.path);
    return next();
  }

  const user = await resolveUser(token);
  if (user) {
    console.log("[AuthOptional] OK - path:", req.path, "userId:", user.userId.substring(0, 8) + "...", "isGuest:", user.isGuest);
    req.userId = user.userId;
    req.authPayload = user;
  } else {
    console.log("[AuthOptional] token invalid, proceeding anonymously - path:", req.path);
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
