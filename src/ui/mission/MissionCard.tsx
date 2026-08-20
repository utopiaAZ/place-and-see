import type { StageDefinition } from '../../content/schema/StageDefinition';

export function MissionCard({ stage }: { readonly stage: StageDefinition }) {
  return (
    <section className="panel mission-card">
      <span className="eyebrow">MISSION {stage.id.slice(-3)}</span>
      <h1>{stage.mission.title}</h1>
      <p className="mission-support">{stage.mission.description}</p>
    </section>
  );
}
