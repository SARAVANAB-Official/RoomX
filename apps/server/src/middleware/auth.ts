import type { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { UnauthorizedError } from "../utils/errors.js";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      authPayload?: {
        userId: string;
        email?: string;
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

export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  const token = extractToken(req);
  if (!token) {
    return next(new UnauthorizedError("Missing authorization token"));
  }

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) {
      return next(new UnauthorizedError("Invalid or expired token"));
    }
    req.userId = data.user.id;
    req.authPayload = {
      userId: data.user.id,
      email: data.user.email,
    };
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
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

  try {
    const { data } = await supabaseAdmin.auth.getUser(token);
    if (data.user) {
      req.userId = data.user.id;
      req.authPayload = {
        userId: data.user.id,
        email: data.user.email,
      };
    }
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
}

export async function authenticateSocket(
  handshakeAuth: Record<string, unknown>
): Promise<{ userId: string; email?: string } | null> {
  const token = handshakeAuth.token as string | undefined;
  if (!token) return null;

  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !data.user) return null;
    return { userId: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}
