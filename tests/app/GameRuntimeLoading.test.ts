import { describe, expect, it, vi } from 'vitest';
import { GameSessionManager } from '../../src/app/flow/GameSessionManager';
import type {
  GameRuntimeModule, ManagedGameSession, PreparedStageAudio, RuntimeBridge, StageAudioPreparer,
} from '../../src/app/flow/GameRuntimeContract';

function deferred<T>() {
  let resolve!: (value: T) => void; let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

function bridge(): RuntimeBridge {
  return {
    setMuted: vi.fn(), unlockAudio: vi.fn().mockResolvedValue(true), stopAudioLoops: vi.fn(), destroy: vi.fn(),
  } as unknown as RuntimeBridge;
}

function session(stageId: ManagedGameSession['stageId'] = 'stage-001'): ManagedGameSession {
  return { stageId, bridge: bridge(), mount: vi.fn(() => vi.fn()), destroy: vi.fn() };
}

function audio(unlockPromise: Promise<boolean> | null = null): PreparedStageAudio {
  return { playback: {} as PreparedStageAudio['playback'], unlockPromise, setMuted: vi.fn(), destroy: vi.fn() };
}

function readyManager() {
  const created = session(); const createSession = vi.fn(() => created);
  const loader = vi.fn().mockResolvedValue({ createSession } satisfies GameRuntimeModule);
  const prepared = audio(); const prepare = vi.fn(() => prepared);
  return { manager: new GameSessionManager(loader, prepare), loader, prepare, prepared, createSession, created };
}

describe('lazy game runtime lifecycle', () => {
  it('does not call the runtime loader on Home', () => { const { loader } = readyManager(); expect(loader).not.toHaveBeenCalled(); });
  it('does not call the runtime loader on Stage Select', () => { const { loader } = readyManager(); expect(loader).not.toHaveBeenCalled(); });
  it('does not create a session while only Stage Intro is shown', () => { const { createSession } = readyManager(); expect(createSession).not.toHaveBeenCalled(); });

  it('calls the loader exactly once for Start Stage', async () => {
    const { manager, loader } = readyManager(); await manager.start('stage-001', false, true); expect(loader).toHaveBeenCalledOnce();
  });

  it('deduplicates rapid Start Stage calls', async () => {
    const gate = deferred<GameRuntimeModule>(); const loader = vi.fn(() => gate.promise); const prepare = vi.fn(() => audio());
    const manager = new GameSessionManager(loader, prepare);
    const first = manager.start('stage-001', false, true); const second = manager.start('stage-001', false, true);
    expect(first).toBe(second); expect(loader).toHaveBeenCalledOnce(); expect(prepare).toHaveBeenCalledOnce();
    gate.resolve({ createSession: () => session() }); await first;
  });

  it('returns an active session only after load succeeds', async () => {
    const { manager, created } = readyManager(); expect(await manager.start('stage-001', false, true)).toBe(created); expect(manager.getCurrent()).toBe(created);
  });

  it('surfaces load failure and disposes prepared audio', async () => {
    const prepared = audio(); const manager = new GameSessionManager(vi.fn().mockRejectedValue(new Error('chunk')), vi.fn(() => prepared));
    await expect(manager.start('stage-001', false, true)).rejects.toThrow('chunk'); expect(prepared.destroy).toHaveBeenCalledOnce();
  });

  it('supports a successful Retry after failure', async () => {
    const created = session(); const loader = vi.fn().mockRejectedValueOnce(new Error('once')).mockResolvedValueOnce({ createSession: () => created });
    const manager = new GameSessionManager(loader, vi.fn(() => audio()));
    await expect(manager.start('stage-001', false, true)).rejects.toThrow();
    expect(await manager.start('stage-001', false, true)).toBe(created); expect(loader).toHaveBeenCalledTimes(2);
  });

  it('does not create a session when navigation cancels an in-flight import', async () => {
    const gate = deferred<GameRuntimeModule>(); const createSession = vi.fn(() => session()); const prepared = audio();
    const manager = new GameSessionManager(vi.fn(() => gate.promise), vi.fn(() => prepared));
    const pending = manager.start('stage-002', false, false); manager.destroy(); gate.resolve({ createSession });
    expect(await pending).toBeNull(); expect(createSession).not.toHaveBeenCalled(); expect(prepared.destroy).toHaveBeenCalled();
  });

  it('destroys a partially created session when it becomes stale', async () => {
    const createGate = deferred<ManagedGameSession>(); const created = session();
    const manager = new GameSessionManager(vi.fn().mockResolvedValue({ createSession: () => createGate.promise }), vi.fn(() => audio()));
    const pending = manager.start('stage-003', false, true); await Promise.resolve(); manager.destroy(); createGate.resolve(created);
    expect(await pending).toBeNull(); expect(created.destroy).toHaveBeenCalledOnce();
  });

  it('removes the active session when returning Home', async () => {
    const { manager, created } = readyManager(); await manager.start('stage-001', false, true); manager.destroy();
    expect(manager.getCurrent()).toBeNull(); expect(created.destroy).toHaveBeenCalledOnce();
  });

  it('keeps one session across a next-Stage transition', async () => {
    const first = session('stage-001'); const second = session('stage-002');
    const runtime = { createSession: vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second) };
    const manager = new GameSessionManager(vi.fn().mockResolvedValue(runtime), vi.fn(() => audio()));
    await manager.start('stage-001', false, true); await manager.start('stage-002', false, true);
    expect(first.destroy).toHaveBeenCalledOnce(); expect(second.destroy).not.toHaveBeenCalled(); expect(manager.getCurrent()).toBe(second);
  });

  it('deduplicates the StrictMode-equivalent repeated start', async () => {
    const gate = deferred<GameRuntimeModule>(); const loader = vi.fn(() => gate.promise); const manager = new GameSessionManager(loader, vi.fn(() => audio()));
    const first = manager.start('stage-001', false, false); const repeated = manager.start('stage-001', false, false);
    gate.resolve({ createSession: () => session() }); await Promise.all([first, repeated]); expect(loader).toHaveBeenCalledOnce();
  });

  it('starts audio unlock preparation before calling the runtime loader', async () => {
    const order: string[] = []; const prepare: StageAudioPreparer = (_muted, unlock) => { if (unlock) order.push('unlock'); return audio(Promise.resolve(true)); };
    const loader = vi.fn(async () => { order.push('loader'); return { createSession: () => session() }; });
    await new GameSessionManager(loader, prepare).start('stage-001', false, true); expect(order).toEqual(['unlock', 'loader']);
  });

  it('lazy-loads direct query sessions without gesture unlock', async () => {
    const { manager, loader, prepare } = readyManager(); await manager.start('stage-002', false, false);
    expect(loader).toHaveBeenCalledOnce(); expect(prepare).toHaveBeenCalledWith(false, false);
  });

  it('preserves mute updates before and after lazy loading', async () => {
    const gate = deferred<GameRuntimeModule>(); const prepared = audio(); const created = session();
    const manager = new GameSessionManager(vi.fn(() => gate.promise), vi.fn(() => prepared));
    const pending = manager.start('stage-003', false, true); manager.setMuted(true); expect(prepared.setMuted).toHaveBeenCalledWith(true);
    gate.resolve({ createSession: () => created }); await pending; manager.setMuted(false); expect(created.bridge.setMuted).toHaveBeenCalledWith(false);
  });
});
