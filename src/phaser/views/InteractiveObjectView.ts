import Phaser from 'phaser';
import type { ObjectId } from '../../core/types/identifiers';

export abstract class InteractiveObjectView extends Phaser.GameObjects.Container {
  public readonly objectId: ObjectId;
  private locked = false;

  protected constructor(scene: Phaser.Scene, objectId: ObjectId, x: number, y: number, hitWidth: number, hitHeight: number) {
    super(scene, x, y);
    this.objectId = objectId;
    scene.add.existing(this);
    this.setSize(hitWidth, hitHeight);
    this.setInteractive({ useHandCursor: true });
    scene.input.setDraggable(this);
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OVER, () => {
      if (!this.locked) scene.tweens.add({ targets: this, scaleX: 1.04, scaleY: 1.04, duration: 90 });
    });
    this.on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
      if (!this.locked) scene.tweens.add({ targets: this, scaleX: 1, scaleY: 1, duration: 90 });
    });
  }

  public setLocked(locked: boolean): void {
    this.locked = locked;
    if (this.input) this.input.enabled = !locked;
    this.setAlpha(locked ? 0.78 : 1);
  }

  public isLocked(): boolean { return this.locked; }
  public animateDrop(): void {
    this.scene.tweens.add({ targets: this, y: this.y - 12, scaleX: 1.07, scaleY: 1.07, duration: 100, yoyo: true });
  }
  public resetVisualState(): void {
    this.scene.tweens.killTweensOf(this);
    this.setScale(1).setAngle(0).setAlpha(1);
  }
}
