import { describe, expect, it } from 'vitest';
import { joinPublicAssetUrl, normalizeBaseUrl, publicAssetPathFromUrl } from '../../src/assets/publicAssetUrl';
import { STAGE_001_AUDIO_MANIFEST } from '../../src/audio/stage001AudioManifest';
import { STAGE_002_AUDIO_MANIFEST } from '../../src/audio/stage002AudioManifest';
import { STAGE_003_AUDIO_MANIFEST } from '../../src/audio/stage003AudioManifest';
import { STAGE_001_RIG, STAGE_001_SVG_ASSETS } from '../../src/phaser/assets/stage001AssetManifest';
import { STAGE_002_SVG_ASSETS } from '../../src/phaser/assets/stage002AssetManifest';
import { STAGE_003_SVG_ASSETS } from '../../src/phaser/assets/stage003AssetManifest';

const PAGES_BASE = '/place-and-see/';

describe('public asset URL handling', () => {
  it('joins root and repository bases', () => {
    expect(joinPublicAssetUrl('/', 'assets/audio/example.mp3')).toBe('/assets/audio/example.mp3');
    expect(joinPublicAssetUrl(PAGES_BASE, '/assets/audio/example.mp3')).toBe('/place-and-see/assets/audio/example.mp3');
  });

  it('normalizes leading and trailing slashes', () => {
    expect(normalizeBaseUrl('place-and-see')).toBe(PAGES_BASE);
    expect(normalizeBaseUrl('//place-and-see//')).toBe(PAGES_BASE);
  });

  it('preserves external, data and blob URLs', () => {
    for (const url of ['https://example.com/a.svg', 'data:image/svg+xml,x', 'blob:https://example.com/id']) {
      expect(joinPublicAssetUrl(PAGES_BASE, url)).toBe(url);
    }
  });

  it('preserves query strings and hashes', () => {
    expect(joinPublicAssetUrl(PAGES_BASE, 'assets/a.svg?v=1#icon')).toBe('/place-and-see/assets/a.svg?v=1#icon');
  });

  it('rejects literal and encoded traversal', () => {
    expect(() => joinPublicAssetUrl(PAGES_BASE, 'assets/../secret')).toThrow(/traverse/);
    expect(() => publicAssetPathFromUrl('/place-and-see/assets/%2e%2e/secret')).toThrow(/traverse/);
  });

  it('maps based URLs back to exact public paths', () => {
    expect(publicAssetPathFromUrl('/place-and-see/assets/props/bottle.svg?x=1')).toBe('assets/props/bottle.svg');
  });

  it('applies the repository base to every Stage SVG and the cat rig', () => {
    const assets = [...STAGE_001_SVG_ASSETS, ...STAGE_002_SVG_ASSETS, ...STAGE_003_SVG_ASSETS, STAGE_001_RIG];
    for (const asset of assets) {
      const based = joinPublicAssetUrl(PAGES_BASE, publicAssetPathFromUrl(asset.url));
      expect(based).toMatch(/^\/place-and-see\/assets\//);
      expect(based).not.toContain('/place-and-see/place-and-see/');
    }
  });

  it('applies the repository base to every Stage audio URL', () => {
    const sounds = [
      ...STAGE_001_AUDIO_MANIFEST.sounds,
      ...STAGE_002_AUDIO_MANIFEST.sounds,
      ...STAGE_003_AUDIO_MANIFEST.sounds,
    ];
    for (const sound of sounds) {
      expect(joinPublicAssetUrl(PAGES_BASE, publicAssetPathFromUrl(sound.url)))
        .toBe(`/place-and-see/assets/audio/edited/${sound.sourceFile}`);
    }
  });

  it('keeps established Stage 3 markers and volumes unchanged', () => {
    expect(STAGE_003_AUDIO_MANIFEST.sounds.map(({ key, startMs, durationMs, volume }) => (
      [key, startMs, durationMs, volume]
    ))).toEqual([
      ['cake-place-wood-01', 500, 350, 0.58],
      ['cake-hit-01', 0, 130, 1],
      ['candle-light-01', 2650, 350, 0.78],
      ['candle-blowout-01', 7000, 1300, 1],
    ]);
  });
});
