import { STAGE_TWO_RULE_ID } from '../../core/rules/StageTwoRuleSystem';
import type { StageDefinition } from '../schema/StageDefinition';

export const stage002Placements = {
  'document-initial': { x: 205, y: 430 },
  'bottle-initial': { x: 135, y: 545 },
  'divider-initial': { x: 205, y: 630 },
  'chair-seat': { x: 790, y: 551 },
  'fan-on-chair': { x: 790, y: 446 },
  'fan-base-cable': { x: 702, y: 526 },
  'plugged-anchor': { x: 634, y: 460 },
  'unplugged-anchor': { x: 710, y: 655 },
  'document-desk': { x: 1200, y: 402 },
  'paper-weight': { x: 1200, y: 355 },
  'airflow-blocker': { x: 1010, y: 392 },
  'desk-prop': { x: 1350, y: 380 },
  'paper-blown': { x: 670, y: 742 },
} as const;

const objectDefaults = {
  orientation: null,
  isSupportedByMat: false,
  effectRemainingMs: 0,
  draggable: true,
  inputLocked: false,
  isBeingDragged: false,
} as const;

export const stage002 = {
  id: 'stage-002',
  mission: {
    title: '책상 위에 서류를 안전하게 두세요.',
    description: '서류가 일정 시간 안전하게 유지되면 완료됩니다.',
  },
  actors: [],
  objects: [
    { ...objectDefaults, id: 'document', kind: 'document', position: stage002Placements['document-initial'], zoneId: 'shelf', graphicKey: 'stage002.document' },
    { ...objectDefaults, id: 'bottle', kind: 'bottle', position: stage002Placements['bottle-initial'], zoneId: 'shelf', orientation: 'upright', graphicKey: 'prop.bottle' },
    { ...objectDefaults, id: 'file-divider', kind: 'file-divider', position: stage002Placements['divider-initial'], zoneId: 'shelf', graphicKey: 'stage002.file-divider' },
    { ...objectDefaults, id: 'power-plug', kind: 'power-plug', position: stage002Placements['plugged-anchor'], zoneId: 'plug-socket', graphicKey: 'stage002.power-plug' },
  ],
  zones: [
    { id: 'floor', type: 'walkable-surface', bounds: { x: 40, y: 590, width: 1520, height: 280 }, accepts: ['document', 'bottle', 'file-divider', 'power-plug'] },
    { id: 'shelf', type: 'object-surface', bounds: { x: 70, y: 230, width: 300, height: 430 }, accepts: ['document', 'bottle', 'file-divider'] },
    { id: 'document-desk', type: 'object-surface', bounds: { x: 1090, y: 320, width: 270, height: 150 }, accepts: ['document'], snapPositions: { document: stage002Placements['document-desk'] } },
    { id: 'paper-weight', type: 'object-surface', bounds: { x: 1135, y: 300, width: 130, height: 150 }, accepts: ['bottle'], snapPositions: { bottle: stage002Placements['paper-weight'] } },
    { id: 'airflow-blocker', type: 'object-surface', bounds: { x: 945, y: 285, width: 150, height: 200 }, accepts: ['file-divider'], snapPositions: { 'file-divider': stage002Placements['airflow-blocker'] } },
    { id: 'desk-props', type: 'object-surface', bounds: { x: 1280, y: 300, width: 180, height: 170 }, accepts: ['bottle', 'file-divider'], snapPositions: { bottle: stage002Placements['desk-prop'], 'file-divider': stage002Placements['desk-prop'] } },
    { id: 'plug-socket', type: 'object-surface', bounds: { x: 590, y: 410, width: 100, height: 120 }, accepts: ['power-plug'], snapPositions: { 'power-plug': stage002Placements['plugged-anchor'] } },
    { id: 'plug-unplugged', type: 'walkable-surface', bounds: { x: 650, y: 560, width: 250, height: 150 }, accepts: ['power-plug'], snapPositions: { 'power-plug': stage002Placements['unplugged-anchor'] } },
  ],
  activeRuleIds: [STAGE_TWO_RULE_ID],
  timings: { catDetectMs: 0, catNoticeMs: 0, catPrepareMs: 0, catJumpMs: 0, catTapMs: 0, bottleWobbleMs: 0, catReturnMs: 0, toyDistractionMs: 0 },
  stageTwo: {
    fanPhaseDurationMs: 1000,
    fanSlowdownMs: 600,
    paperFlutterMs: 700,
    paperBlowAwayMs: 800,
    documentObjectId: 'document',
    bottleObjectId: 'bottle',
    blockerObjectId: 'file-divider',
    plugObjectId: 'power-plug',
    documentZoneId: 'document-desk',
    weightZoneId: 'paper-weight',
    blockerZoneId: 'airflow-blocker',
    unpluggedZoneId: 'plug-unplugged',
    blownAwayPosition: stage002Placements['paper-blown'],
  },
  goal: { type: 'stable-object-state', objectId: 'document', zoneId: 'document-desk', orientation: 'upright', durationMs: 3000 },
  graphicKeys: ['furniture.desk', 'furniture.chair', 'furniture.shelf', 'prop.bottle', 'stage002.document', 'stage002.file-divider', 'stage002.fan-body', 'stage002.fan-head', 'stage002.fan-blades', 'stage002.power-outlet', 'stage002.power-plug'],
  soundEvents: ['OBJECT_PICKED_UP', 'OBJECT_PLACED', 'OBJECT_DROP_REJECTED', 'GOAL_STABILITY_STARTED', 'GOAL_STABILITY_RESET', 'GOAL_COMPLETED', 'UI_RESET', 'FAN_STARTED', 'FAN_SLOWING_DOWN', 'FAN_STOPPED', 'PAPER_FLUTTER_STARTED', 'PAPER_FLUTTER_STOPPED', 'PAPER_BLOWN_AWAY'],
  scene: {
    floorTopY: 690,
    placements: stage002Placements,
    furniture: [
      { key: 'furniture.shelf', position: { x: 200, y: 530 }, displaySize: { width: 240, height: 320 }, depth: 2 },
      { key: 'furniture.chair', position: { x: 790, y: 565 }, displaySize: { width: 200, height: 250 }, depth: 2 },
      { key: 'furniture.desk', position: { x: 1200, y: 545 }, displaySize: { width: 500, height: 300 }, depth: 3 },
    ],
    objectVisuals: {
      document: { displaySize: { width: 130, height: 88 }, hitSize: { width: 126, height: 84 }, depth: 34 },
      bottle: { displaySize: { width: 70, height: 110 }, hitSize: { width: 58, height: 104 }, depth: 50 },
      'file-divider': { displaySize: { width: 120, height: 112 }, hitSize: { width: 112, height: 108 }, depth: 42 },
      'power-plug': { displaySize: { width: 76, height: 62 }, hitSize: { width: 72, height: 58 }, depth: 45 },
    },
    stageTwo: {
      chairSeatAnchor: stage002Placements['chair-seat'],
      fanPosition: stage002Placements['fan-on-chair'],
      fanDisplaySize: { width: 230, height: 270 },
      fanBaseCableAnchor: stage002Placements['fan-base-cable'],
      outletPosition: { x: 665, y: 465 },
      outletDisplaySize: { width: 80, height: 96 },
    },
  },
} as const satisfies StageDefinition;
