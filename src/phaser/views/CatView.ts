import Phaser from 'phaser';

export class CatView extends Phaser.GameObjects.Container {
  public constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    // Architecture-only placeholder composed from primitive geometry.
    const drawing = scene.add.graphics();
    drawing.fillStyle(0xe19a55, 1).fillEllipse(0, 7, 78, 50);
    drawing.fillCircle(-22, -23, 26);
    drawing.fillTriangle(-43, -43, -27, -64, -20, -39);
    drawing.fillTriangle(-20, -41, -5, -62, 1, -33);
    drawing.lineStyle(8, 0xe19a55, 1).beginPath().moveTo(35, 4).lineTo(61, -23).strokePath();
    drawing.fillStyle(0x2d3136, 1).fillCircle(-31, -26, 3).fillCircle(-14, -26, 3);
    this.add(drawing);
    scene.add.existing(this);
  }

  public showInterest(): void {
    this.scene.tweens.add({ targets: this, y: this.y - 12, duration: 140, yoyo: true, repeat: 1 });
  }
}
