import { stage001 } from '../src/content/stages/index';

const stages = [stage001];
const errors: string[] = [];
for (const stage of stages) {
  const objectIds = new Set(stage.objects.map((object) => object.id));
  if (!objectIds.has(stage.goal.objectId)) errors.push(`${stage.id}: goal object is missing`);
  if (stage.goal.durationMs <= 0) errors.push(`${stage.id}: goal duration must be positive`);
}

if (errors.length > 0) throw new Error(errors.join('\n'));
console.log(`Validated ${stages.length} stage(s).`);
