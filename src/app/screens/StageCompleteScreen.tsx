import { stageSummary, type ShellStageId } from '../flow/AppFlow';
import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';

export function StageCompleteScreen({ stageId, muted, onToggleMuted, onNext, onReplay, onStageSelect }: {
  readonly stageId: ShellStageId;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onNext: () => void;
  readonly onReplay: () => void;
  readonly onStageSelect: () => void;
}) {
  const stage = stageSummary(stageId);
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="complete-screen">
      <section className="shell-panel complete-panel" aria-labelledby="stage-complete-title">
        <span className="shell-success-mark" aria-hidden="true">✓</span>
        <h1 id="stage-complete-title">{stage.number} Complete!</h1>
        <p>{stage.mission}</p>
        <div className="shell-actions shell-actions-vertical">
          <ShellButton onClick={onNext}>Next Stage</ShellButton>
          <ShellButton onClick={onReplay} tone="coral">Replay</ShellButton>
          <ShellButton onClick={onStageSelect} tone="quiet">Stage Select</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
