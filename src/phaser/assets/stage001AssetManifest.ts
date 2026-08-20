export interface SvgAssetDefinition {
  readonly key: string;
  readonly url: string;
  readonly loadSize: { readonly width: number; readonly height: number };
  readonly displaySize: { readonly width: number; readonly height: number };
  readonly hitSize?: { readonly width: number; readonly height: number };
}

const svg = (key: string, url: string, displaySize: SvgAssetDefinition['displaySize'], hitSize?: SvgAssetDefinition['hitSize']): SvgAssetDefinition => ({
  key, url, displaySize, loadSize: { width: displaySize.width * 2, height: displaySize.height * 2 }, hitSize,
});

export const STAGE_001_SVG_ASSETS = [
  svg('furniture.desk', '/assets/furniture/desk.svg', { width: 500, height: 300 }),
  svg('furniture.chair', '/assets/furniture/chair.svg', { width: 200, height: 250 }),
  svg('furniture.shelf', '/assets/furniture/shelf.svg', { width: 240, height: 320 }),
  svg('prop.bottle', '/assets/props/bottle.svg', { width: 70, height: 110 }, { width: 62, height: 102 }),
  svg('prop.cat-food', '/assets/props/cat-food.svg', { width: 80, height: 80 }, { width: 72, height: 58 }),
  svg('prop.toy-mouse', '/assets/props/toy-mouse.svg', { width: 75, height: 60 }, { width: 72, height: 54 }),
  svg('prop.non-slip-mat', '/assets/props/non-slip-mat.svg', { width: 150, height: 75 }, { width: 145, height: 68 }),
  svg('prop.water-puddle', '/assets/props/water-puddle.svg', { width: 150, height: 75 }),
  svg('actor.cat.back-leg', '/assets/characters/cat/back-leg.svg', { width: 180, height: 180 }),
  svg('actor.cat.tail', '/assets/characters/cat/tail.svg', { width: 180, height: 180 }),
  svg('actor.cat.body', '/assets/characters/cat/body.svg', { width: 180, height: 180 }),
  svg('actor.cat.front-leg', '/assets/characters/cat/front-leg.svg', { width: 180, height: 180 }),
  svg('actor.cat.head', '/assets/characters/cat/head.svg', { width: 180, height: 180 }),
  svg('actor.cat.face-idle', '/assets/characters/cat/face-idle.svg', { width: 180, height: 180 }),
  svg('actor.cat.face-curious', '/assets/characters/cat/face-curious.svg', { width: 180, height: 180 }),
  svg('actor.cat.face-happy', '/assets/characters/cat/face-happy.svg', { width: 180, height: 180 }),
] as const satisfies readonly SvgAssetDefinition[];

export const STAGE_001_RIG = { key: 'actor.cat.rig', url: '/assets/characters/cat/cat-rig.json' } as const;

export function getSvgAsset(key: string): SvgAssetDefinition {
  const asset = STAGE_001_SVG_ASSETS.find((candidate) => candidate.key === key);
  if (!asset) throw new Error(`Unknown Stage 1 asset key: ${key}`);
  return asset;
}
