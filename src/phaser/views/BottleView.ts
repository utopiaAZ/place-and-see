import Phaser from 'phaser';
import { InteractiveObjectView } from './InteractiveObjectView';

export class BottleView extends InteractiveObjectView {
  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    // Architecture-only placeholder. Replace this View's drawing with loaded SVGs later.
    const body = scene.add.graphics();
    body.fillStyle(0x6ebbd1, 1).fillRoundedRect(-18, -44, 36, 76, 12);
    body.fillStyle(0xd9f5fb, 0.9).fillRoundedRect(-11, -37, 22, 38, 7);
    body.fillStyle(0x315a68, 1).fillRoundedRect(-10, -52, 20, 10, 3);
    this.add(body);
    this.setSize(48, 96);
    this.enableDrag({ useHandCursor: true });
  }
}
