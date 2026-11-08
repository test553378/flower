import { cp, mkdir, rm, readFile, access, readdir, writeFile } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { pathToFileURL } from 'node:url';
export async function buildSite(directory = 'dist') {
  await rm(directory, { recursive: true, force: true });
  await mkdir(directory, { recursive: true });
  // Keep the repository layout so branch-based Pages and built hosting use
  // identical URLs. Flattening public/ previously broke branch-based Pages.
  await cp('public', join(directory, 'public'), { recursive: true });
  await cp('src', join(directory, 'src'), { recursive: true });
  await cp('index.html', join(directory, 'index.html'));
  await writeFile(join(directory, '.nojekyll'), '');
  const paths = [join(directory, 'index.html'), ...(await readdir(join(directory, 'src'))).filter(n => /\.(js|css)$/.test(n)).map(n => join(directory, 'src', n))];
  for (const path of paths) {
    const source = await readFile(path, 'utf8');
    const refs = [...source.matchAll(/(?:src|href)="(\.\.?\/[^"$]+)"|url\(['"]?(\.\.?\/[^)'"$]+)['"]?\)|from ['"](\.\.?\/[^'"$]+)['"]/g)];
    for (const match of refs) await access(resolve(dirname(path), (match[1] || match[2] || match[3]).split(/[?#]/)[0]));
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await buildSite(); console.log('Built dist/ with public/ preserved (branch Pages and built hosting use identical URLs)');
}
