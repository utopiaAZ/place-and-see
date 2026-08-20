import { useEffect, useRef, useState } from 'react';
import { GameBridge } from '../bridge/GameBridge';
import { AudioManager } from '../audio/AudioManager';
import { STAGE_001_AUDIO_MANIFEST } from '../audio/stage001AudioManifest';
import { DEFAULT_AUDIO_SETTINGS } from '../audio/soundCategories';
import { WebAudioPlaybackBackend } from '../audio/WebAudioPlaybackBackend';
import { stage001 } from '../content/stages';
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
  try {
    const value = localStorage.getItem(MUTE_STORAGE_KEY);
    return value === 'true' ? true : value === 'false' ? false : false;
  } catch {
    return false;
  }
}

export function GamePage() {
  const [runtime] = useState(() => {
    const initialMuted = readStoredMute();
    const settings = { ...DEFAULT_AUDIO_SETTINGS, muted: initialMuted };
    const audioManager = new AudioManager(STAGE_001_AUDIO_MANIFEST, new WebAudioPlaybackBackend(), settings);
    const bridge = new GameBridge(stage001, audioManager);
    bridge.setMuted(initialMuted);
    return { bridge, initialMuted };
  });
  const bridge = runtime.bridge;
  const [muted, setMuted] = useState(runtime.initialMuted);
  const gameState = useGameState(bridge);
  const canvasHost = useRef<HTMLDivElement>(null);
  const bridgeLifecycle = useRef({ generation: 0 });

  useEffect(() => {
    const host = canvasHost.current;
    if (!host) return;
    const phaserGame = new PhaserGame();
    phaserGame.mount(host, bridge);
    return () => phaserGame.destroy();
  }, [bridge]);

  useEffect(() => {
    let disposed = false;
    const removeListeners = () => {
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
      window.removeEventListener('touchstart', unlock);
    };
    const unlock = () => {
      void bridge.unlockAudio().then((unlocked) => {
        if (unlocked && !disposed) removeListeners();
      });
    };
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock);
    window.addEventListener('touchstart', unlock, { passive: true });
    return () => {
      disposed = true;
      removeListeners();
    };
  }, [bridge]);

  useEffect(() => {
    const lifecycle = bridgeLifecycle.current;
    const generation = ++lifecycle.generation;
    return () => {
      queueMicrotask(() => {
        if (lifecycle.generation === generation) bridge.destroy();
      });
    };
  }, [bridge]);

  const reset = () => bridge.reset();
  const toggleMuted = () => {
    const nextMuted = !muted;
    setMuted(nextMuted);
    bridge.setMuted(nextMuted);
    try { localStorage.setItem(MUTE_STORAGE_KEY, String(nextMuted)); } catch { /* Storage is optional. */ }
  };
  const bottleOnDesk = gameState.objects.bottle.zoneId === 'desk-surface';
  const audioQaEnabled = import.meta.env.DEV && new URLSearchParams(window.location.search).get('audioDebug') === '1';

  return (
    <main className="game-shell">
      <section className="canvas-panel" aria-label="Place & See Stage 1 게임 화면">
        <div ref={canvasHost} className="phaser-host" />
        <div className="game-overlay">
          <div className="mission-slot"><MissionCard stage={stage001} /></div>
          <StatusMessage status={gameState.status} />
          <div className="controls-slot"><GameControls onReset={reset} muted={muted} onToggleMuted={toggleMuted} /></div>
          <div className="stability-slot"><StabilityStatus goal={gameState.goal} visible={bottleOnDesk} /></div>
          {gameState.progressState === 'completed' && <SuccessPanel onReplay={reset} />}
          {audioQaEnabled && <AudioQaPanel bridge={bridge} />}
        </div>
      </section>
    </main>
  );
}
