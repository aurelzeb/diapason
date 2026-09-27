// Construit le dossier www/ à partir de index.html (la même source que l'artefact claude.ai) :
// page HTML complète, polices et icônes locales, manifeste et service worker pour l'installation.
// Ce dossier sert à la fois à GitHub Pages et aux applis natives (Capacitor, webDir = www).
// Usage : npm run build   (aucune dépendance : Node seul suffit)
import { readFile, writeFile, mkdir, rm, cp, readdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const www = path.join(root, 'www');
const pkg = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));

let src = await readFile(path.join(root, 'index.html'), 'utf8');
const title = src.match(/<title>([^<]*)<\/title>/)?.[1] ?? 'Diapason';
// La source est écrite pour l'artefact : on retire ce que la page complète déclare elle-même.
src = src
  .replace(/<meta charset="utf-8">\s*/i, '')
  .replace(/<title>[^<]*<\/title>\s*/i, '')
  .replace(/<link rel="preconnect"[^>]*>\s*/gi, '')
  .replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\s*/gi, '');

const description = 'Entraîne ton oreille absolue : notes seules et accords de la méthode Eguchi, en parcours progressif.';
const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#E8EBEF" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0D0F13" media="(prefers-color-scheme: dark)">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="${title}">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" type="image/png" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<link rel="stylesheet" href="fonts/fonts.css">
<style>
:root{color-scheme:light;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}
body{margin:0;overscroll-behavior-y:none;-webkit-text-size-adjust:100%}
img{max-width:100%}
[hidden]{display:none!important}
</style>
</head>
<body>
${src.trim()}
<script>
if ('serviceWorker' in navigator && location.protocol === 'https:' && !(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform())) {
  // Quand une nouvelle version prend le relais, on recharge pour l'afficher (sauf en pleine leçon).
  const hadController = !!navigator.serviceWorker.controller;
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController || reloading || document.body.classList.contains('in-lesson')) return;
    reloading = true;
    location.reload();
  });
  window.addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}
</script>
</body>
</html>
`;

const manifest = {
  name: title,
  short_name: title,
  description,
  lang: 'fr',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#0D0F13',
  theme_color: '#0D0F13',
  categories: ['music', 'education'],
  icons: [
    { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};

await rm(www, { recursive: true, force: true });
await mkdir(www, { recursive: true });
await writeFile(path.join(www, 'index.html'), page);
await writeFile(path.join(www, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2));
await cp(path.join(root, 'assets', 'fonts'), path.join(www, 'fonts'), { recursive: true });
await cp(path.join(root, 'assets', 'icons'), path.join(www, 'icons'), { recursive: true });

// Service worker : met en cache tous les fichiers pour un usage hors ligne.
// Le nom du cache change à chaque contenu différent, ce qui force la mise à jour.
const files = (await readdir(www, { recursive: true, withFileTypes: true }))
  .filter((d) => d.isFile())
  .map((d) => path.relative(www, path.join(d.parentPath ?? d.path, d.name)).split(path.sep).join('/'))
  .sort();
const hash = createHash('sha256');
for (const f of files) hash.update(await readFile(path.join(www, f)));
const version = `${pkg.version}-${hash.digest('hex').slice(0, 10)}`;
const sw = `// Généré par scripts/build.mjs
const CACHE = 'diapason-${version}';
const ASSETS = ${JSON.stringify(['./', ...files], null, 2)};
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // La page elle-même : réseau d'abord, pour afficher tout de suite la dernière version ;
  // la copie en cache ne sert que hors ligne.
  if (req.mode === 'navigate' || req.destination === 'document') {
    e.respondWith(fetch(req)
      .then((res) => { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match('./'))));
    return;
  }
  // Polices, icônes, manifeste : cache d'abord (ils ne changent qu'avec une nouvelle version).
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((hit) => hit || fetch(req)));
});
`;
await writeFile(path.join(www, 'sw.js'), sw);
console.log(`www/ construit (${files.length + 1} fichiers, cache ${version})`);
