import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import type { GameEvent } from '../core/events/GameEvent';
import { useGameState } from '../store/useGameState';
import { GameControls } from '../ui/controls/GameControls';
import { MissionCard } from '../ui/mission/MissionCard';
import { StabilityStatus } from '../ui/result/StabilityStatus';
import { StatusMessage } from '../ui/result/StatusMessage';
import { AudioQaPanel } from '../ui/settings/AudioQaPanel';
import { createInitialFlowState, appFlowReducer, type AppFlowAction } from './flow/appFlowReducer';
import { GameSessionManager } from './flow/GameSessionManager';
import type { GameRuntimeLoader, ManagedGameSession, StageAudioPreparer } from './flow/GameRuntimeContract';
import { GameRuntimeImportError, loadGameRuntime } from './flow/loadGameRuntime';
import { prepareStageAudio } from './flow/stageAudioPreparation';
import type { ShellStageId } from './flow/AppFlow';
import { hasDebugQuery, parseStageQuery } from './flow/stageQuery';
import { readGameProgress, writeGameProgress } from './storage/gameProgressStorage';
import { CreditsScreen } from './screens/CreditsScreen';
import { DemoCompleteScreen } from './screens/DemoCompleteScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StageCompleteScreen } from './screens/StageCompleteScreen';
import { StageIntroScreen } from './screens/StageIntroScreen';
import { StageLoadErrorScreen } from './screens/StageLoadErrorScreen';
import { StageLoadingScreen } from './screens/StageLoadingScreen';
import { StageSelectScreen } from './screens/StageSelectScreen';

interface InitialAppState {
  readonly progress: ReturnType<typeof readGameProgress>;
  readonly directStageId: ShellStageId | null;
}

export function GamePage({ runtimeLoader = loadGameRuntime, audioPreparer = prepareStageAudio }: {
  readonly runtimeLoader?: GameRuntimeLoader;
  readonly audioPreparer?: StageAudioPreparer;
} = {}) {
  const [initial] = useState<InitialAppState>(() => {
    const progress = readGameProgress();
    const query = parseStageQuery(window.location.search);
    return { progress, directStageId: query.kind === 'valid' ? query.stageId : null };
  });
  const [flow, dispatch] = useReducer(
    appFlowReducer,
    createInitialFlowState(initial.progress.completedStageIds, initial.progress.lastPlayedStageId, initial.directStageId),
  );
  const [muted, setMuted] = useState(initial.progress.muted);
  const [sessionManager] = useState(() => new GameSessionManager(runtimeLoader, audioPreparer));
  const [session, setSession] = useState<ManagedGameSession | null>(null);
  const pendingLaunch = useRef<Promise<ManagedGameSession | null> | null>(null);
  const lastLoadError = useRef<unknown>(null);
  const directLaunchStarted = useRef(false);
  const lifecycle = useRef({ generation: 0 });

  useEffect(() => {
    writeGameProgress({
      version: 1,
      completedStageIds: flow.completedStageIds,
      lastPlayedStageId: flow.lastPlayedStageId,
      muted,
    });
  }, [flow.completedStageIds, flow.lastPlayedStageId, muted]);

  useEffect(() => {
    const lifecycleState = lifecycle.current;
    const generation = ++lifecycleState.generation;
    return () => queueMicrotask(() => {
      if (lifecycleState.generation === generation) sessionManager.destroy();
    });
  }, [sessionManager]);

  const beginStageLoad = useCallback((stageId: ShellStageId, unlockFromGesture: boolean): boolean => {
    if (pendingLaunch.current) return false;
    let request: Promise<ManagedGameSession | null>;
    try {
      request = sessionManager.start(stageId, muted, unlockFromGesture);
    } catch (error) {
      lastLoadError.current = error;
      if (import.meta.env.DEV) console.error('[Place & See] Stage runtime preparation failed.', error);
      dispatch({ type: 'STAGE_LOAD_FAILED', stageId });
      return false;
    }
    pendingLaunch.current = request;
    void request.then(
      (active) => {
        if (pendingLaunch.current !== request || !active) return;
        pendingLaunch.current = null;
        lastLoadError.current = null;
        setSession(active);
        dispatch({ type: 'STAGE_LOAD_SUCCEEDED', stageId });
      },
      (error: unknown) => {
        if (pendingLaunch.current !== request) return;
        pendingLaunch.current = null;
        lastLoadError.current = error;
        setSession(null);
        if (import.meta.env.DEV) console.error('[Place & See] Stage runtime failed to load.', error);
        dispatch({ type: 'STAGE_LOAD_FAILED', stageId });
      },
    );
    return true;
  }, [muted, sessionManager]);

  useEffect(() => {
    if (!initial.directStageId || directLaunchStarted.current || flow.screen !== 'stage-loading') return;
    directLaunchStarted.current = true;
    beginStageLoad(initial.directStageId, false);
  }, [beginStageLoad, flow.screen, initial.directStageId]);

  const releaseSession = useCallback(() => {
    const active = sessionManager.getCurrent();
    pendingLaunch.current = null;
    if (!active) {
      sessionManager.destroy();
      setSession(null);
      return;
    }
    active.bridge.stopAudioLoops();
    setSession(null);
    queueMicrotask(() => sessionManager.destroy(active));
  }, [sessionManager]);

  const leavePlaying = useCallback((action: AppFlowAction) => {
    releaseSession();
    dispatch(action);
  }, [releaseSession]);

  const handleRuntimeError = useCallback((error: unknown) => {
    const stageId = sessionManager.getCurrent()?.stageId;
    if (!stageId) return;
    if (import.meta.env.DEV) console.error('[Place & See] Stage runtime mount failed.', error);
    releaseSession();
    dispatch({ type: 'STAGE_LOAD_FAILED', stageId });
  }, [releaseSession, sessionManager]);

  const startStage = () => {
    if (!flow.selectedStageId) return;
    if (beginStageLoad(flow.selectedStageId, true)) dispatch({ type: 'START_STAGE' });
  };

  const retryStage = () => {
    if (!flow.selectedStageId) return;
    if (lastLoadError.current instanceof GameRuntimeImportError) {
      const retryUrl = new URL(window.location.href);
      retryUrl.searchParams.set('stage', flow.selectedStageId.slice(-3));
      window.location.assign(retryUrl);
      return;
    }
    if (beginStageLoad(flow.selectedStageId, true)) dispatch({ type: 'RETRY_STAGE' });
  };

  const cancelLoadAndDispatch = (action: AppFlowAction) => {
    pendingLaunch.current = null;
    sessionManager.destroy();
    setSession(null);
    dispatch(action);
  };

  const toggleMuted = () => {
    setMuted((current) => {
      const next = !current;
      sessionManager.setMuted(next);
      return next;
    });
  };

  const resetProgress = () => {
    if (!window.confirm('완료한 Stage 기록을 초기화할까요? 사운드 설정은 유지됩니다.')) return;
    dispatch({ type: 'RESET_PROGRESS' });
  };

  const selectedStageId = flow.selectedStageId;
  if (flow.screen === 'home') {
    return <HomeScreen muted={muted} onToggleMuted={toggleMuted} onPlay={() => dispatch({ type: 'PLAY' })} onStageSelect={() => dispatch({ type: 'SHOW_STAGE_SELECT' })} onCredits={() => dispatch({ type: 'SHOW_CREDITS' })} />;
  }
  if (flow.screen === 'stage-select') {
    return <StageSelectScreen completedStageIds={flow.completedStageIds} muted={muted} onToggleMuted={toggleMuted} onSelect={(stageId) => dispatch({ type: 'SELECT_STAGE', stageId })} onHome={() => dispatch({ type: 'GO_HOME' })} onResetProgress={resetProgress} />;
  }
  if (flow.screen === 'credits') {
    return <CreditsScreen muted={muted} onToggleMuted={toggleMuted} onHome={() => dispatch({ type: 'GO_HOME' })} onResetProgress={resetProgress} />;
  }
  if (flow.screen === 'stage-intro' && selectedStageId) {
    return <StageIntroScreen stageId={selectedStageId} muted={muted} onToggleMuted={toggleMuted} onStart={startStage} onBack={() => dispatch({ type: 'SHOW_STAGE_SELECT' })} />;
  }
  if (flow.screen === 'stage-loading' && selectedStageId) {
    return <StageLoadingScreen stageId={selectedStageId} muted={muted} onToggleMuted={toggleMuted} onStageSelect={() => cancelLoadAndDispatch({ type: 'SHOW_STAGE_SELECT' })} onHome={() => cancelLoadAndDispatch({ type: 'GO_HOME' })} />;
  }
  if (flow.screen === 'stage-load-error' && selectedStageId) {
    return <StageLoadErrorScreen stageId={selectedStageId} muted={muted} onToggleMuted={toggleMuted} onRetry={retryStage} onStageSelect={() => cancelLoadAndDispatch({ type: 'SHOW_STAGE_SELECT' })} onHome={() => cancelLoadAndDispatch({ type: 'GO_HOME' })} />;
  }
  if (flow.screen === 'stage-complete' && selectedStageId) {
    return <StageCompleteScreen stageId={selectedStageId} muted={muted} onToggleMuted={toggleMuted} onNext={() => dispatch({ type: 'NEXT_STAGE' })} onReplay={() => dispatch({ type: 'REPLAY_STAGE' })} onStageSelect={() => dispatch({ type: 'SHOW_STAGE_SELECT' })} />;
  }
  if (flow.screen === 'demo-complete') {
    return <DemoCompleteScreen completedStageIds={flow.completedStageIds} muted={muted} onToggleMuted={toggleMuted} onReplay={() => dispatch({ type: 'SELECT_STAGE', stageId: 'stage-001' })} onStageSelect={() => dispatch({ type: 'SHOW_STAGE_SELECT' })} onCredits={() => dispatch({ type: 'SHOW_CREDITS' })} onHome={() => dispatch({ type: 'GO_HOME' })} />;
  }
  if (flow.screen === 'playing' && selectedStageId && session) {
    return (
      <StageSession
        key={`${session.stageId}-${session.bridge.getStage().id}`}
        session={session}
        stageId={selectedStageId}
        muted={muted}
        onToggleMuted={toggleMuted}
        onComplete={(stageId) => leavePlaying({ type: 'COMPLETE_STAGE', stageId })}
        onHome={() => leavePlaying({ type: 'GO_HOME' })}
        onStageSelect={() => leavePlaying({ type: 'SHOW_STAGE_SELECT' })}
        onRuntimeError={handleRuntimeError}
      />
    );
  }
  return null;
}

function StageSession({ session, stageId, muted, onToggleMuted, onComplete, onHome, onStageSelect, onRuntimeError }: {
  readonly session: ManagedGameSession;
  readonly stageId: ShellStageId;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onComplete: (stageId: ShellStageId) => void;
  readonly onHome: () => void;
  readonly onStageSelect: () => void;
  readonly onRuntimeError: (error: unknown) => void;
}) {
  const bridge = session.bridge;
  const stage = bridge.getStage();
  const gameState = useGameState(bridge);
  const canvasHost = useRef<HTMLDivElement>(null);
  const completionHandled = useRef(false);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    try {
      return session.mount(host);
    } catch (error) {
      onRuntimeError(error);
      return undefined;
    }
  }, [onRuntimeError, session]);

  useEffect(() => {
    let disposed = false;
    const remove = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('click', unlock, true);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    const unlock = () => { void bridge.unlockAudio().then((ok) => { if (ok && !disposed) remove(); }).catch(() => undefined); };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('click', unlock, { capture: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
    return () => { disposed = true; remove(); };
  }, [bridge]);

  useEffect(() => bridge.subscribe((event: GameEvent) => {
    if (event.type !== 'STAGE_COMPLETED' || completionHandled.current) return;
    completionHandled.current = true;
    bridge.stopAudioLoops();
    onComplete(stageId);
  }), [bridge, onComplete, stageId]);

  useEffect(() => { bridge.setMuted(muted); }, [bridge, muted]);

  const goalObject = gameState.objects[stage.goal.objectId];
  const goalVisible = goalObject?.zoneId === stage.goal.zoneId || gameState.stageTwo?.paperState === 'fluttering';
  const qa = import.meta.env.DEV && hasDebugQuery(window.location.search, 'audioDebug');
  const isStageTwo = stageId === 'stage-002';
  const isStageThree = stageId === 'stage-003';

  return (
    <main className="game-shell">
      <section className="canvas-panel" aria-label={`Place & See ${stage.id} 게임 화면`}>
        <div ref={canvasHost} className="phaser-host" />
        <div className="game-overlay">
          <div className="mission-slot"><MissionCard stage={stage} /></div>
          <StatusMessage status={gameState.status} stageId={stage.id} />
          <div className="controls-slot">
            <GameControls onReset={() => bridge.reset()} muted={muted} onToggleMuted={onToggleMuted} onHome={onHome} onStageSelect={onStageSelect} />
          </div>
          <div className="stability-slot"><StabilityStatus goal={gameState.goal} visible={goalVisible} subject={isStageThree ? '케이크' : isStageTwo ? '서류' : '물병'} /></div>
          {qa && <AudioQaPanel bridge={bridge} />}
        </div>
      </section>
    </main>
  );
}
