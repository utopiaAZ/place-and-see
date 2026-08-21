import { isShellStageId, STAGE_IDS, type ShellStageId } from '../flow/AppFlow';

export const GAME_PROGRESS_STORAGE_KEY = 'place-and-see:progress:v1';
export const LEGACY_MUTE_STORAGE_KEY = 'place-and-see.audio-muted';

export interface StoredGameProgressV1 {
  readonly version: 1;
  readonly completedStageIds: readonly ShellStageId[];
  readonly lastPlayedStageId: ShellStageId | null;
  readonly muted: boolean;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const DEFAULT_GAME_PROGRESS: StoredGameProgressV1 = {
  version: 1,
  completedStageIds: [],
  lastPlayedStageId: null,
  muted: false,
};

export function readGameProgress(storage: StorageLike | undefined = safeLocalStorage()): StoredGameProgressV1 {
  if (!storage) return DEFAULT_GAME_PROGRESS;
  try {
    const raw = storage.getItem(GAME_PROGRESS_STORAGE_KEY);
    if (raw === null) {
      return { ...DEFAULT_GAME_PROGRESS, muted: storage.getItem(LEGACY_MUTE_STORAGE_KEY) === 'true' };
    }
    const candidate = JSON.parse(raw) as Partial<StoredGameProgressV1>;
    if (candidate.version !== 1 || !Array.isArray(candidate.completedStageIds)) return DEFAULT_GAME_PROGRESS;
    const completedStageIds = STAGE_IDS.filter((stageId) => candidate.completedStageIds!.includes(stageId));
    return {
      version: 1,
      completedStageIds,
      lastPlayedStageId: isShellStageId(candidate.lastPlayedStageId) ? candidate.lastPlayedStageId : null,
      muted: candidate.muted === true,
    };
  } catch {
    return DEFAULT_GAME_PROGRESS;
  }
}

export function writeGameProgress(progress: StoredGameProgressV1, storage: StorageLike | undefined = safeLocalStorage()): boolean {
  if (!storage) return false;
  try {
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify(progress));
    storage.setItem(LEGACY_MUTE_STORAGE_KEY, String(progress.muted));
    return true;
  } catch {
    return false;
  }
}

export function clearGameProgress(storage: StorageLike | undefined = safeLocalStorage()): boolean {
  if (!storage) return false;
  try {
    storage.removeItem(GAME_PROGRESS_STORAGE_KEY);
    return true;
  } catch {
    return false;
  }
}

function safeLocalStorage(): StorageLike | undefined {
  try { return globalThis.localStorage; } catch { return undefined; }
}
