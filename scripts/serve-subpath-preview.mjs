/* global process, URL, console */

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, resolve, sep } from 'node:path';

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function normalizeBase(value) {
  const path = value.trim().replace(/\\/g, '/').replace(/\/{2,}/g, '/').replace(/^\/+|\/+$/g, '');
  return path ? `/${path}/` : '/';
}

const base = normalizeBase(option('--base', '/'));
const port = Number(option('--port', '4176'));
const root = resolve('dist');
const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'], ['.html', 'text/html; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'], ['.json', 'application/json; charset=utf-8'],
  ['.mp3', 'audio/mpeg'], ['.svg', 'image/svg+xml; charset=utf-8'],
]);

if (!existsSync(resolve(root, 'index.html'))) {
  throw new Error('dist/index.html is missing. Run npm run build first.');
}
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error(`Invalid port: ${port}`);

const server = createServer((request, response) => {
  const requestUrl = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
  let pathname;
  try {
    pathname = decodeURIComponent(requestUrl.pathname);
  } catch {
    response.writeHead(400).end('Invalid URL encoding');
    return;
  }
  if (!pathname.startsWith(base)) {
    response.writeHead(404).end('Not found');
    return;
  }
  const relativePath = pathname.slice(base.length) || 'index.html';
  if (relativePath.split('/').includes('..')) {
    response.writeHead(400).end('Invalid path');
    return;
  }
  const filePath = resolve(root, ...relativePath.split('/'));
  if (filePath !== root && !filePath.startsWith(`${root}${sep}`)) {
    response.writeHead(400).end('Invalid path');
    return;
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    response.writeHead(404).end('Not found');
    return;
  }
  response.setHeader('Content-Type', mimeTypes.get(extname(filePath).toLowerCase()) ?? 'application/octet-stream');
  response.setHeader('Content-Length', statSync(filePath).size);
  response.writeHead(200);
  if (request.method === 'HEAD') response.end();
  else createReadStream(filePath).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Serving ${root} at http://127.0.0.1:${port}${base}`);
});
