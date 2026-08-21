import type { GameRuntimeLoader, GameRuntimeModule } from './GameRuntimeContract';

let runtimePromise: Promise<GameRuntimeModule> | undefined;

export class GameRuntimeImportError extends Error {
  public constructor(cause: unknown) {
    super('The game runtime module could not be loaded.', { cause });
    this.name = 'GameRuntimeImportError';
  }
}

export const loadGameRuntime: GameRuntimeLoader = () => {
  if (!runtimePromise) {
    runtimePromise = import('../../game-runtime/GameRuntime')
      .then((module) => module.gameRuntime)
      .catch((error: unknown) => {
        runtimePromise = undefined;
        throw new GameRuntimeImportError(error);
      });
  }
  return runtimePromise;
};
