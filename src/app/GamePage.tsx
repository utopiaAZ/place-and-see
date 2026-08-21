import { useCallback, useEffect, useReducer, useRef, useState } from 'react';
import { AudioManager } from '../audio/AudioManager';
import { audioManifestForStage } from '../audio/gameAudioManifest';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/soundCategories';
import { WebAudioPlaybackBackend } from '../audio/WebAudioPlaybackBackend';
import { GameBridge } from '../bridge/GameBridge';
import type { GameEvent } from '../core/events/GameEvent';
import { PhaserGame } from '../phaser/PhaserGame';
import { useGameState } from '../store/useGameState';
import { GameControls } from '../ui/controls/GameControls';
import { MissionCard } from '../ui/mission/MissionCard';
import { StabilityStatus } from '../ui/result/StabilityStatus';
import { StatusMessage } from '../ui/result/StatusMessage';
import { AudioQaPanel } from '../ui/settings/AudioQaPanel';
import { createInitialFlowState, appFlowReducer, type AppFlowAction } from './flow/appFlowReducer';
import { GameSessionManager, type ManagedGameSession } from './flow/GameSessionManager';
import type { ShellStageId } from './flow/AppFlow';
import { getStageDefinition } from './flow/stageCatalog';
import { hasDebugQuery, parseStageQuery } from './flow/stageQuery';
import { readGameProgress, writeGameProgress } from './storage/gameProgressStorage';
import { CreditsScreen } from './screens/CreditsScreen';
import { DemoCompleteScreen } from './screens/DemoCompleteScreen';
import { HomeScreen } from './screens/HomeScreen';
import { StageCompleteScreen } from './screens/StageCompleteScreen';
import { StageIntroScreen } from './screens/StageIntroScreen';
import { StageSelectScreen } from './screens/StageSelectScreen';

interface InitialAppState {
  readonly progress: ReturnType<typeof readGameProgress>;
  readonly directStageId: ShellStageId | null;
}

export function GamePage() {
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
  const [sessionManager] = useState(() => new GameSessionManager<GameBridge>((stageId, isMuted) => {
    const stage = getStageDefinition(stageId);
    const settings = { ...DEFAULT_AUDIO_SETTINGS, muted: isMuted };
    return new GameBridge(stage, new AudioManager(audioManifestForStage(stage.id), new WebAudioPlaybackBackend(), settings));
  }));
  const [session, setSession] = useState<ManagedGameSession<GameBridge> | null>(null);
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
    if (flow.screen !== 'playing' || !flow.selectedStageId || session) return;
    const active = sessionManager.getCurrent() ?? sessionManager.start(flow.selectedStageId, muted, false);
    setSession(active);
  }, [flow.screen, flow.selectedStageId, muted, session, sessionManager]);

  useEffect(() => {
    const lifecycleState = lifecycle.current;
    const generation = ++lifecycleState.generation;
    return () => queueMicrotask(() => {
      if (lifecycleState.generation === generation) sessionManager.destroy();
    });
  }, [sessionManager]);

  const releaseSession = useCallback(() => {
    const active = sessionManager.getCurrent();
    if (!active) return;
    active.bridge.stopAudioLoops();
    setSession(null);
    queueMicrotask(() => sessionManager.destroy(active));
  }, [sessionManager]);

  const leavePlaying = useCallback((action: AppFlowAction) => {
    releaseSession();
    dispatch(action);
  }, [releaseSession]);

  const startStage = () => {
    if (!flow.selectedStageId) return;
    const active = sessionManager.start(flow.selectedStageId, muted, true);
    setSession(active);
    dispatch({ type: 'START_STAGE' });
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
        bridge={session.bridge}
        stageId={selectedStageId}
        muted={muted}
        onToggleMuted={toggleMuted}
        onComplete={(stageId) => leavePlaying({ type: 'COMPLETE_STAGE', stageId })}
        onHome={() => leavePlaying({ type: 'GO_HOME' })}
        onStageSelect={() => leavePlaying({ type: 'SHOW_STAGE_SELECT' })}
      />
    );
  }
  return null;
}

function StageSession({ bridge, stageId, muted, onToggleMuted, onComplete, onHome, onStageSelect }: {
  readonly bridge: GameBridge;
  readonly stageId: ShellStageId;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onComplete: (stageId: ShellStageId) => void;
  readonly onHome: () => void;
  readonly onStageSelect: () => void;
}) {
  const stage = bridge.getStage();
  const gameState = useGameState(bridge);
  const canvasHost = useRef<HTMLDivElement>(null);
  const completionHandled = useRef(false);

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    const game = new PhaserGame();
    game.mount(host, bridge);
    return () => game.destroy();
  }, [bridge]);

  useEffect(() => {
    let disposed = false;
    const remove = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    const unlock = () => { void bridge.unlockAudio().then((ok) => { if (ok && !disposed) remove(); }).catch(() => undefined); };
    window.addEventListener('pointerdown', unlock, { passive: true });
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
