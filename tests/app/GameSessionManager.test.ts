import { describe, expect, it, vi } from 'vitest';
import { GameSessionManager, type SessionBridge } from '../../src/app/flow/GameSessionManager';

function fakeBridge(overrides: Partial<SessionBridge> = {}): SessionBridge {
  return {
    setMuted: vi.fn(),
    unlockAudio: vi.fn().mockResolvedValue(true),
    stopAudioLoops: vi.fn(),
    destroy: vi.fn(),
    ...overrides,
  };
}

describe('GameSessionManager', () => {
  it('does not create a session before Start Stage', () => {
    const factory = vi.fn(() => fakeBridge());
    const manager = new GameSessionManager(factory);
    expect(manager.getCurrent()).toBeNull();
    expect(factory).not.toHaveBeenCalled();
  });

  it('creates one session after Start Stage', () => {
    const manager = new GameSessionManager(() => fakeBridge());
    expect(manager.start('stage-001', false, true).stageId).toBe('stage-001');
    expect(manager.getCurrent()?.stageId).toBe('stage-001');
  });

  it('unlocks audio from the Start gesture path', () => {
    const bridge = fakeBridge();
    new GameSessionManager(() => bridge).start('stage-001', false, true);
    expect(bridge.unlockAudio).toHaveBeenCalledOnce();
  });

  it('defers unlock for direct query sessions', () => {
    const bridge = fakeBridge();
    new GameSessionManager(() => bridge).start('stage-002', false, false);
    expect(bridge.unlockAudio).not.toHaveBeenCalled();
  });

  it('does not block session creation when unlock rejects', async () => {
    const bridge = fakeBridge({ unlockAudio: vi.fn().mockRejectedValue(new Error('denied')) });
    const session = new GameSessionManager(() => bridge).start('stage-003', false, true);
    expect(session.stageId).toBe('stage-003');
    await Promise.resolve();
  });

  it('applies mute before starting', () => {
    const bridge = fakeBridge();
    new GameSessionManager(() => bridge).start('stage-003', true, true);
    expect(bridge.setMuted).toHaveBeenCalledWith(true);
  });

  it('updates mute on the active session', () => {
    const bridge = fakeBridge();
    const manager = new GameSessionManager(() => bridge);
    manager.start('stage-001', false, false);
    manager.setMuted(true);
    expect(bridge.setMuted).toHaveBeenLastCalledWith(true);
  });

  it('destroys the previous session before Stage replacement', () => {
    const first = fakeBridge();
    const second = fakeBridge();
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const manager = new GameSessionManager(factory);
    manager.start('stage-001', false, false);
    manager.start('stage-002', false, false);
    expect(first.stopAudioLoops).toHaveBeenCalledOnce();
    expect(first.destroy).toHaveBeenCalledOnce();
    expect(manager.getCurrent()?.bridge).toBe(second);
  });

  it('stops loops before destroying a session', () => {
    const order: string[] = [];
    const bridge = fakeBridge({ stopAudioLoops: () => { order.push('stop'); }, destroy: () => { order.push('destroy'); } });
    const manager = new GameSessionManager(() => bridge);
    manager.start('stage-002', false, false);
    manager.destroy();
    expect(order).toEqual(['stop', 'destroy']);
  });

  it('makes destroy idempotent', () => {
    const bridge = fakeBridge();
    const manager = new GameSessionManager(() => bridge);
    manager.start('stage-001', false, false);
    manager.destroy();
    manager.destroy();
    expect(bridge.destroy).toHaveBeenCalledOnce();
  });

  it('does not destroy a stale session after replacement', () => {
    const first = fakeBridge();
    const second = fakeBridge();
    const factory = vi.fn().mockReturnValueOnce(first).mockReturnValueOnce(second);
    const manager = new GameSessionManager(factory);
    const stale = manager.start('stage-001', false, false);
    manager.start('stage-002', false, false);
    manager.destroy(stale);
    expect(second.destroy).not.toHaveBeenCalled();
  });
});
