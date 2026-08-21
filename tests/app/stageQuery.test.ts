import { describe, expect, it } from 'vitest';
import { hasDebugQuery, parseStageQuery } from '../../src/app/flow/stageQuery';

describe('stage query compatibility', () => {
  it('uses Home when stage is absent', () => expect(parseStageQuery('')).toEqual({ kind: 'none' }));
  it('opens Stage 2 directly', () => expect(parseStageQuery('?stage=002')).toEqual({ kind: 'valid', stageId: 'stage-002' }));
  it('opens Stage 3 directly', () => expect(parseStageQuery('?stage=003')).toEqual({ kind: 'valid', stageId: 'stage-003' }));
  it('accepts canonical Stage IDs', () => expect(parseStageQuery('?stage=stage-001')).toEqual({ kind: 'valid', stageId: 'stage-001' }));
  it('rejects unknown Stage IDs', () => expect(parseStageQuery('?stage=004')).toEqual({ kind: 'invalid' }));
  it('preserves audioDebug detection', () => expect(hasDebugQuery('?stage=003&audioDebug=1', 'audioDebug')).toBe(true));
  it('preserves debugZones detection', () => expect(hasDebugQuery('?stage=003&debugZones=1', 'debugZones')).toBe(true));
  it('does not enable malformed debug flags', () => expect(hasDebugQuery('?audioDebug=true', 'audioDebug')).toBe(false));
});
