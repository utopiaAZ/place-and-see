import { describe, expect, it } from 'vitest';
import { stage002, stage002Placements } from '../../src/content/stages/stage-002';
import { resolveStageTwoDropZone } from '../../src/phaser/input/stageTwoDropResolver';

describe('Stage 2 plug drop resolution', () => {
  it('keeps the plug connected when released inside the socket', () => {
    expect(resolveStageTwoDropZone(stage002, 'power-plug', 'power-plug', stage002Placements['plugged-anchor'])?.id)
      .toBe('plug-socket');
  });

  it('normalizes every release outside the socket to the unplugged zone', () => {
    expect(resolveStageTwoDropZone(stage002, 'power-plug', 'power-plug', { x: 900, y: 300 })?.id)
      .toBe('plug-unplugged');
    expect(resolveStageTwoDropZone(stage002, 'power-plug', 'power-plug', { x: 500, y: 700 })?.id)
      .toBe('plug-unplugged');
  });

  it('does not change invalid-drop behavior for other objects', () => {
    expect(resolveStageTwoDropZone(stage002, 'document', 'document', { x: 900, y: 300 }))
      .toBeUndefined();
  });
});
