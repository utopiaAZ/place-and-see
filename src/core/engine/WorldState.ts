import type { PuzzleStageDefinition } from '../types/PuzzleStageDefinition';
import type { ActorState, ObjectState, WorldState } from '../types/WorldTypes';

const cloneObject = (object: ObjectState): ObjectState => ({ ...object, position: { ...object.position } });
const cloneActor = (actor: ActorState): ActorState => ({
  ...actor,
  position: { ...actor.position },
  homePosition: { ...actor.homePosition },
});

export function createInitialWorldState(stage: PuzzleStageDefinition): WorldState {
  return {
    stageId: stage.id,
    elapsedMs: 0,
    objects: Object.fromEntries(stage.objects.map((object) => [object.id, cloneObject(object)])),
    actors: Object.fromEntries(stage.actors.map((actor) => [actor.id, cloneActor(actor)])),
    goal: { active: false, stableForMs: 0, requiredMs: stage.goal.durationMs, completed: false, progress: 0 },
    progressState: 'playing',
    status: 'observing',
    spillVisible: false,
    spillPosition: null,
    stageTwo: stage.stageTwo ? {
      fanPower: 'powered',
      fanDirection: 'away',
      fanPhaseElapsedMs: 0,
      fanSlowdownRemainingMs: 0,
      bladesSpinning: true,
      plugConnected: true,
      paperState: 'at-initial-position',
      paperFlutterElapsedMs: 0,
      paperProtection: 'none',
      airflowBlocked: false,
      airflowReachesPaper: false,
    } : null,
  };
}

export function cloneWorldState(state: WorldState): WorldState {
  return {
    ...state,
    objects: Object.fromEntries(Object.entries(state.objects).map(([id, object]) => [id, cloneObject(object)])),
    actors: Object.fromEntries(Object.entries(state.actors).map(([id, actor]) => [id, cloneActor(actor)])),
    goal: { ...state.goal },
    spillPosition: state.spillPosition ? { ...state.spillPosition } : null,
    stageTwo: state.stageTwo ? { ...state.stageTwo } : null,
  };
}
