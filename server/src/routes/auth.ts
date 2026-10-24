import express from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.ts';
import { comparePassword, hashPassword, rateLimit, requireAdmin, signToken, type AdminPayload } from '../lib/auth.ts';
import { HttpError } from '../middleware/error.ts';

export const authRouter = express.Router();

const loginSchema = z.object({
  email: z.string().trim().toLowerCase().min(3).max(120),
  password: z.string().min(1).max(200),
});

authRouter.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, keyPrefix: 'login' }), async (req, res) => {
  const { email, password } = loginSchema.parse(req.body);
  const admin = await prisma.adminUser.findUnique({ where: { email } });
  if (!admin || !(await comparePassword(password, admin.passwordHash))) {
    throw new HttpError(401, 'Invalid email or password');
  }
  const token = signToken({ sub: admin.id, email: admin.email, name: admin.name });
  res.json({ token, admin: { id: admin.id, email: admin.email, name: admin.name } });
});

authRouter.get('/me', requireAdmin, (_req, res) => {
  const admin = res.locals.admin as AdminPayload;
  res.json({ admin: { id: admin.sub, email: admin.email, name: admin.name } });
});

authRouter.put('/profile', requireAdmin, async (req, res) => {
  const schema = z.object({
    name: z.string().trim().min(1).max(80),
    email: z.email().trim().toLowerCase().max(120),
  });
  const admin = res.locals.admin as AdminPayload;
  const data = schema.parse(req.body);
  const updated = await prisma.adminUser.update({ where: { id: admin.sub }, data });
  const token = signToken({ sub: updated.id, email: updated.email, name: updated.name });
  res.json({ token, admin: { id: updated.id, email: updated.email, name: updated.name } });
});

authRouter.post('/change-password', requireAdmin, async (req, res) => {
  const schema = z.object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8, 'Password must be at least 8 characters').max(200),
  });
  const admin = res.locals.admin as AdminPayload;
  const { currentPassword, newPassword } = schema.parse(req.body);
  const user = await prisma.adminUser.findUniqueOrThrow({ where: { id: admin.sub } });
  if (!(await comparePassword(currentPassword, user.passwordHash))) {
    throw new HttpError(400, 'Current password is incorrect');
  }
  await prisma.adminUser.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(newPassword) } });
  res.json({ ok: true });
});
