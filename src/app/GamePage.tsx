import { useEffect, useRef, useState } from 'react';
import { GameBridge } from '../bridge/GameBridge';
import { stage001 } from '../content/stages';
import { PhaserGame } from '../phaser/PhaserGame';
import { useGameState } from '../store/useGameState';
import { GameControls } from '../ui/controls/GameControls';
import { MissionCard } from '../ui/mission/MissionCard';
import { StabilityStatus } from '../ui/result/StabilityStatus';

export function GamePage() {
  const [bridge] = useState(() => new GameBridge(stage001));
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
    const lifecycle = bridgeLifecycle.current;
    const generation = ++lifecycle.generation;
    return () => {
      // StrictMode immediately remounts effects in development. Deferring disposal
      // lets that remount claim the Bridge before a real component removal destroys it.
      queueMicrotask(() => {
        if (lifecycle.generation === generation) bridge.destroy();
      });
    };
  }, [bridge]);

  return (
    <main className="game-shell">
      <aside className="sidebar">
        <MissionCard stage={stage001} />
        <StabilityStatus goal={gameState.goal} />
        <GameControls onReset={() => bridge.reset()} />
        <p className="prototype-note">현재 화면의 도형은 입력과 구조 검증용 임시 그래픽입니다.</p>
      </aside>
      <section className="canvas-panel" aria-label="Place & See 게임 화면">
        <div ref={canvasHost} className="phaser-host" />
      </section>
    </main>
  );
}
