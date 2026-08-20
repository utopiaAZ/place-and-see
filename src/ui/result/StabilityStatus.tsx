import type { GoalProgress } from '../../core/types/WorldTypes';

export function StabilityStatus({ goal, visible }: { readonly goal: GoalProgress; readonly visible: boolean }) {
  if (!visible) return null;
  const percentage = Math.min(100, (goal.stableForMs / goal.requiredMs) * 100);
  const label = goal.completed ? '안정성 확인 완료!' : '물병이 안정적인지 확인하는 중…';
  return (
    <section className={`panel stability ${goal.completed ? 'complete' : ''}`} aria-live="polite">
      <div className="stability-heading"><span>안정성</span><strong>{Math.round(percentage)}%</strong></div>
      <div className="progress-track"><div className="progress-value" style={{ width: `${percentage}%` }} /></div>
      <p>{label}</p>
    </section>
  );
}
