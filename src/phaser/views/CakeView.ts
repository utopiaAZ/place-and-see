import Phaser from 'phaser';
import type { StageThreeWorldState } from '../../core/types/WorldTypes';
import {
  CAKE_PART_DEPTH, candleLocalCenter, candlePoseFor, flameBottomAnchor, flamePoseFor,
  resolveCandleIgnitionBounds, type CakePartLayoutInput,
} from '../animation/stageThreeCakeMotion';
import { InteractiveObjectView } from './InteractiveObjectView';

export class CakeView extends InteractiveObjectView {
  private readonly damage: Phaser.GameObjects.Image;
  private readonly candle: Phaser.GameObjects.Image;
  private readonly flame: Phaser.GameObjects.Image;
  private readonly smoke: Phaser.GameObjects.Image;
  private readonly flameBaseScale: { readonly x: number; readonly y: number };
  private readonly smokeBaseScale: { readonly x: number; readonly y: number };
  private lastCandle?: StageThreeWorldState['candleState'];
  private lastCondition?: StageThreeWorldState['cakeCondition'];

  public constructor(scene: Phaser.Scene, x: number, y: number, private readonly layout: CakePartLayoutInput) {
    super(scene, 'cake', x, y, 145, 100);
    const candlePosition = candleLocalCenter(layout);
    const flameAnchor = flameBottomAnchor(layout);
    const shadow = scene.add.ellipse(0, 43, 110, 13, 0x17213a, 0.12).setDepth(0);
    const cake = scene.add.image(0, 0, 'stage003.cake').setDisplaySize(layout.cakeDisplaySize.width, layout.cakeDisplaySize.height).setDepth(CAKE_PART_DEPTH.cake);
    this.damage = scene.add.image(0, 0, 'stage003.cake-damage-overlay').setDisplaySize(layout.cakeDisplaySize.width, layout.cakeDisplaySize.height).setDepth(CAKE_PART_DEPTH.damage).setVisible(false);
    this.candle = scene.add.image(candlePosition.x, candlePosition.y, 'stage003.candle').setDisplaySize(layout.candleDisplaySize.width, layout.candleDisplaySize.height).setDepth(CAKE_PART_DEPTH.candle);
    this.flame = scene.add.image(flameAnchor.x, flameAnchor.y, 'stage003.flame').setDisplaySize(24, 34).setOrigin(0.5, 1).setDepth(CAKE_PART_DEPTH.flame).setVisible(false);
    this.smoke = scene.add.image(flameAnchor.x, flameAnchor.y - 8, 'stage003.smoke-puff').setDisplaySize(38, 38).setDepth(CAKE_PART_DEPTH.smoke).setVisible(false);
    this.flameBaseScale = { x: this.flame.scaleX, y: this.flame.scaleY };
    this.smokeBaseScale = { x: this.smoke.scaleX, y: this.smoke.scaleY };
    this.add([shadow, cake, this.damage, this.candle, this.flame, this.smoke]);
  }

  public getCandleIgnitionWorldBounds(): Phaser.Geom.Rectangle {
    const bounds = resolveCandleIgnitionBounds({
      ...this.layout,
      cakeWorldPosition: { x: this.x, y: this.y },
      cakeScale: { x: this.scaleX, y: this.scaleY },
    });
    return new Phaser.Geom.Rectangle(bounds.x, bounds.y, bounds.width, bounds.height);
  }

  public getFlameDebugState() {
    return {
      visible: this.flame.visible, alpha: this.flame.alpha,
      scaleX: this.flame.scaleX, scaleY: this.flame.scaleY, depth: this.flame.depth,
      smokeVisible: this.smoke.visible, smokeAlpha: this.smoke.alpha,
      candleX: this.candle.x, candleY: this.candle.y, candleAngle: this.candle.angle,
    };
  }

  public applyCakeState(state: StageThreeWorldState, immediate = false): void {
    this.damage.setVisible(state.cakeCondition === 'damaged');
    if (immediate || state.cakeCondition !== this.lastCondition) {
      const candlePose = candlePoseFor(this.layout, state.cakeCondition);
      this.scene.tweens.killTweensOf(this.candle);
      if (!immediate && this.lastCondition === 'intact' && state.cakeCondition === 'damaged') {
        this.scene.tweens.add({ targets: this.candle, ...candlePose, duration: 220, ease: 'Back.easeOut' });
      } else {
        this.candle.setPosition(candlePose.x, candlePose.y).setAngle(candlePose.angle);
      }
    }
    const pose = flamePoseFor(state.candleState);
    if (immediate || state.candleState !== this.lastCandle) {
      const previous = this.lastCandle;
      this.scene.tweens.killTweensOf([this.flame, this.smoke]);
      this.flame
        .setVisible(pose.visible).setAlpha(pose.alpha)
        .setScale(this.flameBaseScale.x * pose.scaleX, this.flameBaseScale.y * pose.scaleY)
        .setAngle(pose.angle);
      this.smoke.setVisible(false).setAlpha(0);
      if (state.candleState === 'lit') {
        this.scene.tweens.add({
          targets: this.flame,
          scaleY: { from: this.flameBaseScale.y * 0.94, to: this.flameBaseScale.y * 1.06 },
          angle: { from: -3, to: 3 }, duration: 180, yoyo: true, repeat: -1, ease: 'Sine.easeInOut',
        });
      } else if (state.candleState === 'flickering') {
        this.scene.tweens.add({
          targets: this.flame,
          angle: { from: -30, to: -14 },
          scaleX: { from: this.flameBaseScale.x * 0.58, to: this.flameBaseScale.x * 0.78 },
          duration: 80, yoyo: true, repeat: -1,
        });
      } else if (state.candleState === 'extinguished' && previous && ['lighting', 'lit', 'flickering'].includes(previous)) {
        this.flame.setVisible(true);
        this.scene.tweens.add({
          targets: this.flame, alpha: 0,
          scaleX: this.flameBaseScale.x * 0.15, scaleY: this.flameBaseScale.y * 0.15,
          duration: 180, onComplete: () => this.flame.setVisible(false),
        });
        const anchor = flameBottomAnchor(this.layout);
        this.smoke
          .setPosition(anchor.x, anchor.y - 8).setVisible(true).setAlpha(0.8)
          .setScale(this.smokeBaseScale.x * 0.5, this.smokeBaseScale.y * 0.5);
        this.scene.tweens.add({
          targets: this.smoke, y: anchor.y - 44, alpha: 0,
          scaleX: this.smokeBaseScale.x, scaleY: this.smokeBaseScale.y,
          duration: 520, onComplete: () => this.smoke.setVisible(false),
        });
      }
    }
    this.lastCandle = state.candleState;
    this.lastCondition = state.cakeCondition;
  }

  public resetCakeState(state: StageThreeWorldState): void {
    this.scene.tweens.killTweensOf([this.candle, this.flame, this.smoke]);
    this.lastCandle = undefined;
    this.lastCondition = undefined;
    this.smoke.setVisible(false).setAlpha(0);
    this.applyCakeState(state, true);
    this.resetVisualState();
  }

  public dispose(): void { this.scene.tweens.killTweensOf([this, this.candle, this.flame, this.smoke]); }
}
