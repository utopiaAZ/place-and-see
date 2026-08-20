import Phaser from 'phaser';
import { STAGE_001_RIG, STAGE_001_SVG_ASSETS } from '../assets/stage001AssetManifest';
import { STAGE_002_SVG_ASSETS } from '../assets/stage002AssetManifest';
import { STAGE_003_SVG_ASSETS } from '../assets/stage003AssetManifest';

export class PreloadScene extends Phaser.Scene {
  public constructor() { super('PreloadScene'); }

  public preload(): void {
    if (import.meta.env.DEV) {
      this.load.on(Phaser.Loader.Events.FILE_LOAD_ERROR, (file: Phaser.Loader.File) => {
        console.error(`[Place & See] Failed to load asset: ${file.key} (${file.url})`);
      });
    }
    for (const asset of STAGE_001_SVG_ASSETS) this.load.svg(asset.key, asset.url, asset.loadSize);
    for (const asset of STAGE_002_SVG_ASSETS) this.load.svg(asset.key, asset.url, asset.loadSize);
    for (const asset of STAGE_003_SVG_ASSETS) this.load.svg(asset.key, asset.url, asset.loadSize);
    this.load.json(STAGE_001_RIG.key, STAGE_001_RIG.url);
  }

  public create(): void {
    const bridge = this.registry.get('gameBridge') as import('../../bridge/GameBridge').GameBridge;
    this.scene.start(bridge.getStage().id === 'stage-003' ? 'StageThreeScene' : bridge.getStage().id === 'stage-002' ? 'StageTwoScene' : 'RoomScene');
  }
}
