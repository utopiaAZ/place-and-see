import { stage001, stage002, stage003 } from '../src/content/stages/index';
import type { StageDefinition } from '../src/content/schema/StageDefinition';
import type { ZoneId } from '../src/core/types/identifiers';

const stages: readonly StageDefinition[] = [stage001, stage002, stage003];
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
  if (stage.stageThree) {
    for (const zone of [stage.stageThree.cakeDeskZoneId, stage.stageThree.ignitionZoneId, stage.stageThree.foodZoneId, stage.stageThree.toyZoneId, stage.stageThree.blockerZoneId, stage.stageThree.unpluggedZoneId, 'plug-socket' as ZoneId]) {
      if (!zoneIds.has(zone)) errors.push(`${stage.id}: missing Stage 3 zone ${zone}`);
    }
    for (const id of [stage.stageThree.cakeObjectId, stage.stageThree.lighterObjectId, stage.stageThree.foodObjectId, stage.stageThree.toyObjectId, stage.stageThree.blockerObjectId, stage.stageThree.plugObjectId]) {
      if (!objectIds.has(id)) errors.push(`${stage.id}: missing Stage 3 object ${id}`);
    }
    if (stage.stageThree.fanPhaseDurationMs <= 0 || stage.stageThree.fanSlowdownMs !== 600 || stage.stageThree.candleIgnitionMs <= 0 || stage.stageThree.candleLitHoldMs <= 0 || stage.stageThree.candleBlowoutMs <= 0) errors.push(`${stage.id}: invalid Stage 3 timing`);
    if (stage.timings.toyDistractionMs !== 5000 || stage.goal.durationMs !== 3000) errors.push(`${stage.id}: toy/stability duration mismatch`);
    if (!stage.scene.stageThree) errors.push(`${stage.id}: missing Stage 3 scene data`);
    else {
      const visual = stage.scene.stageThree;
      if (visual.cakeDisplaySize.width <= 0 || visual.cakeDisplaySize.height <= 0 || visual.candleDisplaySize.width <= 0 || visual.candleDisplaySize.height <= 0) errors.push(`${stage.id}: invalid cake/candle display size`);
      if (visual.ignitionPadding.x <= 0 || visual.ignitionPadding.y <= 0) errors.push(`${stage.id}: ignition padding must be positive`);
      if (!Number.isFinite(visual.candleAnchor.x) || !Number.isFinite(visual.candleAnchor.y)) errors.push(`${stage.id}: invalid candle local anchor`);
    }
  }
}

if (errors.length > 0) throw new Error(errors.join('\n'));
console.log(`Validated ${stages.length} stage(s).`);
