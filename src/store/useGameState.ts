import { useSyncExternalStore } from 'react';
import type { GameBridge } from '../bridge/GameBridge';

export function useGameState(bridge: GameBridge) {
  return useSyncExternalStore(bridge.subscribeToState, bridge.getState, bridge.getState);
}
