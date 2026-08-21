import { describe, expect, it } from 'vitest';
import {
  clearGameProgress,
  DEFAULT_GAME_PROGRESS,
  GAME_PROGRESS_STORAGE_KEY,
  LEGACY_MUTE_STORAGE_KEY,
  readGameProgress,
  writeGameProgress,
  type StorageLike,
} from '../../src/app/storage/gameProgressStorage';

class MemoryStorage implements StorageLike {
  public readonly values = new Map<string, string>();
  public getItem(key: string) { return this.values.get(key) ?? null; }
  public setItem(key: string, value: string) { this.values.set(key, value); }
  public removeItem(key: string) { this.values.delete(key); }
}

describe('gameProgressStorage', () => {
  it('uses defaults when no data exists', () => {
    expect(readGameProgress(new MemoryStorage())).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('restores valid progress', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, completedStageIds: ['stage-001'], lastPlayedStageId: 'stage-002', muted: true }));
    expect(readGameProgress(storage)).toEqual({ version: 1, completedStageIds: ['stage-001'], lastPlayedStageId: 'stage-002', muted: true });
  });

  it('recovers from broken JSON', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, '{broken');
    expect(readGameProgress(storage)).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('rejects an unknown schema version', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 2, completedStageIds: ['stage-001'], muted: true }));
    expect(readGameProgress(storage)).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('removes unknown Stage IDs', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, completedStageIds: ['stage-999', 'stage-002'], lastPlayedStageId: null, muted: false }));
    expect(readGameProgress(storage).completedStageIds).toEqual(['stage-002']);
  });

  it('deduplicates and normalizes Stage order', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, completedStageIds: ['stage-003', 'stage-001', 'stage-003'], lastPlayedStageId: null, muted: false }));
    expect(readGameProgress(storage).completedStageIds).toEqual(['stage-001', 'stage-003']);
  });

  it('removes an unknown last-played Stage', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, JSON.stringify({ version: 1, completedStageIds: [], lastPlayedStageId: 'stage-999', muted: false }));
    expect(readGameProgress(storage).lastPlayedStageId).toBeNull();
  });

  it('migrates the legacy mute setting when progress is absent', () => {
    const storage = new MemoryStorage();
    storage.setItem(LEGACY_MUTE_STORAGE_KEY, 'true');
    expect(readGameProgress(storage).muted).toBe(true);
  });

  it('writes progress and the legacy mute mirror', () => {
    const storage = new MemoryStorage();
    expect(writeGameProgress({ version: 1, completedStageIds: ['stage-001'], lastPlayedStageId: 'stage-001', muted: true }, storage)).toBe(true);
    expect(storage.getItem(GAME_PROGRESS_STORAGE_KEY)).toContain('stage-001');
    expect(storage.getItem(LEGACY_MUTE_STORAGE_KEY)).toBe('true');
  });

  it('continues safely when reads throw', () => {
    const storage = { getItem: () => { throw new Error('blocked'); }, setItem: () => undefined, removeItem: () => undefined };
    expect(readGameProgress(storage)).toEqual(DEFAULT_GAME_PROGRESS);
  });

  it('continues safely when writes throw', () => {
    const storage = { getItem: () => null, setItem: () => { throw new Error('full'); }, removeItem: () => undefined };
    expect(writeGameProgress(DEFAULT_GAME_PROGRESS, storage)).toBe(false);
  });

  it('clears saved progress', () => {
    const storage = new MemoryStorage();
    storage.setItem(GAME_PROGRESS_STORAGE_KEY, '{}');
    expect(clearGameProgress(storage)).toBe(true);
    expect(storage.getItem(GAME_PROGRESS_STORAGE_KEY)).toBeNull();
  });

  it('continues safely when reset is blocked', () => {
    const storage = { getItem: () => null, setItem: () => undefined, removeItem: () => { throw new Error('blocked'); } };
    expect(clearGameProgress(storage)).toBe(false);
  });
});
