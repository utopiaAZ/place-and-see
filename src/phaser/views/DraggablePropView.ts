import Phaser from 'phaser';
import type { ObjectId } from '../../core/types/identifiers';
import { getSvgAsset } from '../assets/stageAssetRegistry';
import { InteractiveObjectView } from './InteractiveObjectView';

export class DraggablePropView extends InteractiveObjectView {
  public constructor(scene: Phaser.Scene, objectId: ObjectId, assetKey: string, x: number, y: number) {
    const asset = getSvgAsset(assetKey);
    const hit = asset.hitSize ?? asset.displaySize;
    super(scene, objectId, x, y, hit.width, hit.height);
    const shadow = scene.add.ellipse(0, asset.displaySize.height * 0.42, hit.width * 0.72, 13, 0x17213a, 0.12);
    const image = scene.add.image(0, 0, assetKey).setDisplaySize(asset.displaySize.width, asset.displaySize.height);
    this.add([shadow, image]);
  }
}
