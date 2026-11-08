import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { inflateSync } from 'node:zlib';
import assert from 'node:assert/strict';
import { CATALOG, STAGES, PAPERS, RIBBONS } from '../src/catalog.js';
const root = new URL('../public/assets/ohanayasan/', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('asset_manifest.json', root), 'utf8'));
function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
export async function checkAssets() {
  assert.equal(manifest.assets.length, 61);
  for (const entry of manifest.assets) {
    const file = await readFile(new URL(entry.path, root));
    assert.equal(createHash('sha256').update(file).digest('hex'), entry.sha256, entry.path + ' hash');
    assert.equal(file.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(file.readUInt32BE(16), entry.width, entry.path + ' width');
    assert.equal(file.readUInt32BE(20), entry.height, entry.path + ' height');
    const depth = file[24], colorType = file[25], channels = { 0: 1, 2: 3, 4: 2, 6: 4 }[colorType];
    assert.equal(depth, 8); assert.equal(file[28], 0, 'noninterlaced PNG');
    assert.equal([4, 6].includes(colorType), entry.has_alpha);
    const data = []; let ended = false;
    for (let pos = 8; pos < file.length;) {
      const len = file.readUInt32BE(pos), type = file.subarray(pos + 4, pos + 8).toString();
      assert.equal(crc32(file.subarray(pos + 4, pos + 8 + len)), file.readUInt32BE(pos + 8 + len), entry.path + ' CRC');
      if (type === 'IDAT') data.push(file.subarray(pos + 8, pos + 8 + len));
      if (type === 'IEND') ended = true;
      pos += len + 12;
    }
    assert(ended); const raw = inflateSync(Buffer.concat(data)), stride = entry.width * channels + 1;
    assert.equal(raw.length, stride * entry.height, entry.path + ' decoded data length');
    for (let row = 0; row < entry.height; row++) assert(raw[row * stride] <= 4, 'PNG row filter');
  }
  for (const [id, flower] of Object.entries(CATALOG)) {
    assert(manifest.assets.some(a => a.path === flower.image));
    assert.equal(flower.price, manifest.flower_price_yen_per_stem[flower.type]);
    assert.equal(flower.name, manifest.flower_name_ja[flower.type]);
    assert.equal(flower.color, id.split('_')[1]);
  }
  STAGES.forEach((stock, i) => assert.deepEqual(stock, manifest.stage_inventory_confirmed[i + 1].stock));
  assert.deepEqual(PAPERS, manifest.wrapping_paper_colors); assert.deepEqual(RIBBONS, manifest.ribbon_colors);
  console.log(`PASS: ${manifest.assets.length} PNGs: SHA-256, CRC, decompression, dimensions, alpha; catalog, prices, stage stocks, wrapping colors match manifest.`);
  return manifest;
}
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) await checkAssets();
