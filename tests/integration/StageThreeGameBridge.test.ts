import { describe, expect, it } from 'vitest';
import { GameBridge } from '../../src/bridge/GameBridge';
import { stage003, stage003Placements } from '../../src/content/stages/stage-003';

describe('Stage 3 ignition bridge path', () => {
  it('delivers LIGHT_CANDLE once and publishes lighting then lit snapshots without audio files', () => {
    const bridge = new GameBridge(stage003);
    const events: string[] = [];
    bridge.subscribe((event) => events.push(event.type));
    bridge.dispatch({ type: 'DROP_OBJECT', objectId: 'cake', zoneId: 'cake-desk', worldPosition: stage003Placements['cake-desk'] });
    expect(bridge.dispatch({ type: 'LIGHT_CANDLE', lighterId: 'lighter' }).accepted).toBe(true);
    expect(bridge.getState().stageThree?.candleState).toBe('lighting');
    bridge.dispatch({ type: 'ADVANCE_TIME', deltaMs: 300 });
    expect(bridge.getState().stageThree?.candleState).toBe('lit');
    expect(events.filter((event) => event === 'CANDLE_LIGHTING_STARTED')).toHaveLength(1);
    expect(events.filter((event) => event === 'CANDLE_LIT')).toHaveLength(1);
    bridge.destroy();
  });
});
