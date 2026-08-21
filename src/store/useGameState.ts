import { useSyncExternalStore } from 'react';
import type { RuntimeBridge } from '../app/flow/GameRuntimeContract';

export function useGameState(bridge: RuntimeBridge) {
  return useSyncExternalStore(bridge.subscribeToState, bridge.getState, bridge.getState);
}
