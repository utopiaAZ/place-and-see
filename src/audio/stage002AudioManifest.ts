import type { AudioManifest } from './AudioManifest';
import { publicAssetUrl } from '../assets/publicAssetUrl';

const runtimeRoot = publicAssetUrl('assets/audio/edited');

/**
 * Stage 2 markers are provisional waveform-based selections. Keep the source MP3s
 * intact so a human listening review can adjust only these values later.
 */
export const STAGE_002_AUDIO_MANIFEST = {
  version: 1,
  sounds: [
    {
      key: 'fan-loop-01', event: 'FAN_STARTED', sourceFile: 'fan-loop-01.mp3',
      url: `${runtimeRoot}/fan-loop-01.mp3`, category: 'loop', fullDurationMs: 22176,
      startMs: 8000, durationMs: 4000, volume: 0.42, loop: true, maxInstances: 1,
    },
    {
      key: 'paper-flutter-01', event: 'PAPER_FLUTTER_STARTED', sourceFile: 'paper-flutter-01.mp3',
      url: `${runtimeRoot}/paper-flutter-01.mp3`, category: 'loop', fullDurationMs: 54552,
      startMs: 13000, durationMs: 4000, volume: 0.72, loop: true, maxInstances: 1,
    },
    {
      key: 'paper-fall-01', event: 'PAPER_BLOWN_AWAY', sourceFile: 'paper-fall-01.mp3',
      url: `${runtimeRoot}/paper-fall-01.mp3`, category: 'sfx', fullDurationMs: 6975,
      startMs: 0, durationMs: 2500, volume: 0.78, cooldownMs: 800, maxInstances: 1,
    },
  ],
} as const satisfies AudioManifest;

export type Stage002AudioKey = (typeof STAGE_002_AUDIO_MANIFEST.sounds)[number]['key'];
