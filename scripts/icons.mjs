// Génère les icônes de l'appli (diapason laiton sur fond ébène) :
// - assets/icons/ : icônes de la version installable (PWA) ;
// - assets/*.png : sources de @capacitor/assets pour les icônes et écrans de démarrage natifs.
// Usage : npm run icons
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const EBONY = '#14161B';
const BRASS = '#D6A447';

// Le diapason est dessiné dans un repère 24 × 36 centré sur (12, 18).
function svg(size, { scale = 17, background = EBONY, fork = true }) {
  const k = (size / 1024) * scale;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  ${background ? `<rect width="${size}" height="${size}" fill="${background}"/>` : ''}
  ${fork ? `<g transform="translate(${size / 2} ${size / 2}) scale(${k}) translate(-12 -18)" fill="none" stroke="${BRASS}" stroke-linecap="round">
    <path d="M5 2.5v12a7 7 0 0 0 14 0v-12" stroke-width="3"/>
    <path d="M12 21.5v12" stroke-width="3"/>
    <path d="M0.5 4.5a9 9 0 0 0 0 9M23.5 4.5a9 9 0 0 1 0 9" stroke-width="1.6" stroke-opacity=".45"/>
  </g>` : ""}
</svg>`;
}

async function png(file, size, opts) {
  await sharp(Buffer.from(svg(size, opts))).png().toFile(path.join(root, file));
  console.log('✓', file);
}

await mkdir(path.join(root, 'assets', 'icons'), { recursive: true });

// Version installable
await png('assets/icons/icon-192.png', 192, { scale: 17 });
await png('assets/icons/icon-512.png', 512, { scale: 17 });
await png('assets/icons/maskable-512.png', 512, { scale: 13 });
await png('assets/icons/apple-touch-icon.png', 180, { scale: 17 });

// Sources pour @capacitor/assets (appli native)
await png('assets/icon-only.png', 1024, { scale: 17 });
await png('assets/icon-foreground.png', 1024, { scale: 12, background: null });
await png('assets/icon-background.png', 1024, { fork: false });
await png('assets/splash.png', 2732, { scale: 9 });
await png('assets/splash-dark.png', 2732, { scale: 9, background: '#0D0F13' });
