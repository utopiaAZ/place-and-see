import type { CommandResult, GameCommand } from '../commands/GameCommand';
import type { GameEvent, GameEventListener } from '../events/GameEvent';
import { GoalEvaluator } from '../goals/GoalEvaluator';
import { CAT_INTEREST_RULE_ID, evaluateCatInterest } from '../rules/catInterestRule';
import type { PuzzleStageDefinition } from '../types/PuzzleStageDefinition';
import type { WorldState } from '../types/WorldTypes';
import { SimulationClock } from './SimulationClock';
import { cloneWorldState, createInitialWorldState } from './WorldState';

export class PuzzleEngine {
  private state: WorldState;
  private readonly listeners = new Set<GameEventListener>();
  private readonly goalEvaluator: GoalEvaluator;
  private readonly clock = new SimulationClock();

  public constructor(private readonly stage: PuzzleStageDefinition) {
    this.state = createInitialWorldState(stage);
    this.goalEvaluator = new GoalEvaluator(stage.goal);
  }

  public dispatch(command: GameCommand): CommandResult {
    if (command.type === 'MOVE_OBJECT') {
      const object = this.state.objects[command.objectId];
      if (!object) return this.reject(`Unknown object id: ${command.objectId}`);
      if (!object.draggable) return this.reject(`Object is not draggable: ${command.objectId}`);

      const previousLocation = object.location;
      this.state = {
        ...this.state,
        objects: {
          ...this.state.objects,
          [object.id]: { ...object, position: { ...command.position }, location: command.location },
        },
      };
      this.emit({ type: 'OBJECT_MOVED', objectId: object.id, position: command.position, location: command.location });
      if (previousLocation !== command.location) {
        this.emit({ type: 'OBJECT_PLACED', objectId: object.id, location: command.location });
      }
      if (this.stage.activeRuleIds.includes(CAT_INTEREST_RULE_ID)) {
        for (const event of evaluateCatInterest(this.state, object.id)) this.emit(event);
      }
      this.updateGoal(0);
      this.emitState();
      return { accepted: true };
    }

    if (!Number.isFinite(command.deltaMs) || command.deltaMs < 0) {
      return this.reject('deltaMs must be a finite, non-negative number.');
    }
    this.clock.advance(command.deltaMs);
    this.state = { ...this.state, elapsedMs: this.clock.elapsedMs };
    this.updateGoal(command.deltaMs);
    this.emitState();
    return { accepted: true };
  }

  public reset(): void {
    this.clock.reset();
    this.state = createInitialWorldState(this.stage);
    const snapshot = this.getState();
    this.emit({ type: 'STAGE_RESET', state: snapshot });
    this.emit({ type: 'STATE_CHANGED', state: snapshot });
  }

  public getState(): WorldState {
    return cloneWorldState(this.state);
  }

  public subscribe(listener: GameEventListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public destroy(): void {
    this.listeners.clear();
  }

  private updateGoal(deltaMs: number): void {
    const previous = this.state.goal;
    const evaluation = this.goalEvaluator.evaluate(this.state, previous.stableForMs, deltaMs);
    this.state = {
      ...this.state,
      goal: {
        active: evaluation.matches,
        stableForMs: evaluation.progressMs,
        requiredMs: this.goalEvaluator.requiredMs,
        completed: evaluation.completed,
      },
    };

    if (!previous.active && evaluation.matches) this.emit({ type: 'GOAL_STABILITY_STARTED' });
    if (previous.active && !evaluation.matches) this.emit({ type: 'GOAL_STABILITY_RESET' });
    if (!previous.completed && evaluation.completed) this.emit({ type: 'GOAL_COMPLETED' });
  }

  private reject(reason: string): CommandResult {
    this.emit({ type: 'COMMAND_REJECTED', reason });
    return { accepted: false, reason };
  }

  private emitState(): void {
    this.emit({ type: 'STATE_CHANGED', state: this.getState() });
  }

  private emit(event: GameEvent): void {
    for (const listener of this.listeners) listener(event);
  }
}
