import type { StageDefinition } from '../../content/schema/StageDefinition';

export function MissionCard({ stage }: { readonly stage: StageDefinition }) {
  return (
    <section className="panel mission-card">
      <span className="eyebrow">MISSION 001</span>
      <h1>{stage.mission.title}</h1>
      <p>{stage.mission.description}</p>
      <p className="hint">물병을 드래그해 초록색 책상 영역에 놓고 잠시 관찰하세요.</p>
    </section>
  );
}
