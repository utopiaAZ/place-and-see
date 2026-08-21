interface GameControlsProps {
  readonly onReset: () => void;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onHome?: () => void;
  readonly onStageSelect?: () => void;
}

export function GameControls({ onReset, muted, onToggleMuted, onHome, onStageSelect }: GameControlsProps) {
  return (
    <section className="panel controls">
      <button type="button" onClick={onReset}>처음부터 다시</button>
      {onStageSelect && <button type="button" onClick={onStageSelect}>Stage Select</button>}
      {onHome && <button type="button" onClick={onHome}>Title</button>}
      <button
        type="button"
        className="audio-button"
        onClick={onToggleMuted}
        aria-pressed={!muted}
        aria-label={muted ? '사운드 켜기' : '사운드 끄기'}
      >
        {muted ? '🔇 Sound Off' : '🔊 Sound On'}
      </button>
    </section>
  );
}
