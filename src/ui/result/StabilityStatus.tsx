import type { GoalProgress } from '../../core/types/WorldTypes';

export function StabilityStatus({ goal }: { readonly goal: GoalProgress }) {
  const percentage = Math.min(100, (goal.stableForMs / goal.requiredMs) * 100);
  const label = goal.completed ? '안정성 확인 완료!' : goal.active ? '안정성을 확인하는 중…' : '아직 목표 위치가 아닙니다';
  return (
    <section className={`panel stability ${goal.completed ? 'complete' : ''}`} aria-live="polite">
      <div className="stability-heading"><span>안정성</span><strong>{Math.round(percentage)}%</strong></div>
      <div className="progress-track"><div className="progress-value" style={{ width: `${percentage}%` }} /></div>
      <p>{label}</p>
    </section>
  );
}
