const EXTERNAL_URL = /^[a-z][a-z\d+.-]*:/i;

function splitSuffix(value: string): { path: string; suffix: string } {
  const suffixIndex = value.search(/[?#]/);
  return suffixIndex < 0
    ? { path: value, suffix: '' }
    : { path: value.slice(0, suffixIndex), suffix: value.slice(suffixIndex) };
}

function assertSafePath(path: string): void {
  let decoded: string;
  try {
    decoded = decodeURIComponent(path);
  } catch {
    throw new Error(`Invalid public asset URL encoding: ${path}`);
  }
  if (decoded.split('/').includes('..')) {
    throw new Error(`Public asset paths cannot traverse directories: ${path}`);
  }
}

export function normalizeBaseUrl(baseUrl: string): string {
  const normalized = baseUrl.trim().replace(/\\/g, '/').replace(/\/{2,}/g, '/');
  const path = normalized.replace(/^\/+|\/+$/g, '');
  return path ? `/${path}/` : '/';
}

export function joinPublicAssetUrl(baseUrl: string, assetUrl: string): string {
  if (EXTERNAL_URL.test(assetUrl) || assetUrl.startsWith('//')) return assetUrl;
  const { path, suffix } = splitSuffix(assetUrl);
  assertSafePath(path);
  const relativePath = path.replace(/^\/+/, '');
  if (!relativePath) throw new Error('A public asset path is required.');
  return `${normalizeBaseUrl(baseUrl)}${relativePath}${suffix}`;
}

export function publicAssetPathFromUrl(assetUrl: string): string {
  if (EXTERNAL_URL.test(assetUrl) || assetUrl.startsWith('//')) {
    throw new Error(`External URLs do not map to public assets: ${assetUrl}`);
  }
  const { path } = splitSuffix(assetUrl);
  assertSafePath(path);
  const parts = path.replace(/\\/g, '/').split('/').filter(Boolean);
  const assetsIndex = parts.indexOf('assets');
  if (assetsIndex < 0) throw new Error(`URL is outside the public assets directory: ${assetUrl}`);
  return parts.slice(assetsIndex).join('/');
}

const viteBaseUrl = import.meta.env?.BASE_URL ?? '/';

export function publicAssetUrl(assetUrl: string): string {
  return joinPublicAssetUrl(viteBaseUrl, assetUrl);
}
