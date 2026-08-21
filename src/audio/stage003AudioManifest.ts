import type { AudioManifest } from './AudioManifest';
import { publicAssetUrl } from '../assets/publicAssetUrl';

const runtimeRoot = publicAssetUrl('assets/audio/edited');

/** Provisional waveform-based markers. Human listening in Audio QA is still required. */
export const STAGE_003_AUDIO_MANIFEST = {
  version: 1,
  sounds: [
    { key: 'cake-place-wood-01', event: 'CAKE_PLACED', sourceFile: 'cake-place-wood-01.mp3', url: `${runtimeRoot}/cake-place-wood-01.mp3`, category: 'sfx', fullDurationMs: 36192, startMs: 500, durationMs: 350, volume: 0.58, cooldownMs: 300, maxInstances: 1, loop: false, oncePerStage: false },
    { key: 'cake-hit-01', event: 'CAT_HIT_CAKE', sourceFile: 'cake-hit-01.mp3', url: `${runtimeRoot}/cake-hit-01.mp3`, category: 'sfx', fullDurationMs: 131, startMs: 0, durationMs: 130, volume: 1, cooldownMs: 400, maxInstances: 1, loop: false, oncePerStage: false },
    { key: 'candle-light-01', event: 'CANDLE_LIGHTING_STARTED', sourceFile: 'candle-light-01.mp3', url: `${runtimeRoot}/candle-light-01.mp3`, category: 'sfx', fullDurationMs: 6768, startMs: 2650, durationMs: 350, volume: 0.78, cooldownMs: 300, maxInstances: 1, loop: false, oncePerStage: false },
    { key: 'candle-blowout-01', event: 'CANDLE_BLOWN_OUT', sourceFile: 'candle-blowout-01.mp3', url: `${runtimeRoot}/candle-blowout-01.mp3`, category: 'sfx', fullDurationMs: 11102, startMs: 7000, durationMs: 1300, volume: 1, cooldownMs: 300, maxInstances: 1, loop: false, oncePerStage: false },
  ],
} as const satisfies AudioManifest;
