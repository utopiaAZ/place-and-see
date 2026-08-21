import { STAGE_SUMMARIES, type ShellStageId } from '../flow/AppFlow';
import { ShellButton } from '../../ui/shell/ShellButton';
import { StageCard } from '../../ui/shell/StageCard';
import { ShellScreen } from './ShellScreen';

export function StageSelectScreen({ completedStageIds, muted, onToggleMuted, onSelect, onHome, onResetProgress }: {
  readonly completedStageIds: readonly ShellStageId[];
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onSelect: (stageId: ShellStageId) => void;
  readonly onHome: () => void;
  readonly onResetProgress: () => void;
}) {
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="stage-select-screen">
      <section className="shell-panel wide-shell-panel" aria-labelledby="stage-select-title">
        <p className="shell-eyebrow">CHOOSE A PUZZLE</p>
        <h1 id="stage-select-title">Stage Select</h1>
        <div className="stage-card-grid">
          {STAGE_SUMMARIES.map((stage) => (
            <StageCard key={stage.id} stage={stage} completed={completedStageIds.includes(stage.id)} onSelect={() => onSelect(stage.id)} />
          ))}
        </div>
        <div className="shell-footer-actions">
          <ShellButton onClick={onHome} tone="quiet">Back to Title</ShellButton>
          <ShellButton onClick={onResetProgress} tone="quiet" className="reset-progress-button">Reset Progress</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
