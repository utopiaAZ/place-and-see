import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const requiredDirectories = [
  'public/assets/characters', 'public/assets/props', 'public/assets/furniture',
  'public/assets/backgrounds', 'public/assets/effects', 'public/assets/audio', 'public/assets/manifests',
];
const missing = requiredDirectories.filter((directory) => !existsSync(resolve(directory)));
if (missing.length > 0) throw new Error(`Missing asset directories:\n${missing.join('\n')}`);
console.log('Asset directory structure is valid. Runtime assets are optional.');
