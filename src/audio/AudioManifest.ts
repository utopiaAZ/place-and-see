import type { SoundCategory } from './soundCategories';
import type { SoundEvent } from './SoundEventMap';

export interface AudioVariant {
  readonly key: string;
  readonly sources: readonly string[];
  readonly weight?: number;
}

export interface AudioManifestEntry {
  readonly event: SoundEvent;
  readonly category: SoundCategory;
  readonly variants: readonly AudioVariant[];
}

export interface AudioManifest {
  readonly version: 1;
  readonly sounds: readonly AudioManifestEntry[];
}
