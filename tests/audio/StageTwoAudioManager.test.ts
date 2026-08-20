import { describe, expect, it } from 'vitest';
import type { AudioAssetDefinition, AudioManifest } from '../../src/audio/AudioManifest';
import { AudioManager, type AudioPlaybackPort } from '../../src/audio/AudioManager';
import { DEFAULT_AUDIO_SETTINGS } from '../../src/audio/soundCategories';
import { STAGE_002_AND_SHARED_AUDIO_MANIFEST, audioManifestForStage } from '../../src/audio/gameAudioManifest';
import { STAGE_001_AUDIO_MANIFEST } from '../../src/audio/stage001AudioManifest';
import { STAGE_002_AUDIO_MANIFEST } from '../../src/audio/stage002AudioManifest';
import { GameBridge } from '../../src/bridge/GameBridge';
import { stage002 } from '../../src/content/stages/stage-002';

class Playback implements AudioPlaybackPort {
  public plays: string[] = []; public stops: string[] = []; public active = new Set<string>();
  public async unlock() { return true; }
  public play(asset: AudioAssetDefinition) { this.plays.push(asset.key); if (asset.loop) this.active.add(asset.key); }
  public stop(key: string) { this.stops.push(key); this.active.delete(key); }
  public stopAll() { this.active.clear(); }
  public setMuted() { /* mocked */ }
  public getActiveKeys() { return [...this.active]; }
  public destroy() { this.active.clear(); }
}

const definition = (key: string, event: AudioAssetDefinition['event'], loop = false): AudioAssetDefinition => ({
  key, event, loop, sourceFile: `${key}.mp3`, url: `/missing/${key}.mp3`, category: loop ? 'loop' : 'sfx', fullDurationMs: 5000, startMs: 0, durationMs: 1000, volume: 0.5,
});
const manifest: AudioManifest = { version: 1, sounds: [
  definition('fan-loop-01', 'FAN_STARTED', true),
  definition('paper-flutter-01', 'PAPER_FLUTTER_STARTED', true),
  definition('paper-fall-01', 'PAPER_BLOWN_AWAY'),
] };

const setup = async () => {
  const playback = new Playback();
  const manager = new AudioManager(manifest, playback, DEFAULT_AUDIO_SETTINGS);
  const bridge = new GameBridge(stage002, manager);
  await bridge.unlockAudio();
  return { playback, manager, bridge };
};

describe('Stage 2 semantic audio lifecycle', () => {
  it('registers the three Stage 2 files without changing the Stage 1 manifest', () => {
    expect(STAGE_002_AUDIO_MANIFEST.sounds.map((sound) => sound.key)).toEqual([
      'fan-loop-01', 'paper-flutter-01', 'paper-fall-01',
    ]);
    expect(audioManifestForStage('stage-001')).toBe(STAGE_001_AUDIO_MANIFEST);
    expect(audioManifestForStage('stage-002')).toBe(STAGE_002_AND_SHARED_AUDIO_MANIFEST);
    expect(STAGE_002_AND_SHARED_AUDIO_MANIFEST.sounds).toHaveLength(STAGE_001_AUDIO_MANIFEST.sounds.length + 3);
  });

  it('starts one fan loop after unlock and avoids duplicates', async () => {
    const { playback, bridge } = await setup();
    await bridge.unlockAudio();
    expect(playback.plays.filter((key) => key === 'fan-loop-01')).toHaveLength(1);
  });

  it('stops fan on slowdown completion and restarts it on reset', async () => {
    const { playback, bridge } = await setup();
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'power-plug', zoneId: 'plug-unplugged', worldPosition: { x: 770, y: 605 } });
    bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: 600 });
    expect(playback.stops).toContain('fan-loop-01');
    bridge.reset();
    expect(playback.plays.filter((key) => key === 'fan-loop-01')).toHaveLength(2);
  });

  it('starts/stops flutter and plays paper fall once', async () => {
    const { playback, bridge } = await setup();
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'document', zoneId: 'document-desk', worldPosition: { x: 1200, y: 402 } });
    bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: 1700 });
    expect(playback.plays.filter((key) => key === 'paper-flutter-01')).toHaveLength(1);
    expect(playback.stops).toContain('paper-flutter-01');
    expect(playback.plays.filter((key) => key === 'paper-fall-01')).toHaveLength(1);
  });

  it('cleans Stage 2 loops on completion, mute, and destroy', async () => {
    const { playback, manager, bridge } = await setup();
    manager.handleGameEvent({ type: 'PAPER_FLUTTER_STARTED' });
    manager.updateSettings({ ...DEFAULT_AUDIO_SETTINGS, muted: true });
    expect(playback.active.size).toBe(0);
    manager.updateSettings(DEFAULT_AUDIO_SETTINGS);
    manager.handleGameEvent({ type: 'FAN_STARTED' });
    manager.handleGameEvent({ type: 'STAGE_COMPLETED' });
    expect(playback.active.size).toBe(0);
    bridge.destroy();
    expect(playback.active.size).toBe(0);
  });
});
