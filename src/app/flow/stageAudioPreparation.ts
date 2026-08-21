import { WebAudioPlaybackBackend } from '../../audio/WebAudioPlaybackBackend';
import type { PreparedStageAudio, StageAudioPreparer } from './GameRuntimeContract';

class PreparedWebAudio implements PreparedStageAudio {
  public readonly playback = new WebAudioPlaybackBackend();
  public readonly unlockPromise: Promise<boolean> | null;
  private destroyed = false;

  public constructor(muted: boolean, unlockFromGesture: boolean) {
    this.playback.setMuted(muted);
    this.unlockPromise = unlockFromGesture ? this.playback.unlock().catch(() => false) : null;
  }

  public setMuted(muted: boolean): void {
    this.playback.setMuted(muted);
  }

  public destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.playback.destroy();
  }
}

export const prepareStageAudio: StageAudioPreparer = (muted, unlockFromGesture) => (
  new PreparedWebAudio(muted, unlockFromGesture)
);
