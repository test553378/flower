import { cp, mkdir, rm, readFile, access, readdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
await rm('dist', { recursive: true, force: true });
await mkdir('dist', { recursive: true });
await cp('public', 'dist', { recursive: true });
await cp('src', 'dist/src', { recursive: true });
await cp('index.html', 'dist/index.html');
// Check static references from a subdirectory-friendly build, without a server.
const paths = ['dist/index.html', ...(await readdir('dist/src')).filter(n => /\.(js|css)$/.test(n)).map(n => 'dist/src/' + n)];
for (const path of paths) {
  const source = await readFile(path, 'utf8');
  const refs = [...source.matchAll(/(?:src|href)="(\.\.?\/[^"$]+)"|url\(['"]?(\.\.?\/[^)'"$]+)['"]?\)|from ['"](\.\.?\/[^'"$]+)['"]/g)];
  for (const match of refs) await access(resolve(dirname(path), match[1] || match[2] || match[3]));
}
console.log('Built dist/ (static, relative URLs, no runtime dependencies)');
