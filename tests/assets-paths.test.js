import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, mkdtemp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { ASSET_ROOT, asset } from '../src/catalog.js';
import { buildSite } from '../scripts/build.mjs';
const manifest = JSON.parse(await readFile(new URL('../public/assets/ohanayasan/asset_manifest.json', import.meta.url), 'utf8'));
async function checkPublicPaths(directory) {
  const page = new URL('https://example.test/flower/');
  function localPath(url) {
    assert.equal(url.origin, page.origin);
    assert(url.pathname.startsWith(page.pathname));
    return resolve(directory, decodeURIComponent(url.pathname.slice(page.pathname.length)));
  }
  assert.equal(ASSET_ROOT, './public/assets/ohanayasan/');
  await access(localPath(new URL(asset('asset_manifest.json'), page)));
  for (const entry of manifest.assets) {
    const file = await readFile(localPath(new URL(asset(entry.path), page)));
    assert.equal(createHash('sha256').update(file).digest('hex'), entry.sha256, entry.path);
  }
  const html = await readFile(resolve(directory, 'index.html'), 'utf8');
  for (const [, path] of html.matchAll(/(?:src|href)="(\.\/[^"$]+)"/g)) await access(localPath(new URL(path, page)));
  const cssURL = new URL('./src/styles.css', page);
  const css = await readFile(localPath(cssURL), 'utf8');
  for (const [, path] of css.matchAll(/url\(['"]([^'"$]+)['"]\)/g)) await access(localPath(new URL(path, cssURL)));
  const main = await readFile(resolve(directory, 'src/main.js'), 'utf8');
  assert.match(main, /fetch\(asset\('asset_manifest\.json'\)\)/);
  assert.match(main, /image\.src = asset\(entry\.path\)/);
}
test('T-18 regression: direct repository Pages under /flower/ resolves every image, preload and CSS background', async () => {
  await checkPublicPaths(resolve('.'));
  await access('.nojekyll');
});
test('T-18 regression: built hosting preserves exactly the same public URLs and all 61 original PNGs', async () => {
  await mkdir('work', { recursive: true });
  const directory = await mkdtemp(resolve('work/assets-build-'));
  try { await buildSite(directory); await checkPublicPaths(directory); await access(resolve(directory,'.nojekyll')); }
  finally { await rm(directory, { recursive: true, force: true }); }
});
