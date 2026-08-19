import Phaser from 'phaser';

export abstract class InteractiveObjectView extends Phaser.GameObjects.Container {
  protected constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y);
    scene.add.existing(this);
  }

  public enableDrag(hitArea: Phaser.Types.Input.InputConfiguration): void {
    this.setInteractive(hitArea);
    this.scene.input.setDraggable(this);
  }
}
