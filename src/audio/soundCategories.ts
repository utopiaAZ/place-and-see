export type SoundCategory = 'object' | 'character' | 'ui' | 'feedback' | 'ambience';

export interface AudioSettings {
  readonly muted: boolean;
  readonly masterVolume: number;
  readonly categoryVolumes: Readonly<Record<SoundCategory, number>>;
}
