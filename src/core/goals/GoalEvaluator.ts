import type { GoalDefinition } from './Goal';
import type { WorldState } from '../types/WorldTypes';
import { StableStateGoal } from './StableStateGoal';

export class GoalEvaluator {
  private readonly goal: StableStateGoal;

  public constructor(private readonly definition: GoalDefinition) {
    this.goal = new StableStateGoal(definition);
  }

  public evaluate(state: WorldState, previousProgressMs: number, deltaMs: number) {
    return this.goal.evaluate(state, previousProgressMs, deltaMs);
  }

  public get requiredMs(): number {
    return this.definition.durationMs;
  }
}
