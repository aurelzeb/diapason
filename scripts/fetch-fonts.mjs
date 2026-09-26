// Télécharge une fois les polices Google utilisées par index.html dans assets/fonts/,
// pour que l'appli fonctionne hors ligne (appli native et version installable).
// Usage : npm run fonts
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const outDir = path.join(root, 'assets', 'fonts');
const KEEP = new Set(['latin', 'latin-ext']);
// Un navigateur récent, pour que Google renvoie des fichiers woff2.
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

const html = await readFile(path.join(root, 'index.html'), 'utf8');
const href = html.match(/href="(https:\/\/fonts\.googleapis\.com\/css2[^"]+)"/)?.[1]?.replace(/&amp;/g, '&');
if (!href) throw new Error('Lien Google Fonts introuvable dans index.html');

const css = await (await fetch(href, { headers: { 'User-Agent': UA } })).text();
await mkdir(outDir, { recursive: true });

const blocks = [...css.matchAll(/\/\*\s*([\w-]+)\s*\*\/\s*(@font-face\s*{[^}]+})/g)];
let out = '/* Généré par scripts/fetch-fonts.mjs */\n';
let n = 0;
const seen = new Map();
for (const [, subset, block] of blocks) {
  if (!KEEP.has(subset)) continue;
  const family = block.match(/font-family:\s*'([^']+)'/)[1];
  const style = block.match(/font-style:\s*(\w+)/)[1];
  const weight = block.match(/font-weight:\s*([\d ]+);/)[1].trim().replace(/\s+/g, '-');
  const url = block.match(/url\((https:[^)]+\.woff2)\)/)[1];
  // Les polices variables partagent un fichier entre graisses : on ne le télécharge qu'une fois.
  let file = seen.get(url);
  if (!file) {
    file = `${family.replace(/\s+/g, '')}-${weight}-${style}-${subset}.woff2`;
    await writeFile(path.join(outDir, file), Buffer.from(await (await fetch(url)).arrayBuffer()));
    seen.set(url, file);
    n++;
  }
  out += `/* ${subset} */\n` + block.replace(url, file).replace(/url\(([^)]+)\)/, "url('$1')") + '\n';
}
await writeFile(path.join(outDir, 'fonts.css'), out);
console.log(`${n} fichiers de police enregistrés dans assets/fonts/`);
