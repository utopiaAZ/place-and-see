import type { ObjectState } from '../../core/types/WorldTypes';
import type { Position } from '../../core/types/identifiers';
import { ROOM_DEPTH } from './roomLayout';

export const STAGE_TWO_RENDER_GEOMETRY = {
  bottleBottomFromOrigin: 47,
  paperSurfaceFromOrigin: 0,
  paperDepth: 40,
  blockerDepth: 45,
  bottleWeightDepth: 50,
  fanBaseBottomRatio: 320 / 360 - 0.5,
  plugCableXRatio: -100 / 240,
  plugCableYRatio: 8 / 200,
} as const;

export const STAGE_TWO_DEPTH = {
  powerCord: 24,
  fan: 32,
  outlet: 36,
  plug: 45,
} as const;

export interface PowerCordCurve {
  readonly start: Position;
  readonly control: Position;
  readonly end: Position;
}

export function getStageTwoObjectDepth(object: ObjectState, configuredDepth = 30): number {
  if (object.isBeingDragged) return ROOM_DEPTH.dragOverlay;
  if (object.id === 'bottle' && object.zoneId === 'paper-weight') return STAGE_TWO_RENDER_GEOMETRY.bottleWeightDepth;
  if (object.id === 'document' && object.zoneId === 'document-desk') return STAGE_TWO_RENDER_GEOMETRY.paperDepth;
  if (object.id === 'file-divider' && object.zoneId === 'airflow-blocker') return STAGE_TWO_RENDER_GEOMETRY.blockerDepth;
  return configuredDepth;
}

export function getBottleWeightContactY(position: Position): number {
  return position.y + STAGE_TWO_RENDER_GEOMETRY.bottleBottomFromOrigin;
}

export function getPaperSurfaceY(position: Position): number {
  return position.y + STAGE_TWO_RENDER_GEOMETRY.paperSurfaceFromOrigin;
}

export function getFanBaseBottomY(position: Position, displayHeight: number): number {
  return position.y + displayHeight * STAGE_TWO_RENDER_GEOMETRY.fanBaseBottomRatio;
}

export function getPlugCableAnchor(position: Position, displaySize: { readonly width: number; readonly height: number }): Position {
  return {
    x: position.x + displaySize.width * STAGE_TWO_RENDER_GEOMETRY.plugCableXRatio,
    y: position.y + displaySize.height * STAGE_TWO_RENDER_GEOMETRY.plugCableYRatio,
  };
}

export function getPowerCordCurve(start: Position, end: Position): PowerCordCurve {
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  return {
    start,
    control: {
      x: (start.x + end.x) / 2,
      y: Math.max(start.y, end.y) + Math.max(54, distance * 0.28),
    },
    end,
  };
}

export function sampleQuadraticCurve(curve: PowerCordCurve, segments = 18): readonly Position[] {
  return Array.from({ length: segments + 1 }, (_, index) => {
    const t = index / segments;
    const inverse = 1 - t;
    return {
      x: inverse * inverse * curve.start.x + 2 * inverse * t * curve.control.x + t * t * curve.end.x,
      y: inverse * inverse * curve.start.y + 2 * inverse * t * curve.control.y + t * t * curve.end.y,
    };
  });
}
