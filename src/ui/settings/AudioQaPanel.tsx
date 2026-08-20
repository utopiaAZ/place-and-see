import { useEffect, useState } from 'react';
import type { GameBridge } from '../../bridge/GameBridge';
import type { AudioDebugState } from '../../audio/AudioManager';

interface AudioQaPanelProps {
  readonly bridge: GameBridge;
}

export function AudioQaPanel({ bridge }: AudioQaPanelProps) {
  const [state, setState] = useState<AudioDebugState>(() => bridge.getAudioDebugState());
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const timer = window.setInterval(() => setState(bridge.getAudioDebugState()), 250);
    return () => window.clearInterval(timer);
  }, [bridge]);

  const play = (key: string) => {
    void bridge.playAudioForQa(key).finally(() => setState(bridge.getAudioDebugState()));
  };
  const stop = (key: string) => {
    bridge.stopAudioForQa(key);
    setState(bridge.getAudioDebugState());
  };
  const stopAll = () => {
    bridge.stopAllAudioForQa();
    setState(bridge.getAudioDebugState());
  };

  return (
    <aside className={`audio-qa${expanded ? '' : ' collapsed'}`} aria-label="Stage 1 Audio QA">
      <header>
        <strong>Audio QA</strong>
        <span>{state.unlocked ? 'unlocked' : 'locked'} · {state.muted ? 'muted' : 'audible'}</span>
        {expanded && <button type="button" onClick={stopAll}>Stop all</button>}
        <button type="button" aria-expanded={expanded} onClick={() => setExpanded((current) => !current)}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </header>
      {expanded && <>
        <p>Playing: {state.activeKeys.join(', ') || 'none'}</p>
        <p>Recent: {state.recentKeys.join(' → ') || 'none'}</p>
        <div className="audio-qa-list">
        {state.assets.map((asset) => (
          <article key={asset.key}>
            <div><strong>{asset.key}</strong> <small>{asset.sourceFile}</small></div>
            <small>
              total {asset.fullDurationMs}ms · marker {asset.startMs ?? 0}+{asset.durationMs ?? asset.fullDurationMs}ms ·
              vol {asset.volume.toFixed(2)} · {asset.loop ? 'loop' : 'one-shot'}
            </small>
            <div className="audio-qa-actions">
              <button type="button" onClick={() => play(asset.key)}>Play</button>
              <button type="button" onClick={() => stop(asset.key)}>Stop</button>
            </div>
          </article>
        ))}
        </div>
      </>}
    </aside>
  );
}
