import express from 'express';
import multer from 'multer';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { requireAdmin } from '../lib/auth.ts';
import { str } from '../lib/json.ts';
import { HttpError } from '../middleware/error.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Absolute path of the folder that stores uploaded media. Override with UPLOAD_DIR env. */
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.resolve(__dirname, '..', '..', 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED_TYPES = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
  ['image/svg+xml', '.svg'],
  ['image/avif', '.avif'],
  ['image/x-icon', '.ico'],
  ['image/vnd.microsoft.icon', '.ico'],
]);

function monthFolder() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    const dir = path.join(UPLOAD_DIR, monthFolder());
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename(_req, file, cb) {
    const ext = ALLOWED_TYPES.get(file.mimetype) || path.extname(file.originalname).toLowerCase() || '.bin';
    const base = path
      .basename(file.originalname, path.extname(file.originalname))
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    cb(null, `${base || (ext === '.glb' ? 'model' : 'image')}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024, files: 10 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_TYPES.has(file.mimetype)) cb(null, true);
    else cb(new HttpError(400, 'Only image files are allowed (jpg, png, webp, gif, svg, avif)'));
  },
});

/** 3D models: binary glTF (.glb) with its textures embedded. */
export const MODEL_MAX_MB = 60;
const modelUpload = multer({
  storage,
  limits: { fileSize: MODEL_MAX_MB * 1024 * 1024, files: 10 },
  fileFilter(_req, file, cb) {
    if (path.extname(file.originalname).toLowerCase() === '.glb') cb(null, true);
    else cb(new HttpError(400, 'Only .glb 3D models are allowed (binary glTF with embedded textures)'));
  },
});

/** Runs a multer middleware and turns its "file too large" error into a clear 413 message. */
function withSizeMessage(middleware: express.RequestHandler, message: string): express.RequestHandler {
  return (req, res, next) =>
    middleware(req, res, (err?: unknown) => {
      if ((err as { code?: string } | undefined)?.code === 'LIMIT_FILE_SIZE') next(new HttpError(413, message));
      else next(err);
    });
}

const fileKind = (name: string): 'image' | 'model' => (path.extname(name).toLowerCase() === '.glb' ? 'model' : 'image');

function toPublicUrl(absolutePath: string) {
  const rel = path.relative(UPLOAD_DIR, absolutePath).split(path.sep).join('/');
  return `/uploads/${rel}`;
}

function resolveSafe(publicUrl: string) {
  if (!publicUrl.startsWith('/uploads/')) throw new HttpError(400, 'Invalid upload path');
  const abs = path.resolve(UPLOAD_DIR, '.' + publicUrl.slice('/uploads'.length));
  if (!abs.startsWith(UPLOAD_DIR + path.sep) && abs !== UPLOAD_DIR) throw new HttpError(400, 'Invalid upload path');
  return abs;
}

export const uploadsRouter = express.Router();

/** Admin: upload up to 10 images in the `files` field. Returns relative urls (/uploads/...). */
uploadsRouter.post('/', requireAdmin, upload.array('files', 10), (req, res) => {
  const files = ((req.files as Express.Multer.File[] | undefined) || []).map((f) => ({
    url: toPublicUrl(f.path),
    name: f.originalname,
    size: f.size,
    type: f.mimetype,
  }));
  if (files.length === 0) throw new HttpError(400, 'No files received. Send images in the "files" field.');
  res.status(201).json({ files });
});

/** Admin: upload 3D models (.glb) in the `files` field. Returns relative urls (/uploads/...). */
uploadsRouter.post('/models', requireAdmin, withSizeMessage(modelUpload.array('files', 10), `3D model is too large (max ${MODEL_MAX_MB} MB per file)`), (req, res) => {
  const files = ((req.files as Express.Multer.File[] | undefined) || []).map((f) => ({
    url: toPublicUrl(f.path),
    name: f.originalname,
    size: f.size,
    type: 'model/gltf-binary',
  }));
  if (files.length === 0) throw new HttpError(400, 'No files received. Send .glb models in the "files" field.');
  res.status(201).json({ files });
});

/** Admin: media library listing (most recent first). ?kind=image or ?kind=model filters the list. */
uploadsRouter.get('/', requireAdmin, (req, res) => {
  const items: { url: string; name: string; size: number; modifiedAt: string; kind: 'image' | 'model' }[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && !entry.name.startsWith('.')) {
        const stat = fs.statSync(full);
        items.push({ url: toPublicUrl(full), name: entry.name, size: stat.size, modifiedAt: stat.mtime.toISOString(), kind: fileKind(entry.name) });
      }
    }
  };
  walk(UPLOAD_DIR);
  const kind = str(req.query.kind);
  const list = kind === 'image' || kind === 'model' ? items.filter((i) => i.kind === kind) : items;
  list.sort((a, b) => (a.modifiedAt < b.modifiedAt ? 1 : -1));
  res.json({ items: list.slice(0, 500), total: list.length });
});

/** Admin: delete an uploaded file by its public url (?url=/uploads/2026-01/x.jpg). */
uploadsRouter.delete('/', requireAdmin, (req, res) => {
  const abs = resolveSafe(str(req.query.url));
  if (fs.existsSync(abs)) fs.unlinkSync(abs);
  res.json({ ok: true });
});
