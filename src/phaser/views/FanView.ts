import Phaser from 'phaser';
import type { StageTwoWorldState } from '../../core/types/WorldTypes';
import type { FanDirection, FanPowerState } from '../../core/types/identifiers';
import { advanceBladeAngle, FAN_MOTION, getBladeSpeed, getFanHeadPose } from '../animation/fanMotion';

export class FanView extends Phaser.GameObjects.Container {
  private readonly bodyImage: Phaser.GameObjects.Image;
  private readonly headPivot: Phaser.GameObjects.Container;
  private readonly blades: Phaser.GameObjects.Image;
  private readonly hub: Phaser.GameObjects.Arc;
  private bladeAngle = 0;
  private bladeSpeed = 0;
  private lastDirection: FanDirection | undefined;
  private lastPower: FanPowerState | undefined;

  public constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    displaySize: { readonly width: number; readonly height: number },
    private readonly slowdownDurationMs: number,
  ) {
    super(scene, x, y);
    scene.add.existing(this);
    this.bodyImage = scene.add.image(0, 0, 'stage002.fan-body').setDisplaySize(displaySize.width, displaySize.height);
    this.headPivot = scene.add.container(0, -displaySize.height * 0.233);
    const headSize = displaySize.width * 0.89;
    const bladeSize = displaySize.width * 0.76;
    this.blades = scene.add.image(0, -2, 'stage002.fan-blades').setDisplaySize(bladeSize, bladeSize);
    const cage = scene.add.image(0, 0, 'stage002.fan-head').setDisplaySize(headSize, headSize);
    this.hub = scene.add.circle(0, -3, headSize * 0.075, 0x59d8d0)
      .setStrokeStyle(Math.max(6, headSize * 0.035), 0x17213a);
    this.headPivot.add([this.blades, cage, this.hub]);
    this.add([this.bodyImage, this.headPivot]);
  }

  public applyState(state: StageTwoWorldState): void {
    this.bladeSpeed = getBladeSpeed(
      state.fanPower,
      state.fanSlowdownRemainingMs,
      this.slowdownDurationMs,
    );

    if (state.fanPower !== 'powered') {
      if (this.lastPower === 'powered') this.scene.tweens.killTweensOf(this.headPivot);
    } else if (state.fanDirection !== this.lastDirection || this.lastPower !== 'powered') {
      const pose = getFanHeadPose(state.fanDirection);
      this.scene.tweens.killTweensOf(this.headPivot);
      this.scene.tweens.add({
        targets: this.headPivot,
        x: pose.x,
        angle: pose.angle,
        scaleX: pose.scaleX,
        duration: FAN_MOTION.headTransitionMs,
        ease: 'Sine.easeInOut',
      });
    }

    if (state.fanPower === 'stopped') this.bladeSpeed = 0;
    this.lastDirection = state.fanDirection;
    this.lastPower = state.fanPower;
  }

  public updateVisual(deltaMs: number): void {
    if (this.bladeSpeed <= 0) return;
    this.bladeAngle = advanceBladeAngle(this.bladeAngle, this.bladeSpeed, deltaMs);
    this.blades.setAngle(this.bladeAngle);
  }

  public resetTo(state: StageTwoWorldState): void {
    this.scene.tweens.killTweensOf(this.headPivot);
    const pose = getFanHeadPose(state.fanDirection);
    this.headPivot.setPosition(pose.x, -this.bodyImage.displayHeight * 0.233).setAngle(pose.angle).setScale(pose.scaleX, 1);
    this.bladeAngle = 0;
    this.blades.setAngle(0);
    this.lastDirection = undefined;
    this.lastPower = undefined;
    this.applyState(state);
  }

  public dispose(): void {
    this.scene.tweens.killTweensOf(this.headPivot);
    this.bladeSpeed = 0;
  }
}
