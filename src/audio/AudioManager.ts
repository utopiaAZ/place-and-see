import type { AudioAssetDefinition, AudioManifest } from './AudioManifest';
import { soundEventForGameEvent, type SoundEvent } from './SoundEventMap';
import type { AudioSettings } from './soundCategories';
import type { GameEvent } from '../core/events/GameEvent';
import type { WorldState } from '../core/types/WorldTypes';

export interface AudioPlaybackPort {
  unlock(): Promise<boolean>;
  preload?(assets: readonly AudioAssetDefinition[]): Promise<void>;
  play(asset: AudioAssetDefinition, volume: number): void;
  stop(key: string): void;
  stopAll(): void;
  setMuted(muted: boolean): void;
  getActiveKeys(): readonly string[];
  destroy(): void;
}

export interface AudioDebugState {
  readonly unlocked: boolean;
  readonly muted: boolean;
  readonly activeKeys: readonly string[];
  readonly recentKeys: readonly string[];
  readonly assets: readonly AudioAssetDefinition[];
}

export class AudioManager {
  private unlocked = false;
  private readonly activeLoops = new Set<string>();
  private readonly playedOnce = new Set<string>();
  private readonly lastPlayedAt = new Map<string, number>();
  private readonly recentKeys: string[] = [];

  public constructor(
    private readonly manifest: AudioManifest | undefined,
    private readonly playback: AudioPlaybackPort | undefined,
    private settings: AudioSettings,
    private readonly now: () => number = Date.now,
  ) {
    this.playback?.setMuted(settings.muted);
  }

  public async unlock(): Promise<boolean> {
    if (this.unlocked) return true;
    if (!this.playback) return false;
    try {
      this.unlocked = await this.playback.unlock();
      if (this.unlocked) {
        this.playback.setMuted(this.settings.muted);
        void this.playback.preload?.(this.manifest?.sounds ?? []).catch(() => undefined);
      }
      return this.unlocked;
    } catch {
      return false;
    }
  }

  public handleGameEvent(event: GameEvent): void {
    if (event.type === 'CAT_RETURNING') this.stopByEvent('CAT_PLAYING');
    if (event.type === 'PAPER_FLUTTER_STOPPED' || event.type === 'PAPER_BLOWN_AWAY') this.stopByEvent('PAPER_FLUTTER_STARTED');
    if (event.type === 'FAN_STOPPED') this.stopByEvent('FAN_STARTED');
    if (event.type === 'STAGE_COMPLETED') this.stopBehaviorLoops();
    if (event.type === 'STAGE_RESET') {
      this.stopAll();
      this.playedOnce.clear();
      this.lastPlayedAt.clear();
      this.recentKeys.length = 0;
      if (event.state.stageTwo?.fanPower === 'powered') this.play('FAN_STARTED');
    }
    const soundEvent = soundEventForGameEvent(event);
    if (soundEvent) this.play(soundEvent);
  }

  public play(event: SoundEvent): void {
    const asset = this.manifest?.sounds.find((candidate) => candidate.event === event);
    if (asset) this.playAsset(asset);
  }

  public syncWorldState(state: WorldState): void {
    if (state.stageTwo?.fanPower === 'powered') this.play('FAN_STARTED');
    if (state.stageTwo?.paperState === 'fluttering') this.play('PAPER_FLUTTER_STARTED');
  }

  public async playForQa(key: string): Promise<void> {
    const asset = this.manifest?.sounds.find((candidate) => candidate.key === key);
    if (!asset || !(await this.unlock())) return;
    this.stop(key);
    this.playAsset(asset, true);
  }

  public stop(key: string): void {
    this.activeLoops.delete(key);
    this.playback?.stop(key);
  }

  public stopBehaviorLoops(): void {
    this.stopByEvent('CAT_EATING');
    this.stopByEvent('CAT_PLAYING');
    this.stopByEvent('FAN_STARTED');
    this.stopByEvent('PAPER_FLUTTER_STARTED');
  }

  public stopAll(): void {
    this.activeLoops.clear();
    this.playback?.stopAll();
  }

  public updateSettings(settings: AudioSettings): void {
    this.settings = settings;
    this.playback?.setMuted(settings.muted);
    if (settings.muted) this.stopBehaviorLoops();
  }

  public getDebugState(): AudioDebugState {
    return {
      unlocked: this.unlocked,
      muted: this.settings.muted,
      activeKeys: this.playback?.getActiveKeys() ?? [],
      recentKeys: [...this.recentKeys],
      assets: this.manifest?.sounds ?? [],
    };
  }

  public destroy(): void {
    this.stopAll();
    this.playback?.destroy();
    this.unlocked = false;
  }

  private playAsset(asset: AudioAssetDefinition, bypassPolicies = false): void {
    if (!this.playback || !this.unlocked || this.settings.muted) return;
    if (!bypassPolicies) {
      if (asset.loop && this.activeLoops.has(asset.key)) return;
      if (asset.oncePerStage && this.playedOnce.has(asset.key)) return;
      const lastPlayedAt = this.lastPlayedAt.get(asset.key);
      if (lastPlayedAt !== undefined && asset.cooldownMs && this.now() - lastPlayedAt < asset.cooldownMs) return;
    }
    const volume = this.settings.masterVolume * this.settings.categoryVolumes[asset.category] * asset.volume;
    this.playback.play(asset, Math.min(1, Math.max(0, volume)));
    this.recentKeys.push(asset.key);
    if (this.recentKeys.length > 20) this.recentKeys.shift();
    this.lastPlayedAt.set(asset.key, this.now());
    if (asset.loop) this.activeLoops.add(asset.key);
    if (asset.oncePerStage) this.playedOnce.add(asset.key);
  }

  private stopByEvent(event: SoundEvent): void {
    const asset = this.manifest?.sounds.find((candidate) => candidate.event === event);
    if (asset) this.stop(asset.key);
  }
}
