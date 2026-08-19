import type { StageDefinition } from '../content/schema/StageDefinition';
import type { CommandResult, GameCommand } from '../core/commands/GameCommand';
import { PuzzleEngine } from '../core/engine/PuzzleEngine';
import type { GameEventListener } from '../core/events/GameEvent';
import type { WorldState } from '../core/types/WorldTypes';

export class GameBridge {
  private readonly engine: PuzzleEngine;
  private snapshot: WorldState;
  private readonly storeListeners = new Set<() => void>();
  private readonly detachEngineListener: () => void;
  private destroyed = false;

  public constructor(stage: StageDefinition) {
    this.engine = new PuzzleEngine(stage);
    this.snapshot = this.engine.getState();
    this.detachEngineListener = this.engine.subscribe((event) => {
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
    this.engine.reset();
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
  }

  private assertActive(): void {
    if (this.destroyed) throw new Error('GameBridge has been destroyed.');
  }
}
