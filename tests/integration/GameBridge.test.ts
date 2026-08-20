import { describe, expect, it, vi } from 'vitest';
import { GameBridge } from '../../src/bridge/GameBridge';
import { stage001 } from '../../src/content/stages/stage-001';

describe('GameBridge', () => {
  it('publishes state and safely removes listeners', () => {
    const bridge = new GameBridge(stage001);
    const listener = vi.fn();
    const unsubscribe = bridge.subscribeToState(listener);
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'bottle', worldPosition: { x: 1200, y: 350 }, zoneId: 'desk-surface' });
    expect(listener).toHaveBeenCalled();
    unsubscribe();
    listener.mockClear();
    bridge.reset();
    expect(listener).not.toHaveBeenCalled();
    bridge.destroy();
    bridge.destroy();
  });
});
