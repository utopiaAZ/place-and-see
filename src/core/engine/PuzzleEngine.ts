import type { CommandResult, GameCommand } from '../commands/GameCommand';
import type { GameEvent, GameEventListener } from '../events/GameEvent';
import { StageOneRuleSystem, STAGE_ONE_RULE_ID, type RuleResult } from '../rules/StageOneRuleSystem';
import type { PuzzleStageDefinition } from '../types/PuzzleStageDefinition';
import type { WorldState } from '../types/WorldTypes';
import { SimulationClock } from './SimulationClock';
import { cloneWorldState, createInitialWorldState } from './WorldState';

export class PuzzleEngine {
  private state: WorldState;
  private readonly listeners = new Set<GameEventListener>();
  private readonly clock = new SimulationClock();
  private readonly rules: StageOneRuleSystem;

  public constructor(private readonly stage: PuzzleStageDefinition) {
    if (!stage.activeRuleIds.includes(STAGE_ONE_RULE_ID)) throw new Error(`Stage ${stage.id} must enable ${STAGE_ONE_RULE_ID}.`);
    this.state = createInitialWorldState(stage);
    this.rules = new StageOneRuleSystem(stage);
  }

  public dispatch(command: GameCommand): CommandResult {
    if (command.type === 'RESET_STAGE') {
      this.reset();
      return { accepted: true };
    }
    const beforeElapsedMs = this.state.elapsedMs;
    const result = (() => {
      switch (command.type) {
        case 'PICK_UP_OBJECT': return this.rules.pickUp(this.state, command.objectId);
        case 'CANCEL_DRAG': return this.rules.cancelDrag(this.state, command.objectId);
        case 'REPORT_INVALID_DROP': return this.rules.reportInvalidDrop(this.state, command.objectId);
        case 'DROP_OBJECT': return this.rules.drop(this.state, command.objectId, command.zoneId, command.worldPosition);
        case 'ADVANCE_TIME': return this.rules.advance(this.state, command.deltaMs);
      }
    })();
    this.applyResult(result, beforeElapsedMs);
    return { accepted: result.accepted, reason: result.reason };
  }

  public reset(): void {
    this.clock.reset();
    this.state = createInitialWorldState(this.stage);
    const snapshot = this.getState();
    this.emit({ type: 'STAGE_RESET', state: snapshot });
    this.emit({ type: 'STATE_CHANGED', state: snapshot });
  }

  public getState(): WorldState { return cloneWorldState(this.state); }

  public subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void { this.listeners.clear(); }

  private applyResult(result: RuleResult, beforeElapsedMs: number): void {
    if (!result.accepted) {
      for (const event of result.events) this.emit(event);
      return;
    }
    if (result.state === this.state && result.events.length === 0) return;
    const elapsedDelta = result.state.elapsedMs - beforeElapsedMs;
    if (elapsedDelta > 0) this.clock.advance(elapsedDelta);
    this.state = result.state;
    for (const event of result.events) this.emit(event);
    this.emit({ type: 'STATE_CHANGED', state: this.getState() });
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
