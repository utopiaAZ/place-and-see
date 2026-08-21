import type { StageSummary } from '../../app/flow/AppFlow';
import { ShellButton } from './ShellButton';

export function StageCard({ stage, completed, onSelect }: {
  readonly stage: StageSummary;
  readonly completed: boolean;
  readonly onSelect: () => void;
}) {
  return (
    <article className="stage-card">
      <span className="stage-card-number">{stage.number}</span>
      <h2>{stage.englishTitle}</h2>
      <p>{stage.description}</p>
      <strong className="stage-card-status">{completed ? '✓ Completed' : 'Not completed'}</strong>
      <ShellButton onClick={onSelect} tone={completed ? 'secondary' : 'primary'}>
        {completed ? 'Replay' : 'Play'}
      </ShellButton>
    </article>
  );
}
