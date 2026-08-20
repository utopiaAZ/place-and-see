import { describe, expect, it } from 'vitest';
import type { AudioAssetDefinition } from '../../src/audio/AudioManifest';
import { AudioManager, type AudioPlaybackPort } from '../../src/audio/AudioManager';
import { STAGE_001_AUDIO_MANIFEST } from '../../src/audio/stage001AudioManifest';
import { DEFAULT_AUDIO_SETTINGS } from '../../src/audio/soundCategories';
import { GameBridge } from '../../src/bridge/GameBridge';
import { stage001 } from '../../src/content/stages/stage-001';

class MockPlayback implements AudioPlaybackPort {
  public readonly plays: { key: string; volume: number }[] = [];
  public readonly stops: string[] = [];
  public readonly active = new Set<string>();
  public stopAllCount = 0;
  public muted = false;
  public destroyed = false;
  public async unlock() { return true; }
  public async preload() { /* No actual files are loaded in unit tests. */ }
  public play(asset: AudioAssetDefinition, volume: number) {
    this.plays.push({ key: asset.key, volume });
    if (asset.loop) this.active.add(asset.key);
  }
  public stop(key: string) { this.stops.push(key); this.active.delete(key); }
  public stopAll() { this.stopAllCount += 1; this.active.clear(); }
  public setMuted(muted: boolean) { this.muted = muted; }
  public getActiveKeys() { return [...this.active]; }
  public destroy() { this.destroyed = true; }
}

const createAudio = async (muted = false) => {
  const playback = new MockPlayback();
  const manager = new AudioManager(STAGE_001_AUDIO_MANIFEST, playback, { ...DEFAULT_AUDIO_SETTINGS, muted });
  await manager.unlock();
  return { manager, playback };
};

describe('Stage 1 audio integration', () => {
  it('1. requests bottle pickup exactly once', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'bottle' });
    expect(playback.plays.map((play) => play.key)).toEqual(['bottle-pickup-01']);
  });

  it('2. does not use bottle pickup for another object', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'PICK_UP_OBJECT', objectId: 'toy-mouse' });
    expect(playback.plays).toHaveLength(0);
  });

  it('3. requests bottle place on a valid bottle drop', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'bottle', zoneId: 'desk-surface', worldPosition: { x: 1200, y: 350 } });
    expect(playback.plays.some((play) => play.key === 'bottle-place-01')).toBe(true);
  });

  it('4. requests chirp when the cat notices the bottle', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'bottle', zoneId: 'desk-surface', worldPosition: { x: 1200, y: 350 } });
    bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: 250 });
    expect(playback.plays.filter((play) => play.key === 'cat-chirp-01')).toHaveLength(1);
  });

  it('5. requests landing exactly once', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'bottle', zoneId: 'desk-surface', worldPosition: { x: 1200, y: 350 } });
    bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: 1600 });
    expect(playback.plays.filter((play) => play.key === 'cat-landing')).toHaveLength(1);
  });

  it('6-7. requests fall and spill once when the bottle falls', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'bottle', zoneId: 'desk-surface', worldPosition: { x: 1200, y: 350 } });
    bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: 2200 });
    expect(playback.plays.filter((play) => play.key === 'bottle-fall-01')).toHaveLength(1);
    expect(playback.plays.filter((play) => play.key === 'water-spill-01')).toHaveLength(1);
  });

  it('8. requests error feedback for an invalid drop', async () => {
    const { manager, playback } = await createAudio();
    const bridge = new GameBridge(stage001, manager);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'bottle', zoneId: 'desk-surface', worldPosition: { x: 100, y: 100 } });
    expect(playback.plays.filter((play) => play.key === 'error-pop-01')).toHaveLength(1);
  });

  it('9. does not duplicate an eating loop', async () => {
    const { manager, playback } = await createAudio();
    const event = { type: 'CAT_DISTRACTED_BY_FOOD', position: { x: 500, y: 700 } } as const;
    manager.handleGameEvent(event); manager.handleGameEvent(event);
    expect(playback.plays.filter((play) => play.key === 'cat-eating-01')).toHaveLength(1);
  });

  it('10. stops eating when the stage completes', async () => {
    const { manager, playback } = await createAudio();
    manager.handleGameEvent({ type: 'CAT_DISTRACTED_BY_FOOD', position: { x: 500, y: 700 } });
    manager.handleGameEvent({ type: 'STAGE_COMPLETED' });
    expect(playback.stops).toContain('cat-eating-01');
  });

  it('11. stops toy playback when the cat returns', async () => {
    const { manager, playback } = await createAudio();
    manager.handleGameEvent({ type: 'CAT_DISTRACTED_BY_TOY', position: { x: 500, y: 700 } });
    manager.handleGameEvent({ type: 'CAT_RETURNING' });
    expect(playback.stops).toContain('cat-toy-01');
  });

  it('12. stops all playback on reset', async () => {
    const { manager, playback } = await createAudio();
    manager.handleGameEvent({ type: 'CAT_DISTRACTED_BY_TOY', position: { x: 500, y: 700 } });
    manager.handleGameEvent({ type: 'STAGE_RESET', state: new GameBridge(stage001).getState() });
    expect(playback.stopAllCount).toBeGreaterThan(0);
    expect(playback.active.size).toBe(0);
  });

  it('13. plays success only once per stage', async () => {
    const { manager, playback } = await createAudio();
    manager.handleGameEvent({ type: 'STAGE_COMPLETED' });
    manager.handleGameEvent({ type: 'STAGE_COMPLETED' });
    expect(playback.plays.filter((play) => play.key === 'success-01')).toHaveLength(1);
  });

  it('14. tolerates a missing manifest and playback port', () => {
    const manager = new AudioManager(undefined, undefined, DEFAULT_AUDIO_SETTINGS);
    expect(() => manager.handleGameEvent({ type: 'BOTTLE_FELL', position: { x: 0, y: 0 } })).not.toThrow();
  });

  it('15. does not output while muted', async () => {
    const { manager, playback } = await createAudio(true);
    manager.handleGameEvent({ type: 'CAT_NOTICED_BOTTLE' });
    expect(playback.plays).toHaveLength(0);
  });

  it('16. leaves no active loop after destroy', async () => {
    const { manager, playback } = await createAudio();
    manager.handleGameEvent({ type: 'CAT_DISTRACTED_BY_TOY', position: { x: 500, y: 700 } });
    manager.destroy();
    expect(playback.active.size).toBe(0);
    expect(playback.destroyed).toBe(true);
  });
});
