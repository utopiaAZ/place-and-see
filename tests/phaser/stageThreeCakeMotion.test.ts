import { describe, expect, it } from 'vitest';
import { stage003 } from '../../src/content/stages/stage-003';
import { CAKE_PART_DEPTH, candleLocalCenter, candlePoseFor, flameBottomAnchor, flamePoseFor } from '../../src/phaser/animation/stageThreeCakeMotion';

const layout = stage003.scene.stageThree;

describe('Stage 3 cake motion', () => {
  it('shows a small nonzero flame while lighting', () => { expect(flamePoseFor('lighting')).toMatchObject({ visible: true, alpha: 0.9, scaleX: 0.45, scaleY: 0.45 }); });
  it('keeps a lit flame visible at full pose', () => { expect(flamePoseFor('lit')).toMatchObject({ visible: true, alpha: 1, scaleX: 1, scaleY: 1, angle: 0 }); });
  it('leans and stretches a visible flickering flame', () => { expect(flamePoseFor('flickering')).toMatchObject({ visible: true, angle: -24, scaleX: 0.72, scaleY: 1.18 }); });
  it('hides an extinguished flame', () => { expect(flamePoseFor('extinguished')).toMatchObject({ visible: false, alpha: 0 }); });
  it('aligns flame bottom center with the candle wick top', () => {
    const candle = candleLocalCenter(layout); const flame = flameBottomAnchor(layout);
    expect(flame.x).toBe(candle.x); expect(flame.y).toBeCloseTo(candle.y - layout.candleDisplaySize.height / 2 + 4.5);
  });
  it('tips the candle onto a damaged cake and restores the upright reset pose', () => {
    const upright = candlePoseFor(layout, 'intact');
    const fallen = candlePoseFor(layout, 'damaged');
    expect(upright).toMatchObject({ ...candleLocalCenter(layout), angle: 0 });
    expect(fallen.angle).toBeGreaterThan(70);
    expect(fallen.x).toBeGreaterThan(upright.x);
    expect(fallen.y).toBeGreaterThan(upright.y);
  });
  it('orders candle, flame, and smoke above cake and damage', () => {
    expect(CAKE_PART_DEPTH.cake).toBeLessThan(CAKE_PART_DEPTH.damage);
    expect(CAKE_PART_DEPTH.damage).toBeLessThan(CAKE_PART_DEPTH.candle);
    expect(CAKE_PART_DEPTH.candle).toBeLessThan(CAKE_PART_DEPTH.flame);
    expect(CAKE_PART_DEPTH.flame).toBeLessThan(CAKE_PART_DEPTH.smoke);
  });
});
