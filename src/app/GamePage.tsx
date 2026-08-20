import { useEffect, useRef, useState } from 'react';
import { AudioManager } from '../audio/AudioManager';
import { audioManifestForStage } from '../audio/gameAudioManifest';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/soundCategories';
import { WebAudioPlaybackBackend } from '../audio/WebAudioPlaybackBackend';
import { GameBridge } from '../bridge/GameBridge';
import type { StageDefinition } from '../content/schema/StageDefinition';
import { stage001, stage002 } from '../content/stages';
import { PhaserGame } from '../phaser/PhaserGame';
import { useGameState } from '../store/useGameState';
import { GameControls } from '../ui/controls/GameControls';
import { MissionCard } from '../ui/mission/MissionCard';
import { StabilityStatus } from '../ui/result/StabilityStatus';
import { StatusMessage } from '../ui/result/StatusMessage';
import { SuccessPanel } from '../ui/result/SuccessPanel';
import { AudioQaPanel } from '../ui/settings/AudioQaPanel';

const MUTE_STORAGE_KEY = 'place-and-see.audio-muted';

function readStoredMute(): boolean {
  try { return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'; } catch { return false; }
}

export function GamePage() {
  const initialStage = new URLSearchParams(window.location.search).get('stage') === '002' ? 'stage-002' : 'stage-001';
  const [stageId, setStageId] = useState<'stage-001' | 'stage-002'>(initialStage);
  const [muted, setMuted] = useState(readStoredMute);
  const stage = stageId === 'stage-002' ? stage002 : stage001;
  return <StageSession key={stageId} stage={stage} muted={muted} onMutedChange={setMuted} onSwitchStage={setStageId} />;
}

function StageSession({ stage, muted, onMutedChange, onSwitchStage }: {
  readonly stage: StageDefinition;
  readonly muted: boolean;
  readonly onMutedChange: (muted: boolean) => void;
  readonly onSwitchStage: (stage: 'stage-001' | 'stage-002') => void;
}) {
  const [bridge] = useState(() => {
    const settings = { ...DEFAULT_AUDIO_SETTINGS, muted };
    return new GameBridge(stage, new AudioManager(audioManifestForStage(stage.id), new WebAudioPlaybackBackend(), settings));
  });
  const gameState = useGameState(bridge);
  const canvasHost = useRef<HTMLDivElement>(null);
  const lifecycle = useRef({ generation: 0 });

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
    const unlock = () => { void bridge.unlockAudio().then((ok) => { if (ok && !disposed) remove(); }); };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
    return () => { disposed = true; remove(); };
  }, [bridge]);

  useEffect(() => { bridge.setMuted(muted); }, [bridge, muted]);
  useEffect(() => {
    const lifecycleState = lifecycle.current;
    const generation = ++lifecycleState.generation;
    return () => queueMicrotask(() => { if (lifecycleState.generation === generation) bridge.destroy(); });
  }, [bridge]);

  const toggleMuted = () => {
    const next = !muted;
    onMutedChange(next);
    bridge.setMuted(next);
    try { localStorage.setItem(MUTE_STORAGE_KEY, String(next)); } catch { /* Storage is optional. */ }
  };
  const goalObject = gameState.objects[stage.goal.objectId];
  const goalVisible = goalObject?.zoneId === stage.goal.zoneId || gameState.stageTwo?.paperState === 'fluttering';
  const qa = import.meta.env.DEV && new URLSearchParams(window.location.search).get('audioDebug') === '1';
  const isStageTwo = stage.id === 'stage-002';

  return (
    <main className="game-shell">
      <section className="canvas-panel" aria-label={`Place & See ${stage.id} 게임 화면`}>
        <div ref={canvasHost} className="phaser-host" />
        <div className="game-overlay">
          <div className="mission-slot"><MissionCard stage={stage} /></div>
          <StatusMessage status={gameState.status} stageId={stage.id} />
          <div className="controls-slot"><GameControls onReset={() => bridge.reset()} muted={muted} onToggleMuted={toggleMuted} /></div>
          <div className="stability-slot"><StabilityStatus goal={gameState.goal} visible={goalVisible} subject={isStageTwo ? '서류' : '물병'} /></div>
          {gameState.progressState === 'completed' && (
            <SuccessPanel
              onReplay={() => bridge.reset()}
              title={isStageTwo ? 'Demo Complete' : '미션 완료!'}
              message={isStageTwo ? '서류가 안전하게 놓였습니다!' : '물병이 안전하게 유지되고 있어요.'}
              replayLabel={isStageTwo ? 'Restart Stage' : '다시 플레이'}
              secondaryAction={isStageTwo
                ? { label: 'Back to Stage 1', onClick: () => onSwitchStage('stage-001') }
                : { label: 'Next Stage', onClick: () => onSwitchStage('stage-002') }}
            />
          )}
          {qa && <AudioQaPanel bridge={bridge} />}
        </div>
      </section>
    </main>
  );
}
