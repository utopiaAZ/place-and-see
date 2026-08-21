import { describe, expect, it } from 'vitest';
import { firstIncompleteStage, nextStageId } from '../../src/app/flow/AppFlow';
import { appFlowReducer, createInitialFlowState } from '../../src/app/flow/appFlowReducer';

describe('appFlowReducer', () => {
  it('starts on Home without a direct query', () => {
    expect(createInitialFlowState().screen).toBe('home');
  });

  it('starts a valid direct stage in playing', () => {
    const state = createInitialFlowState([], null, 'stage-002');
    expect(state).toMatchObject({ screen: 'playing', selectedStageId: 'stage-002', lastPlayedStageId: 'stage-002' });
  });

  it('Play selects the earliest incomplete stage', () => {
    const state = appFlowReducer(createInitialFlowState(['stage-001']), { type: 'PLAY' });
    expect(state).toMatchObject({ screen: 'stage-intro', selectedStageId: 'stage-002' });
  });

  it('Play selects Stage 1 after all stages are complete', () => {
    const state = appFlowReducer(createInitialFlowState(['stage-001', 'stage-002', 'stage-003']), { type: 'PLAY' });
    expect(state.selectedStageId).toBe('stage-001');
  });

  it.each(['stage-001', 'stage-002', 'stage-003'] as const)('selects %s from Stage Select', (stageId) => {
    const state = appFlowReducer(createInitialFlowState(), { type: 'SELECT_STAGE', stageId });
    expect(state).toMatchObject({ screen: 'stage-intro', selectedStageId: stageId, lastPlayedStageId: stageId });
  });

  it('does not start without a selected stage', () => {
    const state = createInitialFlowState();
    expect(appFlowReducer(state, { type: 'START_STAGE' })).toBe(state);
  });

  it('starts only after the intro action', () => {
    const intro = appFlowReducer(createInitialFlowState(), { type: 'SELECT_STAGE', stageId: 'stage-001' });
    expect(appFlowReducer(intro, { type: 'START_STAGE' }).screen).toBe('playing');
  });

  it('records a completed Stage once', () => {
    const playing = createInitialFlowState([], null, 'stage-001');
    const completed = appFlowReducer(playing, { type: 'COMPLETE_STAGE', stageId: 'stage-001' });
    expect(completed.completedStageIds).toEqual(['stage-001']);
    expect(appFlowReducer(completed, { type: 'COMPLETE_STAGE', stageId: 'stage-001' })).toBe(completed);
  });

  it('moves Stage 1 completion to Stage 2 intro', () => {
    const complete = appFlowReducer(createInitialFlowState([], null, 'stage-001'), { type: 'COMPLETE_STAGE', stageId: 'stage-001' });
    expect(appFlowReducer(complete, { type: 'NEXT_STAGE' })).toMatchObject({ screen: 'stage-intro', selectedStageId: 'stage-002' });
  });

  it('moves Stage 2 completion to Stage 3 intro', () => {
    const complete = appFlowReducer(createInitialFlowState([], null, 'stage-002'), { type: 'COMPLETE_STAGE', stageId: 'stage-002' });
    expect(appFlowReducer(complete, { type: 'NEXT_STAGE' })).toMatchObject({ screen: 'stage-intro', selectedStageId: 'stage-003' });
  });

  it('moves Stage 3 completion to Demo Complete', () => {
    const complete = appFlowReducer(createInitialFlowState([], null, 'stage-003'), { type: 'COMPLETE_STAGE', stageId: 'stage-003' });
    expect(complete.screen).toBe('demo-complete');
  });

  it('replays the same stage through its intro', () => {
    const complete = appFlowReducer(createInitialFlowState([], null, 'stage-002'), { type: 'COMPLETE_STAGE', stageId: 'stage-002' });
    expect(appFlowReducer(complete, { type: 'REPLAY_STAGE' })).toMatchObject({ screen: 'stage-intro', selectedStageId: 'stage-002' });
  });

  it('returns Home and clears the current selection', () => {
    const playing = createInitialFlowState([], null, 'stage-002');
    expect(appFlowReducer(playing, { type: 'GO_HOME' })).toMatchObject({ screen: 'home', selectedStageId: null });
  });

  it('returns to Stage Select and clears the current selection', () => {
    const playing = createInitialFlowState([], null, 'stage-002');
    expect(appFlowReducer(playing, { type: 'SHOW_STAGE_SELECT' })).toMatchObject({ screen: 'stage-select', selectedStageId: null });
  });

  it('opens Credits without changing progress', () => {
    const state = createInitialFlowState(['stage-001'], 'stage-001');
    expect(appFlowReducer(state, { type: 'SHOW_CREDITS' })).toMatchObject({ screen: 'credits', completedStageIds: ['stage-001'] });
  });

  it('resets completion and last-played progress', () => {
    const state = createInitialFlowState(['stage-001'], 'stage-001');
    expect(appFlowReducer(state, { type: 'RESET_PROGRESS' })).toMatchObject({ completedStageIds: [], lastPlayedStageId: null });
  });

  it('provides stable stage-order helpers', () => {
    expect(firstIncompleteStage(['stage-002'])).toBe('stage-001');
    expect(nextStageId('stage-001')).toBe('stage-002');
    expect(nextStageId('stage-003')).toBeNull();
  });
});
