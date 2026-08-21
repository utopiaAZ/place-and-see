import { firstIncompleteStage, nextStageId, type AppFlowState, type ShellStageId } from './AppFlow';

export type AppFlowAction =
  | { readonly type: 'PLAY' }
  | { readonly type: 'SHOW_STAGE_SELECT' }
  | { readonly type: 'SHOW_CREDITS' }
  | { readonly type: 'GO_HOME' }
  | { readonly type: 'SELECT_STAGE'; readonly stageId: ShellStageId }
  | { readonly type: 'START_STAGE' }
  | { readonly type: 'COMPLETE_STAGE'; readonly stageId: ShellStageId }
  | { readonly type: 'NEXT_STAGE' }
  | { readonly type: 'REPLAY_STAGE' }
  | { readonly type: 'RESET_PROGRESS' };

export function createInitialFlowState(
  completedStageIds: readonly ShellStageId[] = [],
  lastPlayedStageId: ShellStageId | null = null,
  directStageId: ShellStageId | null = null,
): AppFlowState {
  return {
    screen: directStageId ? 'playing' : 'home',
    selectedStageId: directStageId,
    completedStageIds: [...completedStageIds],
    lastPlayedStageId: directStageId ?? lastPlayedStageId,
  };
}

export function appFlowReducer(state: AppFlowState, action: AppFlowAction): AppFlowState {
  switch (action.type) {
    case 'PLAY': {
      const stageId = firstIncompleteStage(state.completedStageIds);
      return { ...state, screen: 'stage-intro', selectedStageId: stageId, lastPlayedStageId: stageId };
    }
    case 'SHOW_STAGE_SELECT':
      return { ...state, screen: 'stage-select', selectedStageId: null };
    case 'SHOW_CREDITS':
      return { ...state, screen: 'credits' };
    case 'GO_HOME':
      return { ...state, screen: 'home', selectedStageId: null };
    case 'SELECT_STAGE':
      return { ...state, screen: 'stage-intro', selectedStageId: action.stageId, lastPlayedStageId: action.stageId };
    case 'START_STAGE':
      return state.selectedStageId ? { ...state, screen: 'playing' } : state;
    case 'COMPLETE_STAGE': {
      if (state.screen !== 'playing' || state.selectedStageId !== action.stageId) return state;
      const completedStageIds = state.completedStageIds.includes(action.stageId)
        ? state.completedStageIds
        : [...state.completedStageIds, action.stageId];
      return {
        ...state,
        screen: action.stageId === 'stage-003' ? 'demo-complete' : 'stage-complete',
        completedStageIds,
      };
    }
    case 'NEXT_STAGE': {
      if (!state.selectedStageId) return state;
      const stageId = nextStageId(state.selectedStageId);
      return stageId
        ? { ...state, screen: 'stage-intro', selectedStageId: stageId, lastPlayedStageId: stageId }
        : { ...state, screen: 'demo-complete' };
    }
    case 'REPLAY_STAGE':
      return state.selectedStageId ? { ...state, screen: 'stage-intro' } : state;
    case 'RESET_PROGRESS':
      return { ...state, completedStageIds: [], lastPlayedStageId: null };
  }
}
