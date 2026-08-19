import type { Goal, GoalEvaluation, StableObjectStateGoalDefinition } from './Goal';
import type { WorldState } from '../types/WorldTypes';

export class StableStateGoal implements Goal {
  public constructor(private readonly definition: StableObjectStateGoalDefinition) {}

  public evaluate(state: WorldState, previousProgressMs: number, deltaMs: number): GoalEvaluation {
    const object = state.objects[this.definition.objectId];
    const matches =
      object !== undefined &&
      object.location === this.definition.location &&
      object.condition === this.definition.state;
    const progressMs = matches
      ? Math.min(this.definition.durationMs, previousProgressMs + Math.max(0, deltaMs))
      : 0;

    return {
      matches,
      progressMs,
      completed: progressMs >= this.definition.durationMs,
    };
  }
}
