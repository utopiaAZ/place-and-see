import { STAGE_001_SVG_ASSETS, type SvgAssetDefinition } from './stage001AssetManifest';
import { STAGE_002_SVG_ASSETS } from './stage002AssetManifest';
import { STAGE_003_SVG_ASSETS } from './stage003AssetManifest';

export const STAGE_SVG_ASSETS: readonly SvgAssetDefinition[] = [...STAGE_001_SVG_ASSETS, ...STAGE_002_SVG_ASSETS, ...STAGE_003_SVG_ASSETS];

export function getSvgAsset(key: string): SvgAssetDefinition {
  const asset = STAGE_SVG_ASSETS.find((candidate) => candidate.key === key);
  if (!asset) throw new Error(`Unknown asset key: ${key}`);
  return asset;
}
