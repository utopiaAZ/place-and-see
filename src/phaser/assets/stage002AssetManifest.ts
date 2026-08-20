import type { SvgAssetDefinition } from './stage001AssetManifest';

const svg = (key: string, url: string, displaySize: SvgAssetDefinition['displaySize'], hitSize?: SvgAssetDefinition['hitSize']): SvgAssetDefinition => ({
  key, url, displaySize, loadSize: { width: displaySize.width * 2, height: displaySize.height * 2 }, hitSize,
});

export const STAGE_002_SVG_ASSETS = [
  svg('stage002.document', '/assets/props/stage-002/document.svg', { width: 130, height: 88 }, { width: 126, height: 84 }),
  svg('stage002.fan-body', '/assets/props/stage-002/desk-fan-body.svg', { width: 230, height: 270 }),
  svg('stage002.fan-head', '/assets/props/stage-002/desk-fan-head.svg', { width: 205, height: 205 }),
  svg('stage002.fan-blades', '/assets/props/stage-002/desk-fan-blades.svg', { width: 175, height: 175 }),
  svg('stage002.power-outlet', '/assets/props/stage-002/power-outlet.svg', { width: 80, height: 96 }),
  svg('stage002.power-plug', '/assets/props/stage-002/power-plug.svg', { width: 76, height: 62 }, { width: 72, height: 58 }),
  svg('stage002.file-divider', '/assets/props/stage-002/file-divider.svg', { width: 120, height: 112 }, { width: 112, height: 108 }),
] as const satisfies readonly SvgAssetDefinition[];
