import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { ObjectId, ObjectKind, Position, RectangleBounds, ZoneId } from '../../core/types/identifiers';

const PRIORITY: Readonly<Record<string, number>> = {
  floor: 0, shelf: 1, 'desk-props': 2, 'cake-desk': 5,
  'cat-food-zone': 6, 'toy-distraction-zone': 6, 'airflow-blocker': 6,
  'plug-socket': 7, 'plug-unplugged': 7,
};

export type StageThreeDropResult =
  | { readonly type: 'ignite-candle'; readonly zoneId: 'candle-ignition' }
  | { readonly type: 'place-object'; readonly zoneId: ZoneId; readonly position: Position }
  | { readonly type: 'reject' };

export interface StageThreeDropInput {
  readonly stage: StageDefinition;
  readonly objectId: ObjectId;
  readonly kind: ObjectKind;
  readonly objectBounds: RectangleBounds;
  readonly candleIgnitionBounds: RectangleBounds;
}

export function boundsFromCenter(position: Position, size: { readonly width: number; readonly height: number }): RectangleBounds {
  return { x: position.x - size.width / 2, y: position.y - size.height / 2, width: size.width, height: size.height };
}

export function boundsIntersect(a: RectangleBounds, b: RectangleBounds): boolean {
  return a.x <= b.x + b.width && a.x + a.width >= b.x && a.y <= b.y + b.height && a.y + a.height >= b.y;
}

export function resolveStageThreeDrop(input: StageThreeDropInput): StageThreeDropResult {
  const { stage, objectId, kind, objectBounds, candleIgnitionBounds } = input;
  if (objectId === stage.stageThree?.lighterObjectId && boundsIntersect(objectBounds, candleIgnitionBounds)) {
    return { type: 'ignite-candle', zoneId: 'candle-ignition' };
  }

  const center = { x: objectBounds.x + objectBounds.width / 2, y: objectBounds.y + objectBounds.height / 2 };
  const zone = stage.zones
    .filter((candidate) => candidate.id !== stage.stageThree?.ignitionZoneId && candidate.accepts.includes(kind) && contains(candidate.bounds, center))
    .sort((a, b) => (PRIORITY[b.id] ?? 3) - (PRIORITY[a.id] ?? 3))[0];
  if (!zone) return { type: 'reject' };
  return { type: 'place-object', zoneId: zone.id, position: zone.snapPositions?.[kind] ?? center };
}

function contains(bounds: RectangleBounds, point: Position): boolean {
  return point.x >= bounds.x && point.x <= bounds.x + bounds.width && point.y >= bounds.y && point.y <= bounds.y + bounds.height;
}

export function stageThreeZoneIds(stage: StageDefinition): readonly ZoneId[] { return stage.zones.map((zone) => zone.id); }
