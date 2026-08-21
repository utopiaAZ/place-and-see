import type { SvgAssetDefinition } from './stage001AssetManifest';
import { publicAssetUrl } from '../../assets/publicAssetUrl';

const svg = (key: string, url: string, displaySize: SvgAssetDefinition['displaySize'], hitSize?: SvgAssetDefinition['hitSize']): SvgAssetDefinition => ({
  key, url, displaySize, loadSize: { width: displaySize.width * 2, height: displaySize.height * 2 }, hitSize,
});

export const STAGE_003_SVG_ASSETS = [
  svg('stage003.cake', publicAssetUrl('assets/props/stage-003/cake.svg'), { width: 150, height: 100 }, { width: 145, height: 100 }),
  svg('stage003.candle', publicAssetUrl('assets/props/stage-003/candle.svg'), { width: 30, height: 65 }),
  svg('stage003.flame', publicAssetUrl('assets/props/stage-003/flame.svg'), { width: 24, height: 34 }),
  svg('stage003.lighter', publicAssetUrl('assets/props/stage-003/lighter.svg'), { width: 48, height: 92 }, { width: 52, height: 96 }),
  svg('stage003.cake-damage-overlay', publicAssetUrl('assets/props/stage-003/cake-damage-overlay.svg'), { width: 150, height: 100 }),
  svg('stage003.smoke-puff', publicAssetUrl('assets/props/stage-003/smoke-puff.svg'), { width: 38, height: 38 }),
] as const satisfies readonly SvgAssetDefinition[];
