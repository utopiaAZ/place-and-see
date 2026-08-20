import type { AudioAssetDefinition } from './AudioManifest';
import type { AudioPlaybackPort } from './AudioManager';

type AudioContextConstructor = new () => AudioContext;

export class WebAudioPlaybackBackend implements AudioPlaybackPort {
  private context: AudioContext | undefined;
  private masterGain: GainNode | undefined;
  private muted = false;
  private destroyed = false;
  private readonly buffers = new Map<string, Promise<AudioBuffer | undefined>>();
  private readonly active = new Map<string, Set<AudioBufferSourceNode>>();
  private readonly generations = new Map<string, number>();

  public async unlock(): Promise<boolean> {
    if (this.destroyed) return false;
    try {
      if (!this.context) {
        const AudioContextClass = this.getAudioContextConstructor();
        if (!AudioContextClass) return false;
        this.context = new AudioContextClass();
        this.masterGain = this.context.createGain();
        this.masterGain.connect(this.context.destination);
        this.applyMute();
      }
      if (this.context.state !== 'running') await this.context.resume();
      return this.context.state === 'running';
    } catch {
      return false;
    }
  }

  public async preload(assets: readonly AudioAssetDefinition[]): Promise<void> {
    if (!this.context || this.destroyed) return;
    await Promise.all(assets.map((asset) => this.loadBuffer(asset.url)));
  }

  public play(asset: AudioAssetDefinition, volume: number): void {
    if (!this.context || !this.masterGain || this.destroyed || this.muted) return;
    const generation = this.generations.get(asset.key) ?? 0;
    void this.startWhenLoaded(asset, volume, generation);
  }

  public stop(key: string): void {
    this.generations.set(key, (this.generations.get(key) ?? 0) + 1);
    const sources = this.active.get(key);
    if (!sources) return;
    for (const source of sources) {
      try { source.stop(); } catch { /* The source may already have ended. */ }
    }
    this.active.delete(key);
  }

  public stopAll(): void {
    const keys = new Set([...this.active.keys(), ...this.generations.keys()]);
    for (const key of keys) this.stop(key);
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    this.applyMute();
  }

  public getActiveKeys(): readonly string[] {
    return [...this.active.entries()].filter(([, sources]) => sources.size > 0).map(([key]) => key).sort();
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.stopAll();
    void this.context?.close().catch(() => undefined);
    this.context = undefined;
    this.masterGain = undefined;
    this.buffers.clear();
  }

  private async startWhenLoaded(asset: AudioAssetDefinition, volume: number, generation: number): Promise<void> {
    try {
      const buffer = await this.loadBuffer(asset.url);
      if (!buffer || !this.context || !this.masterGain || this.destroyed || this.muted) return;
      if ((this.generations.get(asset.key) ?? 0) !== generation) return;
      const current = this.active.get(asset.key) ?? new Set<AudioBufferSourceNode>();
      if (current.size >= (asset.maxInstances ?? 1)) return;
      const offset = Math.max(0, (asset.startMs ?? 0) / 1000);
      const availableDuration = Math.max(0, buffer.duration - offset);
      const duration = Math.min((asset.durationMs ?? availableDuration * 1000) / 1000, availableDuration);
      if (duration <= 0) return;

      const source = this.context.createBufferSource();
      const gain = this.context.createGain();
      source.buffer = buffer;
      source.loop = asset.loop ?? false;
      if (source.loop) {
        source.loopStart = offset;
        source.loopEnd = offset + duration;
      }
      gain.gain.value = volume;
      source.connect(gain).connect(this.masterGain);
      current.add(source);
      this.active.set(asset.key, current);
      source.onended = () => {
        current.delete(source);
        if (current.size === 0) this.active.delete(asset.key);
      };
      if (source.loop) source.start(0, offset); else source.start(0, offset, duration);
    } catch {
      // Audio is optional. Decode/playback failures must never affect game state.
    }
  }

  private loadBuffer(url: string): Promise<AudioBuffer | undefined> {
    const cached = this.buffers.get(url);
    if (cached) return cached;
    const loading = (async () => {
      if (!this.context) return undefined;
      try {
        const response = await fetch(url);
        if (!response.ok) {
          if (import.meta.env.DEV) console.error(`[Place & See] Failed to load audio: ${url} (${response.status})`);
          return undefined;
        }
        return await this.context.decodeAudioData(await response.arrayBuffer());
      } catch (error) {
        if (import.meta.env.DEV) console.error(`[Place & See] Failed to decode audio: ${url}`, error);
        return undefined;
      }
    })();
    this.buffers.set(url, loading);
    return loading;
  }

  private applyMute(): void {
    if (!this.context || !this.masterGain) return;
    this.masterGain.gain.setValueAtTime(this.muted ? 0 : 1, this.context.currentTime);
  }

  private getAudioContextConstructor(): AudioContextConstructor | undefined {
    const host = globalThis as typeof globalThis & { webkitAudioContext?: AudioContextConstructor };
    return host.AudioContext ?? host.webkitAudioContext;
  }
}
