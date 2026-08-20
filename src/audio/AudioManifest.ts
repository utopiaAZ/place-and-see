import type { SoundEvent } from './SoundEventMap';

export type AudioAssetCategory = 'sfx' | 'ui' | 'loop';

export interface AudioAssetDefinition {
  readonly key: string;
  readonly event: SoundEvent;
  readonly sourceFile: string;
  readonly url: string;
  readonly category: AudioAssetCategory;
  readonly fullDurationMs: number;
  readonly volume: number;
  readonly loop?: boolean;
  readonly startMs?: number;
  readonly durationMs?: number;
  readonly cooldownMs?: number;
  readonly maxInstances?: number;
  readonly oncePerStage?: boolean;
}

export interface AudioManifest {
  readonly version: 1;
  readonly sounds: readonly AudioAssetDefinition[];
}
