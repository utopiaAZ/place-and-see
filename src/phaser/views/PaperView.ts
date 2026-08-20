import Phaser from 'phaser';
import type { Position } from '../../core/types/identifiers';
import { getSvgAsset } from '../assets/stageAssetRegistry';
import { InteractiveObjectView } from './InteractiveObjectView';

export class PaperView extends InteractiveObjectView {
  private readonly visual: Phaser.GameObjects.Container;

  public constructor(scene: Phaser.Scene, x: number, y: number) {
    const asset = getSvgAsset('stage002.document');
    const hit = asset.hitSize ?? asset.displaySize;
    super(scene, 'document', x, y, hit.width, hit.height);
    this.visual = scene.add.container(-asset.displaySize.width * 0.38, asset.displaySize.height * 0.34);
    const image = scene.add.image(asset.displaySize.width * 0.38, -asset.displaySize.height * 0.34, asset.key)
      .setDisplaySize(asset.displaySize.width, asset.displaySize.height);
    this.visual.add(image);
    this.add(this.visual);
  }

  public startFlutter(): void {
    this.stopMotion();
    this.scene.tweens.add({
      targets: this.visual,
      angle: { from: -3, to: 7 },
      x: { from: this.visual.x - 3, to: this.visual.x + 8 },
      y: { from: this.visual.y, to: this.visual.y - 8 },
      duration: 120,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  public stopFlutter(): void {
    this.stopMotion();
    this.scene.tweens.add({ targets: this.visual, angle: 0, x: -49.4, y: 29.9, duration: 120, ease: 'Sine.easeOut' });
  }

  public blowAway(target: Position, durationMs: number): void {
    this.stopMotion();
    this.scene.tweens.add({
      targets: this,
      x: target.x,
      y: target.y,
      angle: 28,
      duration: durationMs,
      ease: 'Cubic.easeInOut',
      onComplete: () => this.setAngle(12),
    });
  }

  public override resetVisualState(): void {
    super.resetVisualState();
    this.stopMotion();
    this.visual.setPosition(-49.4, 29.9).setAngle(0);
  }

  private stopMotion(): void { this.scene.tweens.killTweensOf([this, this.visual]); }
}
