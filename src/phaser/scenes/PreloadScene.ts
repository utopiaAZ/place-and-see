import Phaser from 'phaser';
import { STAGE_001_RIG, STAGE_001_SVG_ASSETS } from '../assets/stage001AssetManifest';

export class PreloadScene extends Phaser.Scene {
  public constructor() { super('PreloadScene'); }

  public preload(): void {
    if (import.meta.env.DEV) {
      this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
        console.error(`[Place & See] Failed to load asset: ${file.key} (${file.url})`);
      });
    }
    for (const asset of STAGE_001_SVG_ASSETS) this.load.svg(asset.key, asset.url, asset.loadSize);
    this.load.json(STAGE_001_RIG.key, STAGE_001_RIG.url);
  }

  public create(): void { this.scene.start('RoomScene'); }
}
