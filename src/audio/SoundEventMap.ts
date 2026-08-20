import type { GameEvent } from '../core/events/GameEvent';

export type SoundEvent =
  | 'OBJECT_PICKED_UP'
  | 'OBJECT_PLACED'
  | 'BOTTLE_WOBBLED'
  | 'BOTTLE_FELL'
  | 'WATER_SPILLED'
  | 'CAT_NOTICED_BOTTLE'
  | 'CAT_PREPARING_JUMP'
  | 'CAT_JUMPED'
  | 'CAT_LANDED'
  | 'CAT_TAPPED_BOTTLE'
  | 'CAT_EATING'
  | 'CAT_PLAYING'
  | 'OBJECT_DROP_REJECTED'
  | 'GOAL_STABILITY_STARTED'
  | 'GOAL_STABILITY_RESET'
  | 'GOAL_COMPLETED'
  | 'UI_RESET';

export function soundEventForGameEvent(event: GameEvent): SoundEvent | undefined {
  switch (event.type) {
    case 'OBJECT_PICKED_UP': return event.objectId === 'bottle' ? 'OBJECT_PICKED_UP' : undefined;
    case 'OBJECT_DROPPED': return event.objectId === 'bottle' ? 'OBJECT_PLACED' : undefined;
    case 'BOTTLE_WOBBLED': return 'BOTTLE_WOBBLED';
    case 'BOTTLE_FELL': return 'BOTTLE_FELL';
    case 'WATER_SPILLED': return 'WATER_SPILLED';
    case 'CAT_NOTICED_BOTTLE': return 'CAT_NOTICED_BOTTLE';
    case 'CAT_PREPARING_JUMP': return 'CAT_PREPARING_JUMP';
    case 'CAT_JUMPED': return 'CAT_JUMPED';
    case 'CAT_LANDED': return 'CAT_LANDED';
    case 'CAT_TAPPED_BOTTLE': return 'CAT_TAPPED_BOTTLE';
    case 'CAT_DISTRACTED_BY_FOOD': return 'CAT_EATING';
    case 'CAT_DISTRACTED_BY_TOY': return 'CAT_PLAYING';
    case 'OBJECT_DROP_REJECTED': return 'OBJECT_DROP_REJECTED';
    case 'GOAL_STABILITY_STARTED': return 'GOAL_STABILITY_STARTED';
    case 'GOAL_STABILITY_RESET': return 'GOAL_STABILITY_RESET';
    case 'STAGE_COMPLETED': return 'GOAL_COMPLETED';
    case 'STAGE_RESET': return 'UI_RESET';
    default: return undefined;
  }
}
