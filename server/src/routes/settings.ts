import express from 'express';
import { requireAdmin } from '../lib/auth.ts';
import { DEFAULT_SETTINGS, getSettings, resetSettings, updateSettings } from '../lib/settings.ts';

export const settingsRouter = express.Router();

/** Public: the full site configuration used to render the storefront. */
settingsRouter.get('/', async (_req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  res.json(await getSettings());
});

settingsRouter.get('/defaults', requireAdmin, (_req, res) => {
  res.json(DEFAULT_SETTINGS);
});

/** Admin: deep-merge a partial patch (e.g. { contact: { phone: "..." } }). */
settingsRouter.put('/', requireAdmin, async (req, res) => {
  res.json(await updateSettings(req.body));
});

settingsRouter.post('/reset', requireAdmin, async (_req, res) => {
  res.json(await resetSettings());
});
