import type { StageDefinition } from '../schema/StageDefinition';
import { CAT_INTEREST_RULE_ID } from '../../core/rules/catInterestRule';

export const stage001 = {
  id: 'stage-001',
  mission: {
    title: '안전한 한 모금',
    description: '책상 위에 물병을 안전하게 두세요.',
  },
  actors: [
    {
      id: 'cat',
      kind: 'cat',
      position: { x: 665, y: 410 },
      attention: 'idle',
      graphicKey: 'actor.cat.placeholder',
    },
  ],
  objects: [
    {
      id: 'bottle',
      kind: 'bottle',
      position: { x: 210, y: 390 },
      location: 'floor',
      condition: 'upright',
      graphicKey: 'prop.bottle.placeholder',
      draggable: true,
    },
  ],
  activeRuleIds: [CAT_INTEREST_RULE_ID],
  goal: {
    type: 'stable-object-state',
    objectId: 'bottle',
    location: 'desk',
    state: 'upright',
    durationMs: 3000,
  },
  graphicKeys: ['background.room.placeholder', 'furniture.desk.placeholder', 'prop.bottle.placeholder', 'actor.cat.placeholder'],
  soundEvents: ['OBJECT_PICKED_UP', 'OBJECT_PLACED', 'ACTOR_SPOTTED_OBJECT', 'GOAL_STABILITY_STARTED', 'GOAL_COMPLETED'],
} as const satisfies StageDefinition;
