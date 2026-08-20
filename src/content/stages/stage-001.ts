import { STAGE_ONE_RULE_ID } from '../../core/rules/StageOneRuleSystem';
import type { StageDefinition } from '../schema/StageDefinition';

const stage001Placements = {
  'shelf-bottom-slot': { x: 200, y: 633 },
  'desk-bottle': { x: 1200, y: 385 },
  'desk-bottle-on-mat': { x: 1200, y: 352 },
  'desk-mat': { x: 1200, y: 425 },
} as const;

const objectDefaults = {
  orientation: null,
  isSupportedByMat: false,
  effectRemainingMs: 0,
  draggable: true,
  inputLocked: false,
  isBeingDragged: false,
} as const;

export const stage001 = {
  id: 'stage-001',
  mission: {
    title: '책상 위에 물병을 안전하게 두세요.',
    description: '물병이 일정 시간 똑바로 유지되면 완료됩니다.',
  },
  actors: [{
    id: 'cat', kind: 'cat', position: { x: 790, y: 600 }, homePosition: { x: 790, y: 600 },
    behavior: 'idle', behaviorElapsedMs: 0, attentionTargetId: null, pendingDistraction: null,
    graphicKey: 'actor.cat.rig',
  }],
  objects: [
    { ...objectDefaults, id: 'bottle', kind: 'bottle', position: { x: 200, y: 430 }, zoneId: 'shelf', orientation: 'upright', graphicKey: 'prop.bottle' },
    { ...objectDefaults, id: 'cat-food', kind: 'cat-food', position: { x: 140, y: 545 }, zoneId: 'shelf', graphicKey: 'prop.cat-food' },
    { ...objectDefaults, id: 'toy-mouse', kind: 'toy-mouse', position: { x: 260, y: 545 }, zoneId: 'shelf', graphicKey: 'prop.toy-mouse' },
    { ...objectDefaults, id: 'non-slip-mat', kind: 'non-slip-mat', position: stage001Placements['shelf-bottom-slot'], zoneId: 'shelf', graphicKey: 'prop.non-slip-mat' },
  ],
  zones: [
    { id: 'floor', type: 'walkable-surface', bounds: { x: 40, y: 600, width: 1520, height: 260 }, accepts: ['bottle', 'cat-food', 'toy-mouse', 'non-slip-mat'] },
    { id: 'shelf', type: 'object-surface', bounds: { x: 70, y: 230, width: 300, height: 350 }, accepts: ['bottle', 'cat-food', 'toy-mouse', 'non-slip-mat'] },
    {
      id: 'desk-surface', type: 'object-surface', bounds: { x: 930, y: 280, width: 550, height: 190 }, accepts: ['bottle', 'non-slip-mat'],
      snapPositions: { bottle: stage001Placements['desk-bottle'], 'non-slip-mat': stage001Placements['desk-mat'] },
    },
  ],
  activeRuleIds: [STAGE_ONE_RULE_ID],
  timings: {
    catDetectMs: 250, catNoticeMs: 350, catPrepareMs: 400, catJumpMs: 500,
    catTapMs: 150, bottleWobbleMs: 500, catReturnMs: 600, toyDistractionMs: 5000,
  },
  goal: { type: 'stable-object-state', objectId: 'bottle', zoneId: 'desk-surface', orientation: 'upright', durationMs: 3000 },
  graphicKeys: [
    'furniture.desk', 'furniture.chair', 'furniture.shelf', 'prop.bottle', 'prop.cat-food',
    'prop.toy-mouse', 'prop.non-slip-mat', 'prop.water-puddle', 'actor.cat.rig',
  ],
  soundEvents: [
    'OBJECT_PICKED_UP', 'OBJECT_PLACED', 'BOTTLE_WOBBLED', 'BOTTLE_FELL', 'CAT_NOTICED_BOTTLE',
    'WATER_SPILLED', 'CAT_PREPARING_JUMP', 'CAT_JUMPED', 'CAT_LANDED', 'CAT_TAPPED_BOTTLE',
    'CAT_EATING', 'CAT_PLAYING', 'OBJECT_DROP_REJECTED', 'GOAL_STABILITY_STARTED',
    'GOAL_STABILITY_RESET', 'GOAL_COMPLETED', 'UI_RESET',
  ],
  scene: {
    floorTopY: 690,
    placements: stage001Placements,
    furniture: [
      { key: 'furniture.shelf', position: { x: 200, y: 530 }, displaySize: { width: 240, height: 320 }, depth: 2 },
      { key: 'furniture.chair', position: { x: 780, y: 565 }, displaySize: { width: 200, height: 250 }, depth: 2 },
      { key: 'furniture.desk', position: { x: 1200, y: 545 }, displaySize: { width: 500, height: 300 }, depth: 3 },
    ],
  },
} as const satisfies StageDefinition;
