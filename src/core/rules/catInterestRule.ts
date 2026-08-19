import type { GameEvent } from '../events/GameEvent';
import type { WorldState } from '../types/WorldTypes';

export const CAT_INTEREST_RULE_ID = 'rule.cat-interest-on-bottle-at-desk';

export function evaluateCatInterest(state: WorldState, movedObjectId: string): GameEvent[] {
  if (movedObjectId !== 'bottle' || state.objects.bottle?.location !== 'desk' || !state.actors.cat) {
    return [];
  }

  // TODO(stage-001 reaction): schedule a Core command that changes the bottle to
  // `fallen` after the cat's approach delay. Phaser should only animate emitted events.
  return [{ type: 'ACTOR_SPOTTED_OBJECT', actorId: 'cat', objectId: 'bottle' }];
}
