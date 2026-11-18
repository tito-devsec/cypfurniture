// Copies the Draco decoder (glTF build) from three.js into web/public/draco, so compressed .glb
// models load in the 3D viewer without any external CDN. Run again after upgrading three.
//
//   node scripts/copy-draco.mjs
import { copyFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'node_modules', 'three', 'examples', 'jsm', 'libs', 'draco', 'gltf');
const dest = path.join(root, 'web', 'public', 'draco');

mkdirSync(dest, { recursive: true });
for (const file of ['draco_decoder.wasm', 'draco_wasm_wrapper.js']) copyFileSync(path.join(src, file), path.join(dest, file));
console.log('Copied the Draco decoder to web/public/draco');
