import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import type { Request, Response, NextFunction } from 'express';
import { prisma } from './prisma.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';
const TOKEN_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export type AdminPayload = { sub: number; email: string; name: string };

export function signToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_TTL_SECONDS });
}

export function verifyToken(token: string): AdminPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/** Sets `res.locals.admin` when a valid token is present; never blocks the request. */
export function optionalAuth(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  res.locals.admin = token ? verifyToken(token) : null;
  next();
}

/** Blocks the request unless a valid admin token is present. */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const token = extractToken(req);
  const payload = token ? verifyToken(token) : null;
  if (!payload) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  const admin = await prisma.adminUser.findUnique({
    where: { id: payload.sub },
    select: { id: true, email: true, name: true },
  });
  if (!admin) {
    res.status(401).json({ error: 'Account no longer exists' });
    return;
  }
  res.locals.admin = { sub: admin.id, email: admin.email, name: admin.name } satisfies AdminPayload;
  next();
}

export function isAdmin(res: Response): boolean {
  return Boolean(res.locals.admin);
}

// --- tiny in-memory rate limiter (per key, sliding window) ---------------
const buckets = new Map<string, number[]>();

export function rateLimit(opts: { windowMs: number; max: number; keyPrefix: string }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${opts.keyPrefix}:${req.ip}`;
    const now = Date.now();
    const hits = (buckets.get(key) || []).filter((t) => now - t < opts.windowMs);
    if (hits.length >= opts.max) {
      res.status(429).json({ error: 'Too many requests. Please try again later.' });
      return;
    }
    hits.push(now);
    buckets.set(key, hits);
    next();
  };
}
