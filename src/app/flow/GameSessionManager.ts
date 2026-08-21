import type { ShellStageId } from './AppFlow';
import type { GameRuntimeLoader, ManagedGameSession, PreparedStageAudio, RuntimeBridge, StageAudioPreparer } from './GameRuntimeContract';

interface PendingSession<TBridge extends RuntimeBridge> {
  readonly generation: number;
  readonly stageId: ShellStageId;
  readonly audio: PreparedStageAudio;
  readonly promise: Promise<ManagedGameSession<TBridge> | null>;
}

export class GameSessionManager<TBridge extends RuntimeBridge = RuntimeBridge> {
  private current: ManagedGameSession<TBridge> | null = null;
  private pending: PendingSession<TBridge> | null = null;
  private generation = 0;

  public constructor(
    private readonly loadRuntime: GameRuntimeLoader<TBridge>,
    private readonly prepareAudio: StageAudioPreparer,
  ) {}

  public start(stageId: ShellStageId, muted: boolean, unlockFromGesture: boolean): Promise<ManagedGameSession<TBridge> | null> {
    if (this.pending?.stageId === stageId) return this.pending.promise;
    this.destroy();

    const generation = ++this.generation;
    const audio = this.prepareAudio(muted, unlockFromGesture);
    const promise = this.createSession(generation, stageId, muted, audio);
    this.pending = { generation, stageId, audio, promise };
    promise.then(
      () => { if (this.pending?.generation === generation) this.pending = null; },
      () => { if (this.pending?.generation === generation) this.pending = null; },
    );
    return promise;
  }

  public getCurrent(): ManagedGameSession<TBridge> | null {
    return this.current;
  }

  public setMuted(muted: boolean): void {
    this.pending?.audio.setMuted(muted);
    this.current?.bridge.setMuted(muted);
  }

  public destroy(session?: ManagedGameSession<TBridge>): void {
    if (session) {
      if (this.current !== session) return;
      this.current = null;
      session.destroy();
      return;
    }

    this.generation += 1;
    this.pending?.audio.destroy();
    this.pending = null;
    const current = this.current;
    this.current = null;
    current?.destroy();
  }

  private async createSession(
    generation: number,
    stageId: ShellStageId,
    muted: boolean,
    audio: PreparedStageAudio,
  ): Promise<ManagedGameSession<TBridge> | null> {
    try {
      const runtime = await this.loadRuntime();
      if (generation !== this.generation) {
        audio.destroy();
        return null;
      }
      const session = await runtime.createSession(stageId, muted, audio);
      if (generation !== this.generation) {
        session.destroy();
        return null;
      }
      this.current?.destroy();
      this.current = session;
      return session;
    } catch (error) {
      audio.destroy();
      throw error;
    }
  }
}
