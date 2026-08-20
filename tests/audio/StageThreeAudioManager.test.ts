import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AudioAssetDefinition } from '../../src/audio/AudioManifest';
import { AudioManager, type AudioPlaybackPort } from '../../src/audio/AudioManager';
import { STAGE_003_AND_SHARED_AUDIO_MANIFEST, audioManifestForStage } from '../../src/audio/gameAudioManifest';
import { DEFAULT_AUDIO_SETTINGS } from '../../src/audio/soundCategories';
import { STAGE_001_AUDIO_MANIFEST } from '../../src/audio/stage001AudioManifest';
import { STAGE_002_AUDIO_MANIFEST } from '../../src/audio/stage002AudioManifest';
import { STAGE_003_AUDIO_MANIFEST } from '../../src/audio/stage003AudioManifest';
import { GameBridge } from '../../src/bridge/GameBridge';
import { stage003 } from '../../src/content/stages/stage-003';

class Playback implements AudioPlaybackPort {
  public plays: string[] = []; public active = new Set<string>();
  public async unlock() { return true; }
  public play(asset: AudioAssetDefinition) { this.plays.push(asset.key); if (asset.loop) this.active.add(asset.key); }
  public stop(key: string) { this.active.delete(key); }
  public stopAll() { this.active.clear(); }
  public setMuted() { /* mocked */ }
  public getActiveKeys() { return [...this.active]; }
  public destroy() { this.active.clear(); }
}

describe('Stage 3 semantic audio', () => {
  it('registers four bounded one-shots and preserves shared definitions', () => {
    expect(STAGE_003_AUDIO_MANIFEST.sounds.map((sound) => sound.key)).toEqual(['cake-place-wood-01', 'cake-hit-01', 'candle-light-01', 'candle-blowout-01']);
    expect(STAGE_003_AUDIO_MANIFEST.sounds.every((sound) => sound.loop === false && sound.oncePerStage === false && sound.maxInstances === 1 && sound.durationMs > 0 && sound.startMs + sound.durationMs <= sound.fullDurationMs && sound.volume >= 0 && sound.volume <= 1)).toBe(true);
    expect(audioManifestForStage('stage-003')).toBe(STAGE_003_AND_SHARED_AUDIO_MANIFEST);
    expect(STAGE_003_AND_SHARED_AUDIO_MANIFEST.sounds).toHaveLength(STAGE_001_AUDIO_MANIFEST.sounds.length + STAGE_002_AUDIO_MANIFEST.sounds.length + 4);
  });

  it('keeps each Stage 3 runtime MP3 byte-identical to its source', () => {
    const digest = (path: string) => createHash('sha256').update(readFileSync(path)).digest('hex');
    for (const sound of STAGE_003_AUDIO_MANIFEST.sounds) {
      const source = resolve('source-assets/audio/raw', sound.sourceFile);
      const runtime = resolve('public', sound.url.replace(/^\//, ''));
      expect(digest(runtime)).toBe(digest(source));
    }
  });

  it('maps cake and candle game events to one-shots with cooldown protection', async () => {
    const playback = new Playback(); let now = 0;
    const manager = new AudioManager(STAGE_003_AND_SHARED_AUDIO_MANIFEST, playback, DEFAULT_AUDIO_SETTINGS, () => now);
    await manager.unlock(); manager.handleGameEvent({ type: 'CAKE_PLACED' }); manager.handleGameEvent({ type: 'CAKE_PLACED' });
    manager.handleGameEvent({ type: 'CAT_HIT_CAKE' }); manager.handleGameEvent({ type: 'CANDLE_LIGHTING_STARTED' }); manager.handleGameEvent({ type: 'CANDLE_BLOWN_OUT', reason: 'airflow' });
    expect(playback.plays.filter((key) => key === 'cake-place-wood-01')).toHaveLength(1);
    expect(playback.plays).toEqual(expect.arrayContaining(['cake-hit-01', 'candle-light-01', 'candle-blowout-01']));
    now = 1000; manager.handleGameEvent({ type: 'CAKE_PLACED' }); expect(playback.plays.filter((key) => key === 'cake-place-wood-01')).toHaveLength(2);
  });

  it('reuses the unchanged cat chirp marker for CAT_NOTICED_CAKE', async () => {
    const original = STAGE_001_AUDIO_MANIFEST.sounds.find((sound) => sound.key === 'cat-chirp-01');
    const reused = STAGE_003_AND_SHARED_AUDIO_MANIFEST.sounds.find((sound) => sound.key === 'cat-chirp-01');
    expect(reused).toMatchObject({ ...original, event: 'CAT_NOTICED_CAKE' });
    const playback = new Playback(); const manager = new AudioManager(STAGE_003_AND_SHARED_AUDIO_MANIFEST, playback, DEFAULT_AUDIO_SETTINGS); await manager.unlock();
    manager.handleGameEvent({ type: 'CAT_NOTICED_CAKE' });
    expect(playback.plays.filter((key) => key === 'cat-chirp-01')).toHaveLength(1);
  });

  it('uses blowout audio for airflow but not for cake movement', async () => {
    const playback = new Playback(); const manager = new AudioManager(STAGE_003_AND_SHARED_AUDIO_MANIFEST, playback, DEFAULT_AUDIO_SETTINGS); await manager.unlock();
    manager.handleGameEvent({ type: 'CANDLE_BLOWN_OUT', reason: 'movement' });
    expect(playback.plays).not.toContain('candle-blowout-01');
    manager.handleGameEvent({ type: 'CANDLE_BLOWN_OUT', reason: 'airflow' });
    expect(playback.plays.filter((key) => key === 'candle-blowout-01')).toHaveLength(1);
  });

  it('does not request placement or light audio for rejected commands and resets without Stage 3 one-shots', async () => {
    const playback = new Playback(); const manager = new AudioManager(STAGE_003_AND_SHARED_AUDIO_MANIFEST, playback, DEFAULT_AUDIO_SETTINGS); await manager.unlock();
    const bridge = new GameBridge(stage003, manager);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'cake', zoneId: 'cake-desk', worldPosition: { x: 100, y: 100 } });
    bridge.dispatch({ type: 'LIGHT_CANDLE', lighterId: 'lighter' });
    expect(playback.plays).not.toContain('cake-place-wood-01');
    expect(playback.plays).not.toContain('candle-light-01');
    bridge.reset();
    expect(playback.plays.filter((key) => STAGE_003_AUDIO_MANIFEST.sounds.some((sound) => sound.key === key))).toHaveLength(0);
    bridge.destroy();
  });

  it('suppresses Stage 3 one-shots while muted', async () => {
    const playback = new Playback(); const manager = new AudioManager(STAGE_003_AND_SHARED_AUDIO_MANIFEST, playback, { ...DEFAULT_AUDIO_SETTINGS, muted: true }); await manager.unlock();
    manager.handleGameEvent({ type: 'CAKE_PLACED' }); manager.handleGameEvent({ type: 'CAT_HIT_CAKE' }); manager.handleGameEvent({ type: 'CANDLE_LIGHTING_STARTED' });
    expect(playback.plays).toHaveLength(0);
  });

  it('stops reused fan and toy loops on end, mute, success, and destroy', async () => {
    const playback = new Playback(); const manager = new AudioManager(STAGE_003_AND_SHARED_AUDIO_MANIFEST, playback, DEFAULT_AUDIO_SETTINGS); await manager.unlock();
    manager.handleGameEvent({ type: 'FAN_STARTED' }); manager.handleGameEvent({ type: 'CAT_DISTRACTED_BY_TOY', position: { x: 0, y: 0 } });
    manager.handleGameEvent({ type: 'CAT_DISTRACTION_ENDED' }); expect(playback.active.has('cat-toy-01')).toBe(false);
    manager.updateSettings({ ...DEFAULT_AUDIO_SETTINGS, muted: true }); expect(playback.active.size).toBe(0);
    manager.updateSettings(DEFAULT_AUDIO_SETTINGS); manager.handleGameEvent({ type: 'FAN_STARTED' }); manager.handleGameEvent({ type: 'STAGE_COMPLETED' }); expect(playback.active.size).toBe(0);
    manager.destroy(); expect(playback.active.size).toBe(0);
  });
});
