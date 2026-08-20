import type { PuzzleStageDefinition } from '../../core/types/PuzzleStageDefinition';
import type { SoundEvent } from '../../audio/SoundEventMap';

export interface StageDefinition extends PuzzleStageDefinition {
  readonly mission: { readonly title: string; readonly description: string };
  readonly graphicKeys: readonly string[];
  readonly soundEvents: readonly SoundEvent[];
  readonly scene: {
    readonly placements: Readonly<Record<string, { readonly x: number; readonly y: number }>>;
    readonly furniture: readonly {
      readonly key: string;
      readonly position: { readonly x: number; readonly y: number };
      readonly displaySize: { readonly width: number; readonly height: number };
      readonly depth: number;
    }[];
    readonly floorTopY: number;
    readonly objectVisuals?: Readonly<Record<string, {
      readonly displaySize: { readonly width: number; readonly height: number };
      readonly hitSize: { readonly width: number; readonly height: number };
      readonly depth: number;
    }>>;
    readonly stageTwo?: {
      readonly chairSeatAnchor: { readonly x: number; readonly y: number };
      readonly fanPosition: { readonly x: number; readonly y: number };
      readonly fanDisplaySize: { readonly width: number; readonly height: number };
      readonly fanBaseCableAnchor: { readonly x: number; readonly y: number };
      readonly outletPosition: { readonly x: number; readonly y: number };
      readonly outletDisplaySize: { readonly width: number; readonly height: number };
    };
    readonly stageThree?: {
      readonly fanPosition: { readonly x: number; readonly y: number };
      readonly fanDisplaySize: { readonly width: number; readonly height: number };
      readonly fanBaseCableAnchor: { readonly x: number; readonly y: number };
      readonly outletPosition: { readonly x: number; readonly y: number };
      readonly outletDisplaySize: { readonly width: number; readonly height: number };
      readonly cakeDisplaySize: { readonly width: number; readonly height: number };
      readonly cakeOrigin: { readonly x: number; readonly y: number };
      /** Normalized against the cake image; values may sit outside 0..1. */
      readonly candleAnchor: { readonly x: number; readonly y: number };
      readonly candleDisplaySize: { readonly width: number; readonly height: number };
      readonly ignitionPadding: { readonly x: number; readonly y: number };
    };
  };
}
