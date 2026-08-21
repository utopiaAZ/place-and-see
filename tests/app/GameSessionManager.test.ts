import { describe, expect, it, vi } from 'vitest';
import { GameSessionManager } from '../../src/app/flow/GameSessionManager';
import type {
  GameRuntimeModule, ManagedGameSession, PreparedStageAudio, RuntimeBridge, StageAudioPreparer,
} from '../../src/app/flow/GameRuntimeContract';

function fakeBridge(): RuntimeBridge {
  return {
    getStage: vi.fn(), getState: vi.fn(), subscribeToState: vi.fn(), subscribe: vi.fn(), reset: vi.fn(),
    setMuted: vi.fn(), unlockAudio: vi.fn().mockResolvedValue(true), stopAudioLoops: vi.fn(),
    getAudioDebugState: vi.fn(), playAudioForQa: vi.fn(), stopAudioForQa: vi.fn(), stopAllAudioForQa: vi.fn(), destroy: vi.fn(),
  } as unknown as RuntimeBridge;
}

function fakeSession(stageId: ManagedGameSession['stageId'] = 'stage-001'): ManagedGameSession {
  return { stageId, bridge: fakeBridge(), mount: vi.fn(() => vi.fn()), destroy: vi.fn() };
}

function fakeAudio(): PreparedStageAudio {
  return { playback: {} as PreparedStageAudio['playback'], unlockPromise: null, setMuted: vi.fn(), destroy: vi.fn() };
}

function setup(createSession = vi.fn(() => fakeSession())) {
  const runtime: GameRuntimeModule = { createSession };
  const loader = vi.fn().mockResolvedValue(runtime);
  const audio = fakeAudio();
  const prepare: StageAudioPreparer = vi.fn(() => audio);
  return { manager: new GameSessionManager(loader, prepare), loader, prepare, audio, createSession };
}

describe('GameSessionManager', () => {
  it('does not load a runtime before Start Stage', () => {
    const { manager, loader } = setup();
    expect(manager.getCurrent()).toBeNull();
    expect(loader).not.toHaveBeenCalled();
  });

  it('creates one session after Start Stage', async () => {
    const { manager } = setup();
    expect((await manager.start('stage-001', false, true))?.stageId).toBe('stage-001');
    expect(manager.getCurrent()?.stageId).toBe('stage-001');
  });

  it('passes the Start gesture flag to audio preparation', async () => {
    const { manager, prepare } = setup();
    await manager.start('stage-001', false, true);
    expect(prepare).toHaveBeenCalledWith(false, true);
  });

  it('defers unlock preparation for direct query sessions', async () => {
    const { manager, prepare } = setup();
    await manager.start('stage-002', false, false);
    expect(prepare).toHaveBeenCalledWith(false, false);
  });

  it('propagates loader failure without retaining a session', async () => {
    const prepare = vi.fn(() => fakeAudio());
    const manager = new GameSessionManager(vi.fn().mockRejectedValue(new Error('load failed')), prepare);
    await expect(manager.start('stage-003', false, true)).rejects.toThrow('load failed');
    expect(manager.getCurrent()).toBeNull();
  });

  it('applies mute to session creation', async () => {
    const { manager, createSession } = setup();
    await manager.start('stage-003', true, true);
    expect(createSession).toHaveBeenCalledWith('stage-003', true, expect.any(Object));
  });

  it('updates mute on the active session', async () => {
    const session = fakeSession();
    const { manager } = setup(vi.fn(() => session));
    await manager.start('stage-001', false, false);
    manager.setMuted(true);
    expect(session.bridge.setMuted).toHaveBeenLastCalledWith(true);
  });

  it('destroys the previous session before Stage replacement', async () => {
    const first = fakeSession('stage-001'); const second = fakeSession('stage-002');
    const createSession = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const { manager } = setup(createSession);
    await manager.start('stage-001', false, false);
    await manager.start('stage-002', false, false);
    expect(first.destroy).toHaveBeenCalledOnce();
    expect(manager.getCurrent()).toBe(second);
  });

  it('delegates loop and bridge cleanup to session destroy', async () => {
    const session = fakeSession(); const { manager } = setup(vi.fn(() => session));
    await manager.start('stage-002', false, false);
    manager.destroy();
    expect(session.destroy).toHaveBeenCalledOnce();
  });

  it('makes destroy idempotent', async () => {
    const session = fakeSession(); const { manager } = setup(vi.fn(() => session));
    await manager.start('stage-001', false, false);
    manager.destroy(); manager.destroy();
    expect(session.destroy).toHaveBeenCalledOnce();
  });

  it('does not destroy a replacement when asked to destroy a stale session', async () => {
    const first = fakeSession('stage-001'); const second = fakeSession('stage-002');
    const { manager } = setup(vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second));
    await manager.start('stage-001', false, false);
    await manager.start('stage-002', false, false);
    manager.destroy(first);
    expect(second.destroy).not.toHaveBeenCalled();
  });
});
