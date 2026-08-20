import type { StageDefinition } from '../content/schema/StageDefinition';
import type { CommandResult, GameCommand } from '../core/commands/GameCommand';
import { PuzzleEngine } from '../core/engine/PuzzleEngine';
import type { GameEventListener } from '../core/events/GameEvent';
import type { WorldState } from '../core/types/WorldTypes';
import { AudioManager } from '../audio/AudioManager';
import type { AudioDebugState } from '../audio/AudioManager';
import { DEFAULT_AUDIO_SETTINGS, type AudioSettings } from '../audio/soundCategories';

export class GameBridge {
  private readonly engine: PuzzleEngine;
  private snapshot: WorldState;
  private readonly storeListeners = new Set<() => void>();
  private readonly detachEngineListener: () => void;
  private readonly audioManager: AudioManager;
  private audioSettings: AudioSettings = DEFAULT_AUDIO_SETTINGS;
  private destroyed = false;

  public constructor(private readonly stage: StageDefinition, audioManager?: AudioManager) {
    this.engine = new PuzzleEngine(stage);
    this.audioManager = audioManager ?? new AudioManager(undefined, undefined, this.audioSettings);
    this.snapshot = this.engine.getState();
    this.detachEngineListener = this.engine.subscribe((event) => {
      this.audioManager.handleGameEvent(event);
      if (event.type === 'STATE_CHANGED' || event.type === 'STAGE_RESET') {
        this.snapshot = event.state;
        for (const listener of this.storeListeners) listener();
      }
    });
  }

  public dispatch(command: GameCommand): CommandResult {
    this.assertActive();
    return this.engine.dispatch(command);
  }

  public reset(): void {
    this.assertActive();
    this.engine.dispatch({ type: 'RESET_STAGE' });
  }

  public getStage = (): StageDefinition => this.stage;

  public setMuted(muted: boolean): void {
    this.audioSettings = { ...this.audioSettings, muted };
    this.audioManager.updateSettings(this.audioSettings);
  }

  public unlockAudio(): Promise<boolean> {
    return this.audioManager.unlock();
  }

  public stopAudioLoops(): void {
    this.audioManager.stopBehaviorLoops();
  }

  public getAudioDebugState(): AudioDebugState {
    return this.audioManager.getDebugState();
  }

  public playAudioForQa(key: string): Promise<void> {
    return this.audioManager.playForQa(key);
  }

  public stopAudioForQa(key: string): void {
    this.audioManager.stop(key);
  }

  public stopAllAudioForQa(): void {
    this.audioManager.stopAll();
  }

  public getState = (): WorldState => this.snapshot;

  public subscribeToState = (listener: () => void): (() => void) => {
    if (this.destroyed) return () => undefined;
    this.storeListeners.add(listener);
    return () => this.storeListeners.delete(listener);
  };

  public subscribe(listener: GameEventListener): () => void {
    this.assertActive();
    return this.engine.subscribe(listener);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.detachEngineListener();
    this.storeListeners.clear();
    this.engine.destroy();
    this.audioManager.destroy();
  }

  private assertActive(): void {
    if (this.destroyed) throw new Error('GameBridge has been destroyed.');
  }
}
