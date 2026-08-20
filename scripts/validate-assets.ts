import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STAGE_002_SVG_ASSETS } from '../src/phaser/assets/stage002AssetManifest';

const requiredDirectories = [
  'public/assets/characters', 'public/assets/props', 'public/assets/furniture',
  'public/assets/backgrounds', 'public/assets/effects', 'public/assets/audio', 'public/assets/manifests',
];
const missing = requiredDirectories.filter((directory) => !existsSync(resolve(directory)));
if (missing.length > 0) throw new Error(`Missing asset directories:\n${missing.join('\n')}`);
const errors: string[] = [];
for (const asset of STAGE_002_SVG_ASSETS) {
  const runtime = resolve('public', asset.url.replace(/^\//, ''));
  const source = resolve('source-assets/svg/props/stage-002', asset.url.split('/').at(-1)!);
  if (!existsSync(runtime)) errors.push(`Missing runtime SVG: ${runtime}`);
  if (!existsSync(source)) errors.push(`Missing source SVG: ${source}`);
  if (!existsSync(runtime) || !existsSync(source)) continue;
  const xml = readFileSync(runtime, 'utf8');
  if (!xml.includes('<title>') || !xml.includes('<desc>')) errors.push(`Missing title/desc: ${asset.key}`);
  if (/<(?:image|text|filter|linearGradient|radialGradient)\b/i.test(xml)) errors.push(`Forbidden SVG element: ${asset.key}`);
  if (/\b(?:href|xlink:href)\s*=/.test(xml)) errors.push(`External reference is not allowed: ${asset.key}`);
  if (readFileSync(source, 'utf8') !== xml) errors.push(`Source/runtime SVG mismatch: ${asset.key}`);
}
if (errors.length > 0) throw new Error(`Asset validation failed:\n${errors.join('\n')}`);
console.log(`Asset directory structure and ${STAGE_002_SVG_ASSETS.length} Stage 2 SVG pairs are valid.`);
