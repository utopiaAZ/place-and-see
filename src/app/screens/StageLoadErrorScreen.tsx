import { stageSummary, type ShellStageId } from '../flow/AppFlow';
import { ShellButton } from '../../ui/shell/ShellButton';
import { ShellScreen } from './ShellScreen';

export function StageLoadErrorScreen({ stageId, muted, onToggleMuted, onRetry, onStageSelect, onHome }: {
  readonly stageId: ShellStageId;
  readonly muted: boolean;
  readonly onToggleMuted: () => void;
  readonly onRetry: () => void;
  readonly onStageSelect: () => void;
  readonly onHome: () => void;
}) {
  const stage = stageSummary(stageId);
  return (
    <ShellScreen muted={muted} onToggleMuted={onToggleMuted} className="stage-load-error-screen">
      <section className="shell-panel load-panel" aria-labelledby="stage-load-error-title">
        <p className="shell-eyebrow">{stage.number}</p>
        <h1 id="stage-load-error-title">Stage를 불러오지 못했어요.</h1>
        <p role="alert">잠시 후 다시 시도해 주세요.</p>
        <div className="shell-actions">
          <ShellButton onClick={onRetry}>Retry</ShellButton>
          <ShellButton onClick={onStageSelect} tone="secondary">Stage Select</ShellButton>
          <ShellButton onClick={onHome} tone="quiet">Back to Title</ShellButton>
        </div>
      </section>
    </ShellScreen>
  );
}
