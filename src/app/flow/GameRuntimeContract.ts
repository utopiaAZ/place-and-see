import type { AudioPlaybackPort } from '../../audio/AudioManager';
import type { AudioDebugState } from '../../audio/AudioManager';
import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { GameEventListener } from '../../core/events/GameEvent';
import type { WorldState } from '../../core/types/WorldTypes';
import type { ShellStageId } from './AppFlow';

export interface RuntimeBridge {
  getStage(): StageDefinition;
  getState(): WorldState;
  subscribeToState(listener: () => void): () => void;
  subscribe(listener: GameEventListener): () => void;
  reset(): void;
  setMuted(muted: boolean): void;
  unlockAudio(): Promise<boolean>;
  stopAudioLoops(): void;
  getAudioDebugState(): AudioDebugState;
  playAudioForQa(key: string): Promise<void>;
  stopAudioForQa(key: string): void;
  stopAllAudioForQa(): void;
  destroy(): void;
}

export interface PreparedStageAudio {
  readonly playback: AudioPlaybackPort;
  readonly unlockPromise: Promise<boolean> | null;
  setMuted(muted: boolean): void;
  destroy(): void;
}

export interface ManagedGameSession<TBridge extends RuntimeBridge = RuntimeBridge> {
  readonly stageId: ShellStageId;
  readonly bridge: TBridge;
  mount(parent: object): () => void;
  destroy(): void;
}

export interface GameRuntimeModule<TBridge extends RuntimeBridge = RuntimeBridge> {
  createSession(
    stageId: ShellStageId,
    muted: boolean,
    audio: PreparedStageAudio,
  ): ManagedGameSession<TBridge> | Promise<ManagedGameSession<TBridge>>;
}

export type GameRuntimeLoader<TBridge extends RuntimeBridge = RuntimeBridge> = () => Promise<GameRuntimeModule<TBridge>>;
export type StageAudioPreparer = (muted: boolean, unlockFromGesture: boolean) => PreparedStageAudio;
