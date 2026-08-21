import { stageSummary, type ShellStageId } from '../flow/AppFlow';
import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';

export function StageIntroScreen({ stageId, muted, onToggleMuted, onStart, onBack }: {
  readonly stageId: ShellStageId;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onStart: () => void;
  readonly onBack: () => void;
}) {
  const stage = stageSummary(stageId);
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="stage-intro-screen">
      <section className="shell-panel intro-panel" aria-labelledby="stage-intro-title">
        <p className="shell-eyebrow">{stage.number}</p>
        <h1 id="stage-intro-title">{stage.mission}</h1>
        <p>Drag objects and observe what happens.</p>
        <div className="shell-actions">
          <ShellButton onClick={onStart} autoFocus>Start Stage</ShellButton>
          <ShellButton onClick={onBack} tone="quiet">Stage Select</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
