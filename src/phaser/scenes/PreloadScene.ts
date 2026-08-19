import Phaser from 'phaser';

export class PreloadScene extends Phaser.Scene {
  public constructor() {
    super('PreloadScene');
  }

  public create(): void {
    // No runtime assets are loaded in the scaffold. Future manifests are loaded here.
    this.scene.start('RoomScene');
  }
}
