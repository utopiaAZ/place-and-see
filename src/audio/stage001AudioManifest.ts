import type { AudioManifest } from './AudioManifest';
import { publicAssetUrl } from '../assets/publicAssetUrl';

const runtimeRoot = publicAssetUrl('assets/audio/edited');

export const STAGE_001_AUDIO_MANIFEST = {
  version: 1,
  sounds: [
    {
      key: 'bottle-pickup-01', event: 'OBJECT_PICKED_UP', sourceFile: 'bottle-pickup-01.mp3',
      url: `${runtimeRoot}/bottle-pickup-01.mp3`, category: 'sfx', fullDurationMs: 528,
      startMs: 0, durationMs: 430, volume: 0.72, cooldownMs: 120, maxInstances: 1,
    },
    {
      key: 'bottle-place-01', event: 'OBJECT_PLACED', sourceFile: 'bottle-place-01.mp3',
      url: `${runtimeRoot}/bottle-place-01.mp3`, category: 'sfx', fullDurationMs: 51672,
      startMs: 1840, durationMs: 310, volume: 0.45, cooldownMs: 150, maxInstances: 1,
    },
    {
      key: 'bottle-fall-01', event: 'BOTTLE_FELL', sourceFile: 'bottle-fall-01.mp3',
      url: `${runtimeRoot}/bottle-fall-01.mp3`, category: 'sfx', fullDurationMs: 3168,
      startMs: 100, durationMs: 2400, volume: 0.65, cooldownMs: 500, maxInstances: 1,
    },
    {
      key: 'water-spill-01', event: 'WATER_SPILLED', sourceFile: 'water-spill-01.mp3',
      url: `${runtimeRoot}/water-spill-01.mp3`, category: 'sfx', fullDurationMs: 1032,
      startMs: 300, durationMs: 560, volume: 1, cooldownMs: 500, maxInstances: 1,
    },
    {
      key: 'cat-chirp-01', event: 'CAT_NOTICED_BOTTLE', sourceFile: 'cat-chirp-01.mp3',
      url: `${runtimeRoot}/cat-chirp-01.mp3`, category: 'sfx', fullDurationMs: 7608,
      startMs: 260, durationMs: 540, volume: 0.9, cooldownMs: 600, maxInstances: 1,
    },
    {
      key: 'step-wood-01', event: 'CAT_PREPARING_JUMP', sourceFile: 'step-wood-01.mp3',
      url: `${runtimeRoot}/step-wood-01.mp3`, category: 'sfx', fullDurationMs: 4336,
      startMs: 0, durationMs: 350, volume: 0.5, cooldownMs: 400, maxInstances: 1,
    },
    {
      key: 'cat-landing', event: 'CAT_LANDED', sourceFile: 'cat-landing.mp3',
      url: `${runtimeRoot}/cat-landing.mp3`, category: 'sfx', fullDurationMs: 1128,
      startMs: 0, durationMs: 340, volume: 0.7, cooldownMs: 400, maxInstances: 1,
    },
    {
      key: 'error-pop-01', event: 'OBJECT_DROP_REJECTED', sourceFile: 'error-pop-01.mp3',
      url: `${runtimeRoot}/error-pop-01.mp3`, category: 'ui', fullDurationMs: 1032,
      startMs: 0, durationMs: 120, volume: 0.6, cooldownMs: 180, maxInstances: 1,
    },
    {
      key: 'cat-eating-01', event: 'CAT_EATING', sourceFile: 'cat-eating-01.mp3',
      url: `${runtimeRoot}/cat-eating-01.mp3`, category: 'loop', fullDurationMs: 59324,
      startMs: 1000, durationMs: 4000, volume: 0.85, loop: true, maxInstances: 1,
    },
    {
      key: 'cat-toy-01', event: 'CAT_PLAYING', sourceFile: 'cat-toy-01.mp3',
      url: `${runtimeRoot}/cat-toy-01.mp3`, category: 'loop', fullDurationMs: 17328,
      startMs: 2250, durationMs: 2400, volume: 1, loop: true, maxInstances: 1,
    },
    {
      key: 'success-01', event: 'GOAL_COMPLETED', sourceFile: 'success-01.mp3',
      url: `${runtimeRoot}/success-01.mp3`, category: 'ui', fullDurationMs: 3408,
      startMs: 100, durationMs: 3170, volume: 0.65, cooldownMs: 1000, maxInstances: 1, oncePerStage: true,
    },
  ],
} as const satisfies AudioManifest;

export type Stage001AudioKey = (typeof STAGE_001_AUDIO_MANIFEST.sounds)[number]['key'];
