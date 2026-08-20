import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { ObjectId, ObjectKind, Position } from '../../core/types/identifiers';

export function resolveStageTwoDropZone(
  stage: StageDefinition,
  objectId: ObjectId,
  kind: ObjectKind,
  position: Position,
) {
  const candidates = stage.zones.filter((zone) =>
    zone.accepts.includes(kind) && contains(zone.bounds, position),
  );

  if (objectId === stage.stageTwo?.plugObjectId) {
    const socket = candidates.find((zone) => zone.id === 'plug-socket');
    if (socket) return socket;
    return stage.zones.find((zone) => zone.id === stage.stageTwo?.unpluggedZoneId);
  }

  return candidates.sort((a, b) =>
    a.bounds.width * a.bounds.height - b.bounds.width * b.bounds.height,
  )[0];
}

function contains(
  bounds: { readonly x: number; readonly y: number; readonly width: number; readonly height: number },
  position: Position,
): boolean {
  return position.x >= bounds.x && position.x <= bounds.x + bounds.width
    && position.y >= bounds.y && position.y <= bounds.y + bounds.height;
}
