import { describe, expect, it, vi } from 'vitest';
import { GameBridge } from '../../src/bridge/GameBridge';
import { stage001 } from '../../src/content/stages/stage-001';

describe('GameBridge', () => {
  it('publishes state and safely removes listeners', () => {
    const bridge = new GameBridge(stage001);
    const listener = vi.fn();
    const unsubscribe = bridge.subscribeToState(listener);
    bridge.dispatch({ type: 'MOVE_OBJECT', objectId: 'bottle', position: { x: 500, y: 200 }, location: 'desk' });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    bridge.reset();
    expect(listener).not.toHaveBeenCalled();
    bridge.destroy();
    bridge.destroy();
  });
});
