import { createApp } from './app.js?v=20261108-public';
import { asset } from './catalog.js?v=20261108-public';
const app = createApp(document.getElementById('app'));
app.render();
// Also warm background/alternate-expression assets and report CSS-background failures.
// A failed image never disables the rest of the game or substitutes another illustration.
fetch(asset('asset_manifest.json')).then(response => {
  if (!response.ok) throw new Error('manifest');
  return response.json();
}).then(async manifest => {
  let cursor = 0;
  async function worker() {
    while (cursor < manifest.assets.length) {
      const entry = manifest.assets[cursor++];
      await new Promise(resolve => {
        const image = new Image();
        image.onload = resolve;
        image.onerror = () => { app.reportAssetFailure(entry.path); resolve(); };
        image.src = asset(entry.path);
      });
    }
  }
  await Promise.all([worker(), worker(), worker()]);
}).catch(() => app.reportAssetFailure('asset_manifest.json'));
