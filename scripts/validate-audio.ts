import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { STAGE_001_AUDIO_MANIFEST } from '../src/audio/stage001AudioManifest';
import { STAGE_002_AUDIO_MANIFEST } from '../src/audio/stage002AudioManifest';
import type { AudioAssetDefinition } from '../src/audio/AudioManifest';
import type { SoundEvent } from '../src/audio/SoundEventMap';
import { stage001 } from '../src/content/stages/stage-001';
import { stage002 } from '../src/content/stages/stage-002';

const errors: string[] = [];
const keys = new Set<string>();
for (const definition of STAGE_001_AUDIO_MANIFEST.sounds) {
  const asset: AudioAssetDefinition = definition;
  if (keys.has(asset.key)) errors.push(`Duplicate audio key: ${asset.key}`);
  keys.add(asset.key);
  if (!asset.url.startsWith('/assets/audio/edited/') || asset.url.includes('..')) {
    errors.push(`Invalid runtime URL for ${asset.key}: ${asset.url}`);
  }
  const runtimePath = resolve('public', asset.url.replace(/^\//, ''));
  if (!existsSync(runtimePath)) errors.push(`Missing runtime file: ${runtimePath}`);
  const sourcePath = resolve('source-assets/audio/raw', asset.sourceFile);
  if (!existsSync(sourcePath)) errors.push(`Missing source file: ${sourcePath}`);
  if (existsSync(runtimePath) && existsSync(sourcePath)) {
    const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    if (digest(runtimePath) !== digest(sourcePath)) errors.push(`Runtime copy differs from source: ${asset.sourceFile}`);
  }
  if (asset.durationMs !== undefined && asset.durationMs <= 0) errors.push(`Non-positive duration for ${asset.key}`);
  if (asset.startMs !== undefined && asset.startMs < 0) errors.push(`Negative marker start for ${asset.key}`);
  if ((asset.startMs ?? 0) + (asset.durationMs ?? asset.fullDurationMs) > asset.fullDurationMs) {
    errors.push(`Marker exceeds source duration for ${asset.key}`);
  }
  if (asset.volume < 0 || asset.volume > 1) errors.push(`Volume outside 0..1 for ${asset.key}`);
  if (asset.loop && (!asset.durationMs || asset.durationMs > 5000)) errors.push(`Loop ${asset.key} needs a marker of at most 5 seconds`);
  if (!(stage001.soundEvents as readonly SoundEvent[]).includes(asset.event)) errors.push(`Unused Stage 1 audio event: ${asset.key} -> ${asset.event}`);
}

if (errors.length > 0) throw new Error(`Audio validation failed:\n${errors.join('\n')}`);
console.log(`Validated ${STAGE_001_AUDIO_MANIFEST.sounds.length} Stage 1 audio definitions and runtime files.`);

for (const definition of STAGE_002_AUDIO_MANIFEST.sounds) {
  const asset: AudioAssetDefinition = definition;
  if (keys.has(asset.key)) errors.push(`Duplicate audio key: ${asset.key}`);
  keys.add(asset.key);
  if (!asset.url.startsWith('/assets/audio/edited/') || asset.url.includes('..')) {
    errors.push(`Invalid runtime URL for ${asset.key}: ${asset.url}`);
  }
  const runtimePath = resolve('public', asset.url.replace(/^\//, ''));
  const sourcePath = resolve('source-assets/audio/raw', asset.sourceFile);
  if (!existsSync(runtimePath)) errors.push(`Missing runtime file: ${runtimePath}`);
  if (!existsSync(sourcePath)) errors.push(`Missing source file: ${sourcePath}`);
  if (existsSync(runtimePath) && existsSync(sourcePath)) {
    const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    if (digest(runtimePath) !== digest(sourcePath)) errors.push(`Runtime copy differs from source: ${asset.sourceFile}`);
  }
  if (asset.durationMs !== undefined && asset.durationMs <= 0) errors.push(`Non-positive duration for ${asset.key}`);
  if (asset.startMs !== undefined && asset.startMs < 0) errors.push(`Negative marker start for ${asset.key}`);
  if ((asset.startMs ?? 0) + (asset.durationMs ?? asset.fullDurationMs) > asset.fullDurationMs) {
    errors.push(`Marker exceeds source duration for ${asset.key}`);
  }
  if (asset.volume < 0 || asset.volume > 1) errors.push(`Volume outside 0..1 for ${asset.key}`);
  if (asset.loop && (!asset.durationMs || asset.durationMs > 5000)) errors.push(`Loop ${asset.key} needs a marker of at most 5 seconds`);
  if (!(stage002.soundEvents as readonly SoundEvent[]).includes(asset.event)) errors.push(`Unused Stage 2 audio event: ${asset.key} -> ${asset.event}`);
}

if (errors.length > 0) throw new Error(`Audio validation failed:\n${errors.join('\n')}`);
console.log(`Validated ${STAGE_002_AUDIO_MANIFEST.sounds.length} Stage 2 audio definitions and runtime files.`);
