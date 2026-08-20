export interface CatRigLayer {
  readonly key: string;
  readonly file: string;
  readonly depth: number;
  readonly x: number;
  readonly y: number;
  readonly originX: number;
  readonly originY: number;
  readonly rotationPivot: { readonly x: number; readonly y: number };
  readonly defaultAngle: number;
  readonly recommendedAngleRange: { readonly min: number; readonly max: number };
  readonly defaultVisible?: boolean;
}

export interface CatRigDefinition {
  readonly canvas: { readonly width: number; readonly height: number; readonly baselineY: number; readonly centerX: number };
  readonly defaultFacing: 'right';
  readonly displaySize: { readonly width: number; readonly height: number };
  readonly layers: readonly CatRigLayer[];
}

export interface CatBodyTransform {
  readonly x: number;
  readonly y: number;
  readonly scaleX: number;
  readonly scaleY: number;
}

// The source SVG keeps the shared 320x320 rig canvas. This runtime transform
// corrects only the body silhouette without changing the head or baseline.
export const CAT_BODY_BASE_TRANSFORM: CatBodyTransform = {
  x: -3,
  y: 5,
  scaleX: 0.82,
  scaleY: 0.86,
};

export function getCatBodyTransform(
  phase: 'base' | 'prepare-jump' | 'jump-stretch',
): CatBodyTransform {
  if (phase === 'prepare-jump') {
    return {
      ...CAT_BODY_BASE_TRANSFORM,
      y: CAT_BODY_BASE_TRANSFORM.y + 11,
      scaleX: CAT_BODY_BASE_TRANSFORM.scaleX * 1.12,
      scaleY: CAT_BODY_BASE_TRANSFORM.scaleY * 0.72,
    };
  }
  if (phase === 'jump-stretch') {
    return {
      ...CAT_BODY_BASE_TRANSFORM,
      scaleX: CAT_BODY_BASE_TRANSFORM.scaleX * 0.88,
      scaleY: CAT_BODY_BASE_TRANSFORM.scaleY * 1.18,
    };
  }
  return CAT_BODY_BASE_TRANSFORM;
}
