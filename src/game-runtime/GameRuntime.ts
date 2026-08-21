import { AudioManager } from '../audio/AudioManager';
import { audioManifestForStage } from '../audio/gameAudioManifest';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/soundCategories';
import { GameBridge } from '../bridge/GameBridge';
import { getStageDefinition } from '../app/flow/stageCatalog';
import type { GameRuntimeModule, ManagedGameSession, PreparedStageAudio } from '../app/flow/GameRuntimeContract';
import type { ShellStageId } from '../app/flow/AppFlow';
import { PhaserGame } from '../phaser/PhaserGame';

function createSession(stageId: ShellStageId, muted: boolean, audio: PreparedStageAudio): ManagedGameSession {
  const stage = getStageDefinition(stageId);
  const settings = { ...DEFAULT_AUDIO_SETTINGS, muted };
  let bridge: GameBridge | undefined;

  try {
    bridge = new GameBridge(stage, new AudioManager(audioManifestForStage(stage.id), audio.playback, settings));
    bridge.setMuted(muted);
  } catch (error) {
    audio.destroy();
    throw error;
  }

  const activeBridge = bridge;
  const game = new PhaserGame();
  let destroyed = false;

  if (audio.unlockPromise) {
    void audio.unlockPromise
      .then(() => activeBridge.unlockAudio())
      .catch(() => false);
  }

  return {
    stageId,
    bridge: activeBridge,
    mount(parent) {
      if (destroyed) return () => undefined;
      try {
        game.mount(parent as HTMLElement, activeBridge);
      } catch (error) {
        game.destroy();
        throw error;
      }
      return () => game.destroy();
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      game.destroy();
      activeBridge.stopAudioLoops();
      activeBridge.destroy();
    },
  };
}

export const gameRuntime: GameRuntimeModule = { createSession };
