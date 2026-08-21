import type { ShellStageId } from './AppFlow';

export interface SessionBridge {
  setMuted(muted: boolean): void;
  unlockAudio(): Promise<boolean>;
  stopAudioLoops(): void;
  destroy(): void;
}

export interface ManagedGameSession<TBridge extends SessionBridge = SessionBridge> {
  readonly stageId: ShellStageId;
  readonly bridge: TBridge;
}

export type GameBridgeFactory<TBridge extends SessionBridge = SessionBridge> = (stageId: ShellStageId, muted: boolean) => TBridge;

export class GameSessionManager<TBridge extends SessionBridge = SessionBridge> {
  private current: ManagedGameSession<TBridge> | null = null;

  public constructor(private readonly createBridge: GameBridgeFactory<TBridge>) {}

  public start(stageId: ShellStageId, muted: boolean, unlockFromGesture: boolean): ManagedGameSession<TBridge> {
    this.destroy();
    const bridge = this.createBridge(stageId, muted);
    bridge.setMuted(muted);
    if (unlockFromGesture) void bridge.unlockAudio().catch(() => false);
    this.current = { stageId, bridge };
    return this.current;
  }

  public getCurrent(): ManagedGameSession<TBridge> | null {
    return this.current;
  }

  public setMuted(muted: boolean): void {
    this.current?.bridge.setMuted(muted);
  }

  public destroy(session: ManagedGameSession<TBridge> | null = this.current): void {
    if (!session || this.current !== session) return;
    session.bridge.stopAudioLoops();
    session.bridge.destroy();
    this.current = null;
  }
}
