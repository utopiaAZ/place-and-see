import type { StageDefinition } from '../../content/schema/StageDefinition';
import type { ObjectState } from '../../core/types/WorldTypes';
import type { Position } from '../../core/types/identifiers';

export const ROOM_DEPTH = {
  background: 0,
  zoneOverlay: 1,
  furnitureShadow: 9,
  furniture: 10,
  shelfProps: 20,
  floorProps: 30,
  deskSurfaceProps: 30,
  supportMat: 40,
  spill: 45,
  bottle: 50,
  cat: 60,
  dragOverlay: 100,
} as const;

export const PROP_RENDER_GEOMETRY = {
  bottle: { visualBottomFromOrigin: 47 },
  mat: { visualTopFromOrigin: -26 },
} as const;

export interface ObjectRenderPose {
  readonly position: Position;
  readonly depth: number;
  readonly supportedByMat: boolean;
}

export function getObjectRenderPose(
  object: ObjectState,
  scene: StageDefinition['scene'],
): ObjectRenderPose {
  const supportedByMat = object.id === 'bottle'
    && object.isSupportedByMat
    && !object.isBeingDragged;

  return {
    position: supportedByMat
      ? scene.placements['desk-bottle-on-mat'] ?? object.position
      : object.position,
    depth: getObjectRenderDepth(object),
    supportedByMat,
  };
}

export function getObjectRenderDepth(object: ObjectState): number {
  if (object.isBeingDragged) {
    return ROOM_DEPTH.dragOverlay;
  }

  if (object.id === 'bottle') {
    return object.zoneId === 'desk-surface'
      ? ROOM_DEPTH.bottle
      : depthForZone(object.zoneId);
  }

  if (object.id === 'non-slip-mat' && object.zoneId === 'desk-surface') {
    return ROOM_DEPTH.supportMat;
  }

  return depthForZone(object.zoneId);
}

export function getBottleVisualBottomY(position: Position): number {
  return position.y + PROP_RENDER_GEOMETRY.bottle.visualBottomFromOrigin;
}

export function getMatVisualTopY(position: Position): number {
  return position.y + PROP_RENDER_GEOMETRY.mat.visualTopFromOrigin;
}

function depthForZone(zoneId: string): number {
  if (zoneId === 'shelf') {
    return ROOM_DEPTH.shelfProps;
  }
  if (zoneId === 'desk-surface') {
    return ROOM_DEPTH.deskSurfaceProps;
  }
  return ROOM_DEPTH.floorProps;
}
