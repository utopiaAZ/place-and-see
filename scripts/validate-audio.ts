import { existsSync, readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { STAGE_001_AUDIO_MANIFEST } from '../src/audio/stage001AudioManifest';
import { STAGE_002_AUDIO_MANIFEST } from '../src/audio/stage002AudioManifest';
import { STAGE_003_AUDIO_MANIFEST } from '../src/audio/stage003AudioManifest';
import { STAGE_003_AND_SHARED_AUDIO_MANIFEST } from '../src/audio/gameAudioManifest';
import type { AudioAssetDefinition } from '../src/audio/AudioManifest';
import type { SoundEvent } from '../src/audio/SoundEventMap';
import { stage001 } from '../src/content/stages/stage-001';
import { stage002 } from '../src/content/stages/stage-002';
import { stage003 } from '../src/content/stages/stage-003';
import { publicAssetPathFromUrl } from '../src/assets/publicAssetUrl';

const errors: string[] = [];
const keys = new Set<string>();

function runtimeAudioPath(asset: AudioAssetDefinition): string | null {
  try {
    const publicPath = publicAssetPathFromUrl(asset.url);
    if (!publicPath.startsWith('assets/audio/edited/')) {
      errors.push(`Invalid runtime URL for ${asset.key}: ${asset.url}`);
      return null;
    }
    return resolve('public', ...publicPath.split('/'));
  } catch (error) {
    errors.push(error instanceof Error ? error.message : `Invalid runtime URL for ${asset.key}: ${asset.url}`);
    return null;
  }
}

for (const definition of STAGE_001_AUDIO_MANIFEST.sounds) {
  const asset: AudioAssetDefinition = definition;
  if (keys.has(asset.key)) errors.push(`Duplicate audio key: ${asset.key}`);
  keys.add(asset.key);
  const runtimePath = runtimeAudioPath(asset);
  if (!runtimePath || !existsSync(runtimePath)) errors.push(`Missing runtime file: ${runtimePath ?? asset.url}`);
  const sourcePath = resolve('source-assets/audio/raw', asset.sourceFile);
  if (!existsSync(sourcePath)) errors.push(`Missing source file: ${sourcePath}`);
  if (runtimePath && existsSync(runtimePath) && existsSync(sourcePath)) {
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
  const runtimePath = runtimeAudioPath(asset);
  const sourcePath = resolve('source-assets/audio/raw', asset.sourceFile);
  if (!runtimePath || !existsSync(runtimePath)) errors.push(`Missing runtime file: ${runtimePath ?? asset.url}`);
  if (!existsSync(sourcePath)) errors.push(`Missing source file: ${sourcePath}`);
  if (runtimePath && existsSync(runtimePath) && existsSync(sourcePath)) {
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

for (const definition of STAGE_003_AUDIO_MANIFEST.sounds) {
  const asset: AudioAssetDefinition = definition;
  if (keys.has(asset.key)) errors.push(`Duplicate audio key: ${asset.key}`);
  keys.add(asset.key);
  const runtimePath = runtimeAudioPath(asset);
  const sourcePath = resolve('source-assets/audio/raw', asset.sourceFile);
  if (!runtimePath || !existsSync(runtimePath)) errors.push(`Missing runtime file: ${runtimePath ?? asset.url}`);
  if (!existsSync(sourcePath)) errors.push(`Missing source file: ${sourcePath}`);
  if (runtimePath && existsSync(runtimePath) && existsSync(sourcePath)) {
    const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    if (digest(runtimePath) !== digest(sourcePath)) errors.push(`Runtime copy differs from source: ${asset.sourceFile}`);
  }
  if ((asset.startMs ?? 0) + (asset.durationMs ?? asset.fullDurationMs) > asset.fullDurationMs) errors.push(`Marker exceeds source duration for ${asset.key}`);
  if ((asset.durationMs ?? 0) <= 0) errors.push(`Non-positive duration for ${asset.key}`);
  if (asset.volume < 0 || asset.volume > 1) errors.push(`Volume outside 0..1 for ${asset.key}`);
  if (!(stage003.soundEvents as readonly SoundEvent[]).includes(asset.event)) errors.push(`Unused Stage 3 audio event: ${asset.key} -> ${asset.event}`);
  if (asset.loop) errors.push(`Stage 3 new sound must be a one-shot: ${asset.key}`);
  if (asset.maxInstances !== 1) errors.push(`Stage 3 one-shot must limit instances: ${asset.key}`);
}

const requiredStage3Mappings: Readonly<Record<string, string>> = {
  CAKE_PLACED: 'cake-place-wood-01', CAT_HIT_CAKE: 'cake-hit-01',
  CANDLE_LIGHTING_STARTED: 'candle-light-01', CANDLE_BLOWN_OUT: 'candle-blowout-01',
  CAT_NOTICED_CAKE: 'cat-chirp-01', CAT_PREPARING_JUMP: 'step-wood-01', CAT_LANDED: 'cat-landing',
  CAT_EATING: 'cat-eating-01', CAT_PLAYING: 'cat-toy-01', FAN_STARTED: 'fan-loop-01',
  OBJECT_DROP_REJECTED: 'error-pop-01', GOAL_COMPLETED: 'success-01',
};
for (const [event, key] of Object.entries(requiredStage3Mappings)) {
  const mapped = STAGE_003_AND_SHARED_AUDIO_MANIFEST.sounds.find((asset) => asset.key === key && asset.event === event);
  if (!mapped) errors.push(`Missing Stage 3 event mapping: ${event} -> ${key}`);
}

if (errors.length > 0) throw new Error(`Audio validation failed:\n${errors.join('\n')}`);
console.log(`Validated Stage 1 (${STAGE_001_AUDIO_MANIFEST.sounds.length}), Stage 2 (${STAGE_002_AUDIO_MANIFEST.sounds.length}), and Stage 3 (${STAGE_003_AUDIO_MANIFEST.sounds.length}) audio definitions and runtime files.`);
