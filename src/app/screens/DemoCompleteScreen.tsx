import { STAGE_SUMMARIES, type ShellStageId } from '../flow/AppFlow';
import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';

export function DemoCompleteScreen({ completedStageIds, muted, onToggleMuted, onReplay, onStageSelect, onCredits, onHome }: {
  readonly completedStageIds: readonly ShellStageId[];
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onReplay: () => void;
  readonly onStageSelect: () => void;
  readonly onCredits: () => void;
  readonly onHome: () => void;
}) {
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="complete-screen">
      <section className="shell-panel complete-panel demo-complete-panel" aria-labelledby="demo-complete-title">
        <span className="shell-success-mark" aria-hidden="true">✓</span>
        <h1 id="demo-complete-title">Demo Complete!</h1>
        <p>모든 퍼즐을 해결했습니다.</p>
        <ul className="demo-stage-list">
          {STAGE_SUMMARIES.map((stage) => <li key={stage.id}>{stage.number} {completedStageIds.includes(stage.id) ? '✓' : '—'}</li>)}
        </ul>
        <div className="shell-actions shell-actions-vertical">
          <ShellButton onClick={onReplay}>Replay from Stage 1</ShellButton>
          <ShellButton onClick={onStageSelect} tone="secondary">Stage Select</ShellButton>
          <ShellButton onClick={onCredits} tone="coral">Credits</ShellButton>
          <ShellButton onClick={onHome} tone="quiet">Back to Title</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
