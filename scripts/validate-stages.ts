import { stage001, stage002 } from '../src/content/stages/index';
import type { StageDefinition } from '../src/content/schema/StageDefinition';
import type { ZoneId } from '../src/core/types/identifiers';

const stages: readonly StageDefinition[] = [stage001, stage002];
const errors: string[] = [];
const stageIds = new Set<string>();
for (const stage of stages) {
  if (stageIds.has(stage.id)) errors.push(`${stage.id}: duplicate stage id`);
  stageIds.add(stage.id);
  const objectIds = new Set(stage.objects.map((object) => object.id));
  const zoneIds = new Set(stage.zones.map((zone) => zone.id));
  if (!objectIds.has(stage.goal.objectId)) errors.push(`${stage.id}: goal object is missing`);
  if (!zoneIds.has(stage.goal.zoneId)) errors.push(`${stage.id}: goal zone is missing`);
  if (stage.goal.durationMs <= 0) errors.push(`${stage.id}: goal duration must be positive`);
  for (const object of stage.objects) if (!zoneIds.has(object.zoneId)) errors.push(`${stage.id}: invalid initial zone for ${object.id}`);
  if (stage.stageTwo) {
    for (const zone of [stage.stageTwo.documentZoneId, stage.stageTwo.weightZoneId, stage.stageTwo.blockerZoneId, stage.stageTwo.unpluggedZoneId, 'plug-socket' as ZoneId]) {
      if (!zoneIds.has(zone)) errors.push(`${stage.id}: missing Stage 2 zone ${zone}`);
    }
    if (stage.stageTwo.fanPhaseDurationMs <= 0 || stage.stageTwo.fanSlowdownMs <= 0 || stage.stageTwo.paperFlutterMs <= 0) {
      errors.push(`${stage.id}: Stage 2 timings must be positive`);
    }
  }
}

if (errors.length > 0) throw new Error(errors.join('\n'));
console.log(`Validated ${stages.length} stage(s).`);
