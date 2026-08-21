import { stageSummary, type ShellStageId } from '../flow/AppFlow';
import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';

export function StageLoadingScreen({ stageId, muted, onToggleMuted, onStageSelect, onHome }: {
  readonly stageId: ShellStageId;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onStageSelect: () => void;
  readonly onHome: () => void;
}) {
  const stage = stageSummary(stageId);
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="stage-loading-screen">
      <section className="shell-panel load-panel" aria-labelledby="stage-loading-title" aria-busy="true">
        <p className="shell-eyebrow">{stage.number}</p>
        <h1 id="stage-loading-title">Loading Stage…</h1>
        <p className="load-status" role="status" aria-live="polite">게임을 준비하고 있습니다.</p>
        <div className="shell-actions">
          <ShellButton onClick={onStageSelect} tone="quiet">Stage Select</ShellButton>
          <ShellButton onClick={onHome} tone="quiet">Back to Title</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
