// scripts/restore.mjs
// 仓库里的大文件以 <name>.z1/.z2/... 分片形式存储（zlib 压缩 + base64）。
// 本脚本在构建前把分片拼接还原成真实源文件，幂等，可重复执行。
import { readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { inflateSync } from 'node:zlib';

const MAP = {
  'src/lib/teardown': 'src/lib/teardown.js',
  'src/models/room': 'src/models/room.js',
  'src/models/rack': 'src/models/rack.js',
  'src/models/server': 'src/models/server.js',
  'src/models/software': 'src/models/software.js',
  'package-lock': 'package-lock.json',
  'README': 'README.md',
  'public/fonts/geist-latin-wght': 'public/fonts/geist-latin-wght.woff2',
  'public/fonts/geist-mono-latin-wght': 'public/fonts/geist-mono-latin-wght.woff2',
};

let restored = 0;
for (const [prefix, target] of Object.entries(MAP)) {
  const dir = dirname(prefix);
  const base = prefix.split('/').pop();
  let names = [];
  try {
    names = readdirSync(dir).filter(n => new RegExp(`^${base}\\.z\\d+$`).test(n));
  } catch { /* 目录不存在则跳过 */ }
  if (!names.length) { console.log(`skip ${target} (no shards found)`); continue; }
  names.sort((a, b) => parseInt(a.split('.z')[1], 10) - parseInt(b.split('.z')[1], 10));
  const b64 = names.map(n => readFileSync(join(dir, n), 'utf8').trim()).join('');
  const buf = inflateSync(Buffer.from(b64, 'base64'));
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, buf);
  restored++;
  console.log(`restored ${target} (${buf.length} bytes from ${names.length} shard(s))`);
}
console.log(`restore done: ${restored} file(s)`);
