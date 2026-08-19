import type { AudioManifest } from './AudioManifest';
import type { SoundEvent } from './SoundEventMap';
import type { AudioSettings } from './soundCategories';

export interface AudioPlaybackPort {
  play(source: string, volume: number): void;
}

export class AudioManager {
  public constructor(
    private readonly manifest: AudioManifest | undefined,
    private readonly playback: AudioPlaybackPort | undefined,
    private settings: AudioSettings,
  ) {}

  public play(event: SoundEvent): void {
    if (!this.manifest || !this.playback || this.settings.muted) return;
    const entry = this.manifest.sounds.find((sound) => sound.event === event);
    const variant = entry?.variants[0];
    const source = variant?.sources[0];
    if (!entry || !source) return;
    const volume = this.settings.masterVolume * this.settings.categoryVolumes[entry.category];
    this.playback.play(source, volume);
  }

  public updateSettings(settings: AudioSettings): void {
    this.settings = settings;
  }
}
