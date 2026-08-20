import type { AudioAssetCategory } from './AudioManifest';

export interface AudioSettings {
  readonly muted: boolean;
  readonly masterVolume: number;
  readonly categoryVolumes: Readonly<Record<AudioAssetCategory, number>>;
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  muted: false,
  masterVolume: 0.8,
  categoryVolumes: { sfx: 1, ui: 0.85, loop: 0.8 },
};
