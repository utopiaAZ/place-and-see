import { STAGE_THREE_RULE_ID } from '../../core/rules/StageThreeRuleSystem';
import type { StageDefinition } from '../schema/StageDefinition';

export const stage003Placements = {
  'cake-initial': { x: 200, y: 455 },
  'lighter-initial': { x: 140, y: 330 },
  'food-initial': { x: 275, y: 330 },
  'toy-initial': { x: 480, y: 735 },
  'divider-initial': { x: 205, y: 625 },
  'cat-home': { x: 915, y: 635 },
  'chair-seat': { x: 790, y: 551 },
  'fan-on-chair': { x: 790, y: 446 },
  'fan-base-cable': { x: 702, y: 526 },
  'plugged-anchor': { x: 634, y: 460 },
  'unplugged-anchor': { x: 710, y: 655 },
  'cake-desk': { x: 1210, y: 385 },
  'candle-anchor': { x: 1210, y: 318 },
  'lighter-home': { x: 140, y: 330 },
  'cat-food': { x: 1020, y: 740 },
  'toy-distraction': { x: 1125, y: 740 },
  'airflow-blocker': { x: 1010, y: 390 },
  'desk-prop': { x: 1370, y: 390 },
  'cake-damaged': { x: 1130, y: 735 },
} as const;

const objectDefaults = {
  orientation: null, isSupportedByMat: false, effectRemainingMs: 0,
  draggable: true, inputLocked: false, isBeingDragged: false,
} as const;

export const stage003 = {
  id: 'stage-003',
  mission: { title: 'Stage 3 — 생일 케이크 준비', description: '촛불을 켠 케이크를 책상 위에 준비하세요.' },
  actors: [{
    id: 'cat', kind: 'cat', position: stage003Placements['cat-home'], homePosition: stage003Placements['cat-home'],
    behavior: 'idle', behaviorElapsedMs: 0, attentionTargetId: null, pendingDistraction: null, graphicKey: 'actor.cat.rig',
  }],
  objects: [
    { ...objectDefaults, id: 'cake', kind: 'cake', position: stage003Placements['cake-initial'], zoneId: 'shelf', graphicKey: 'stage003.cake' },
    { ...objectDefaults, id: 'lighter', kind: 'lighter', position: stage003Placements['lighter-initial'], zoneId: 'shelf', graphicKey: 'stage003.lighter' },
    { ...objectDefaults, id: 'cat-food', kind: 'cat-food', position: stage003Placements['food-initial'], zoneId: 'shelf', graphicKey: 'prop.cat-food' },
    { ...objectDefaults, id: 'toy-mouse', kind: 'toy-mouse', position: stage003Placements['toy-initial'], zoneId: 'floor', graphicKey: 'prop.toy-mouse' },
    { ...objectDefaults, id: 'file-divider', kind: 'file-divider', position: stage003Placements['divider-initial'], zoneId: 'shelf', graphicKey: 'stage002.file-divider' },
    { ...objectDefaults, id: 'power-plug', kind: 'power-plug', position: stage003Placements['plugged-anchor'], zoneId: 'plug-socket', graphicKey: 'stage002.power-plug' },
  ],
  zones: [
    { id: 'floor', type: 'walkable-surface', bounds: { x: 40, y: 680, width: 1520, height: 180 }, accepts: ['cake', 'lighter', 'cat-food', 'toy-mouse', 'file-divider', 'power-plug'] },
    { id: 'shelf', type: 'object-surface', bounds: { x: 70, y: 230, width: 300, height: 430 }, accepts: ['cake', 'lighter', 'cat-food', 'file-divider'] },
    { id: 'cake-desk', type: 'object-surface', bounds: { x: 1120, y: 320, width: 200, height: 145 }, accepts: ['cake'], snapPositions: { cake: stage003Placements['cake-desk'] } },
    { id: 'candle-ignition', type: 'object-surface', bounds: { x: 1160, y: 275, width: 105, height: 115 }, accepts: ['lighter'], snapPositions: { lighter: stage003Placements['candle-anchor'] } },
    { id: 'cat-food-zone', type: 'walkable-surface', bounds: { x: 940, y: 675, width: 130, height: 145 }, accepts: ['cat-food'], snapPositions: { 'cat-food': stage003Placements['cat-food'] } },
    { id: 'toy-distraction-zone', type: 'walkable-surface', bounds: { x: 1075, y: 675, width: 130, height: 145 }, accepts: ['toy-mouse'], snapPositions: { 'toy-mouse': stage003Placements['toy-distraction'] } },
    { id: 'airflow-blocker', type: 'object-surface', bounds: { x: 945, y: 285, width: 150, height: 200 }, accepts: ['file-divider'], snapPositions: { 'file-divider': stage003Placements['airflow-blocker'] } },
    { id: 'desk-props', type: 'object-surface', bounds: { x: 1320, y: 300, width: 130, height: 170 }, accepts: ['lighter', 'file-divider'], snapPositions: { lighter: stage003Placements['desk-prop'], 'file-divider': stage003Placements['desk-prop'] } },
    { id: 'plug-socket', type: 'object-surface', bounds: { x: 590, y: 410, width: 100, height: 120 }, accepts: ['power-plug'], snapPositions: { 'power-plug': stage003Placements['plugged-anchor'] } },
    { id: 'plug-unplugged', type: 'walkable-surface', bounds: { x: 650, y: 560, width: 250, height: 110 }, accepts: ['power-plug'], snapPositions: { 'power-plug': stage003Placements['unplugged-anchor'] } },
  ],
  activeRuleIds: [STAGE_THREE_RULE_ID],
  timings: { catDetectMs: 250, catNoticeMs: 350, catPrepareMs: 400, catJumpMs: 500, catTapMs: 150, bottleWobbleMs: 0, catReturnMs: 600, toyDistractionMs: 5000 },
  stageThree: {
    fanPhaseDurationMs: 1000, fanSlowdownMs: 600, candleIgnitionMs: 300, candleLitHoldMs: 100, candleBlowoutMs: 450,
    cakeObjectId: 'cake', lighterObjectId: 'lighter', foodObjectId: 'cat-food', toyObjectId: 'toy-mouse', blockerObjectId: 'file-divider', plugObjectId: 'power-plug',
    cakeDeskZoneId: 'cake-desk', ignitionZoneId: 'candle-ignition', foodZoneId: 'cat-food-zone', toyZoneId: 'toy-distraction-zone', blockerZoneId: 'airflow-blocker', unpluggedZoneId: 'plug-unplugged',
    lighterHomePosition: stage003Placements['lighter-home'], damagedCakePosition: stage003Placements['cake-damaged'],
  },
  goal: { type: 'stable-object-state', objectId: 'cake', zoneId: 'cake-desk', orientation: 'upright', durationMs: 3000 },
  graphicKeys: ['furniture.desk', 'furniture.chair', 'furniture.shelf', 'actor.cat.rig', 'prop.cat-food', 'prop.toy-mouse', 'stage002.file-divider', 'stage002.fan-body', 'stage002.fan-head', 'stage002.fan-blades', 'stage002.power-outlet', 'stage002.power-plug', 'stage003.cake', 'stage003.candle', 'stage003.flame', 'stage003.lighter', 'stage003.cake-damage-overlay', 'stage003.smoke-puff'],
  soundEvents: ['OBJECT_DROP_REJECTED', 'GOAL_STABILITY_STARTED', 'GOAL_STABILITY_RESET', 'GOAL_COMPLETED', 'UI_RESET', 'FAN_STARTED', 'FAN_SLOWING_DOWN', 'FAN_STOPPED', 'CAKE_PLACED', 'CAT_HIT_CAKE', 'CANDLE_LIGHTING_STARTED', 'CANDLE_BLOWN_OUT', 'CAT_NOTICED_CAKE', 'CAT_PREPARING_JUMP', 'CAT_LANDED', 'CAT_PLAYING', 'CAT_EATING'],
  scene: {
    floorTopY: 690, placements: stage003Placements,
    furniture: [
      { key: 'furniture.shelf', position: { x: 200, y: 530 }, displaySize: { width: 240, height: 320 }, depth: 2 },
      { key: 'furniture.chair', position: { x: 790, y: 565 }, displaySize: { width: 200, height: 250 }, depth: 2 },
      { key: 'furniture.desk', position: { x: 1200, y: 545 }, displaySize: { width: 500, height: 300 }, depth: 3 },
    ],
    objectVisuals: {
      cake: { displaySize: { width: 150, height: 105 }, hitSize: { width: 145, height: 100 }, depth: 48 },
      lighter: { displaySize: { width: 48, height: 92 }, hitSize: { width: 52, height: 96 }, depth: 52 },
      'cat-food': { displaySize: { width: 92, height: 72 }, hitSize: { width: 88, height: 70 }, depth: 42 },
      'toy-mouse': { displaySize: { width: 94, height: 58 }, hitSize: { width: 92, height: 58 }, depth: 42 },
      'file-divider': { displaySize: { width: 120, height: 112 }, hitSize: { width: 112, height: 108 }, depth: 44 },
      'power-plug': { displaySize: { width: 76, height: 62 }, hitSize: { width: 72, height: 58 }, depth: 45 },
    },
    stageThree: {
      fanPosition: stage003Placements['fan-on-chair'], fanDisplaySize: { width: 230, height: 270 }, fanBaseCableAnchor: stage003Placements['fan-base-cable'],
      outletPosition: { x: 665, y: 465 }, outletDisplaySize: { width: 80, height: 96 },
      cakeDisplaySize: { width: 150, height: 100 }, cakeOrigin: { x: 0.5, y: 0.5 },
      candleAnchor: { x: 0.5, y: -0.11 }, candleDisplaySize: { width: 30, height: 65 }, ignitionPadding: { x: 15, y: 12 },
    },
  },
} as const satisfies StageDefinition;
