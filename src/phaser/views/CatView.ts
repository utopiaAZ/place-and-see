import Phaser from 'phaser';
import type { ActorState } from '../../core/types/WorldTypes';
import type { CatBehaviorState } from '../../core/types/identifiers';
import { ROOM_DEPTH } from '../layout/roomLayout';
import {
  getCatBodyTransform,
  type CatRigDefinition,
  type CatRigLayer,
} from './CatRig';

interface PivotPart {
  readonly pivot: Phaser.GameObjects.Container;
  readonly image: Phaser.GameObjects.Image;
}

export class CatView extends Phaser.GameObjects.Container {
  private readonly rig: CatRigDefinition;
  private readonly backLeg: PivotPart;
  private readonly tail: PivotPart;
  private readonly bodyImage: Phaser.GameObjects.Image;
  private readonly bodyTextureScale: { readonly x: number; readonly y: number };
  private readonly frontLeg: PivotPart;
  private readonly headPivot: Phaser.GameObjects.Container;
  private readonly head: Phaser.GameObjects.Image;
  private readonly face: Phaser.GameObjects.Image;
  private lastBehavior: CatBehaviorState | undefined;

  public constructor(scene: Phaser.Scene, state: ActorState) {
    super(scene, state.position.x, state.position.y);
    this.rig = scene.cache.json.get('actor.cat.rig') as CatRigDefinition;
    scene.add.existing(this);
    this.setDepth(ROOM_DEPTH.cat);

    this.backLeg = this.createPivotPart('back-leg', 'actor.cat.back-leg');
    this.tail = this.createPivotPart('tail', 'actor.cat.tail');
    this.bodyImage = this.createImage('actor.cat.body').setDepth(2);
    this.bodyTextureScale = { x: this.bodyImage.scaleX, y: this.bodyImage.scaleY };
    this.frontLeg = this.createPivotPart('front-leg', 'actor.cat.front-leg');

    const headLayer = this.layer('head');
    const headOffset = this.pivotOffset(headLayer);
    this.headPivot = scene.add.container(headOffset.x, headOffset.y).setDepth(4);
    this.head = this.createImage('actor.cat.head').setPosition(-headOffset.x, -headOffset.y);
    this.face = this.createImage('actor.cat.face-idle').setPosition(-headOffset.x, -headOffset.y).setDepth(1);
    this.headPivot.add([this.head, this.face]);
    this.add([this.backLeg.pivot, this.tail.pivot, this.bodyImage, this.frontLeg.pivot, this.headPivot]);
    this.applyState(state, true);
  }

  public applyState(state: ActorState, immediate = false): void {
    if (!immediate && this.lastBehavior === state.behavior) return;
    this.lastBehavior = state.behavior;
    this.stopPartTweens();
    this.resetPose();

    switch (state.behavior) {
      case 'idle':
        this.setFace('idle');
        this.startIdleTail();
        break;
      case 'noticing-bottle':
        this.setFace('curious');
        this.scene.tweens.add({ targets: this.headPivot, angle: -12, duration: 180, ease: 'Back.easeOut' });
        this.scene.tweens.add({ targets: this.tail.pivot, angle: 18, duration: 110, yoyo: true, repeat: 2 });
        break;
      case 'preparing-jump':
        this.setFace('curious');
        this.scene.tweens.add({ targets: this.bodyImage, ...this.bodyTweenTarget('prepare-jump'), duration: 220, ease: 'Quad.easeOut' });
        this.scene.tweens.add({ targets: this.backLeg.pivot, angle: -18, duration: 220 });
        break;
      case 'jumping':
        this.setFace('curious');
        this.scene.tweens.chain({
          targets: this,
          tweens: [
            { x: (this.x + state.position.x) / 2, y: Math.min(this.y, state.position.y) - 85, duration: 250, ease: 'Quad.easeOut' },
            { x: state.position.x, y: state.position.y, duration: 250, ease: 'Quad.easeIn' },
          ],
        });
        this.scene.tweens.add({ targets: this.bodyImage, ...this.bodyTweenTarget('jump-stretch'), duration: 180, yoyo: true });
        break;
      case 'tapping-bottle':
        this.setFace('curious');
        this.setPosition(state.position.x, state.position.y);
        this.scene.tweens.add({ targets: this.frontLeg.pivot, angle: -34, duration: 75, yoyo: true, repeat: 1, ease: 'Quad.easeInOut' });
        break;
      case 'distracted-by-food':
        this.setFace('happy');
        this.moveThen(state.position, 430, () => {
          this.scene.tweens.add({ targets: this.headPivot, y: this.headPivot.y + 8, duration: 180, yoyo: true, repeat: -1 });
        });
        break;
      case 'playing-with-toy':
        this.setFace('happy');
        this.moveThen(state.position, 430, () => {
          this.scene.tweens.add({ targets: this, x: this.x + 24, duration: 260, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
          this.scene.tweens.add({ targets: this.frontLeg.pivot, angle: -22, duration: 130, yoyo: true, repeat: -1 });
        });
        break;
      case 'returning':
        this.setFace('idle');
        this.scene.tweens.add({ targets: this, x: state.position.x, y: state.position.y, duration: 560, ease: 'Sine.easeInOut' });
        this.startIdleTail();
        break;
      case 'satisfied':
        this.setFace('happy');
        this.scene.tweens.add({ targets: this, scaleX: 1.08, scaleY: 0.92, duration: 130, yoyo: true, repeat: 1 });
        this.startIdleTail();
        break;
    }

    if (immediate) this.setPosition(state.position.x, state.position.y);
  }

  public resetTo(state: ActorState): void {
    this.stopPartTweens();
    this.setPosition(state.position.x, state.position.y).setScale(1);
    this.lastBehavior = undefined;
    this.applyState(state, true);
  }

  private createPivotPart(layerKey: string, textureKey: string): PivotPart {
    const layer = this.layer(layerKey);
    const offset = this.pivotOffset(layer);
    const pivot = this.scene.add.container(offset.x, offset.y).setDepth(layer.depth).setAngle(layer.defaultAngle);
    const image = this.createImage(textureKey).setPosition(-offset.x, -offset.y);
    pivot.add(image);
    return { pivot, image };
  }

  private createImage(textureKey: string): Phaser.GameObjects.Image {
    return this.scene.add.image(0, 0, textureKey).setDisplaySize(this.rig.displaySize.width, this.rig.displaySize.height);
  }

  private layer(key: string): CatRigLayer {
    const layer = this.rig.layers.find((candidate) => candidate.key === key);
    if (!layer) throw new Error(`Cat rig layer missing: ${key}`);
    return layer;
  }

  private pivotOffset(layer: CatRigLayer): { x: number; y: number } {
    return {
      x: ((layer.rotationPivot.x - this.rig.canvas.width / 2) / this.rig.canvas.width) * this.rig.displaySize.width,
      y: ((layer.rotationPivot.y - this.rig.canvas.height / 2) / this.rig.canvas.height) * this.rig.displaySize.height,
    };
  }

  private setFace(face: 'idle' | 'curious' | 'happy'): void {
    this.face.setTexture(`actor.cat.face-${face}`);
  }

  private resetPose(): void {
    this.backLeg.pivot.setAngle(0);
    this.tail.pivot.setAngle(0);
    this.frontLeg.pivot.setAngle(0);
    this.headPivot.setAngle(0);
    const body = getCatBodyTransform('base');
    this.bodyImage
      .setPosition(body.x, body.y)
      .setScale(
        this.bodyTextureScale.x * body.scaleX,
        this.bodyTextureScale.y * body.scaleY,
      );
    this.setScale(1);
  }

  private bodyTweenTarget(
    phase: 'prepare-jump' | 'jump-stretch',
  ): { x: number; y: number; scaleX: number; scaleY: number } {
    const body = getCatBodyTransform(phase);
    return {
      x: body.x,
      y: body.y,
      scaleX: this.bodyTextureScale.x * body.scaleX,
      scaleY: this.bodyTextureScale.y * body.scaleY,
    };
  }

  private startIdleTail(): void {
    this.scene.tweens.add({ targets: this.tail.pivot, angle: { from: -8, to: 9 }, duration: 850, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
  }

  private moveThen(position: { readonly x: number; readonly y: number }, duration: number, onComplete: () => void): void {
    this.scene.tweens.add({ targets: this, x: position.x, y: position.y, duration, ease: 'Sine.easeInOut', onComplete });
  }

  private stopPartTweens(): void {
    this.scene.tweens.killTweensOf([this, this.backLeg.pivot, this.tail.pivot, this.bodyImage, this.frontLeg.pivot, this.headPivot]);
  }
}
