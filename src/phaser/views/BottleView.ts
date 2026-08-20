import Phaser from 'phaser';
import type { Position } from '../../core/types/identifiers';
import { getSvgAsset } from '../assets/stage001AssetManifest';
import { InteractiveObjectView } from './InteractiveObjectView';

export const BOTTLE_ANIMATION = {
  pivotY: 47,
  placeDurationMs: 150,
  wobbleAngles: [-5, 4, -2.5, 1.2, 0],
  supportedWobbleAngles: [-4, 3, -1.5, 0],
  fallLeadAngle: -4,
  fallAngle: 88,
  fallDurationMs: 340,
  fallOffset: { x: 5, y: 4 },
} as const;

export class BottleView extends InteractiveObjectView {
  private readonly visualPivot: Phaser.GameObjects.Container;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    const asset = getSvgAsset('prop.bottle');
    const hit = asset.hitSize ?? asset.displaySize;
    super(scene, 'bottle', x, y, hit.width, hit.height);
    const shadow = scene.add.ellipse(0, BOTTLE_ANIMATION.pivotY, hit.width * 0.72, 13, 0x17213a, 0.12);
    this.visualPivot = scene.add.container(0, BOTTLE_ANIMATION.pivotY);
    const image = scene.add.image(0, -BOTTLE_ANIMATION.pivotY, asset.key)
      .setDisplaySize(asset.displaySize.width, asset.displaySize.height);
    this.visualPivot.add(image);
    this.add([shadow, this.visualPivot]);
  }

  public animatePlaced(target: Position): void {
    this.stopBottleTweens();
    this.resetPivot();
    this.setAngle(0).setScale(1);
    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      duration: BOTTLE_ANIMATION.placeDurationMs,
      ease: 'Sine.easeOut',
    });
  }

  public animateWobble(stabilizedByMat: boolean): void {
    this.scene.tweens.killTweensOf(this.visualPivot);
    this.resetPivot();
    const angles = stabilizedByMat
      ? BOTTLE_ANIMATION.supportedWobbleAngles
      : BOTTLE_ANIMATION.wobbleAngles;
    this.scene.tweens.chain({
      targets: this.visualPivot,
      tweens: angles.map((angle) => ({
        angle,
        duration: stabilizedByMat ? 75 : 70,
        ease: 'Sine.easeInOut',
      })),
    });
  }

  public animateFall(onImpact: () => void): void {
    this.scene.tweens.killTweensOf(this.visualPivot);
    this.resetPivot();
    this.scene.tweens.chain({
      targets: this.visualPivot,
      tweens: [
        { angle: BOTTLE_ANIMATION.fallLeadAngle, duration: 70, ease: 'Sine.easeOut' },
        {
          angle: BOTTLE_ANIMATION.fallAngle,
          x: BOTTLE_ANIMATION.fallOffset.x,
          y: BOTTLE_ANIMATION.pivotY + BOTTLE_ANIMATION.fallOffset.y,
          duration: BOTTLE_ANIMATION.fallDurationMs,
          ease: 'Quad.easeIn',
          onComplete: onImpact,
        },
        { y: BOTTLE_ANIMATION.pivotY + 7, duration: 55, yoyo: true, ease: 'Sine.easeOut' },
      ],
    });
  }

  public override resetVisualState(): void {
    super.resetVisualState();
    this.stopBottleTweens();
    this.resetPivot();
  }

  private stopBottleTweens(): void {
    this.scene.tweens.killTweensOf([this, this.visualPivot]);
  }

  private resetPivot(): void {
    this.visualPivot.setPosition(0, BOTTLE_ANIMATION.pivotY).setAngle(0).setScale(1);
  }
}
