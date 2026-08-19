import type { PuzzleStageDefinition } from '../types/PuzzleStageDefinition';
import type { ActorState, ObjectState, WorldState } from '../types/WorldTypes';

const cloneObject = (object: ObjectState): ObjectState => ({
  ...object,
  position: { ...object.position },
});

const cloneActor = (actor: ActorState): ActorState => ({
  ...actor,
  position: { ...actor.position },
});

export function createInitialWorldState(stage: PuzzleStageDefinition): WorldState {
  return {
    stageId: stage.id,
    elapsedMs: 0,
    objects: Object.fromEntries(stage.objects.map((object) => [object.id, cloneObject(object)])),
    actors: Object.fromEntries(stage.actors.map((actor) => [actor.id, cloneActor(actor)])),
    goal: {
      active: false,
      stableForMs: 0,
      requiredMs: stage.goal.durationMs,
      completed: false,
    },
  };
}

export function cloneWorldState(state: WorldState): WorldState {
  return {
    ...state,
    objects: Object.fromEntries(Object.entries(state.objects).map(([id, object]) => [id, cloneObject(object)])),
    actors: Object.fromEntries(Object.entries(state.actors).map(([id, actor]) => [id, cloneActor(actor)])),
    goal: { ...state.goal },
  };
}
