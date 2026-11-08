import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
const root = resolve(process.argv[2] || '.');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json; charset=utf-8' };
http.createServer(async (req, res) => {
  try {
    const urlPath = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    let path = resolve(root, '.' + (root === resolve('.') && urlPath.startsWith('/assets/') ? '/public' + urlPath : urlPath));
    if (path !== root && !path.startsWith(root + sep)) throw Error('invalid path');
    if ((await stat(path)).isDirectory()) path = resolve(path, 'index.html');
    const data = await readFile(path);
    res.writeHead(200, { 'Content-Type': types[extname(path)] || 'application/octet-stream' }); res.end(data);
  } catch { res.writeHead(404); res.end('404'); }
}).listen(Number(process.env.PORT || 4173), '0.0.0.0', () => console.log('Local game: http://localhost:' + (process.env.PORT || 4173)));
