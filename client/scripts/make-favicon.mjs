// Builds the favicons from the same mandala + "SA" monogram as the navbar logo
// (src/components/Logo.jsx).
//
//   npm run favicon
//
// Writes into public/:
//   favicon.svg           - browser tab icon (sharp at any size)
//   favicon-32.png        - fallback for browsers without SVG favicons
//   apple-touch-icon.png  - 180×180, used when saved to an iPhone home screen
//
// Note: icons can't load web fonts, so the letters use a classic serif
// (Didot / Bodoni on Apple devices, Georgia elsewhere) instead of Bodoni Moda.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const out = (f) => path.join(root, 'public', f);

const GOLD = '#c9a46a';
const INK = '#0d1420';
const BG = '#f4f5f5';

// Same shapes as Logo.jsx
const petal = (r1, r2, w) => {
  const m = r1 + (r2 - r1) * 0.45;
  return `M${r1},0 C${m},${w} ${r2 - (r2 - r1) * 0.15},${w * 0.45} ${r2},0 C${r2 - (r2 - r1) * 0.15},${-w * 0.45} ${m},${-w} ${r1},0Z`;
};
const ring = (count, offset = 0) => Array.from({ length: count }, (_, i) => offset + (360 / count) * i);

function iconSvg({ background = false } = {}) {
  const petals = [
    ...ring(16).map((a) => `<path d="${petal(58, 97, 15)}" transform="rotate(${a})"/>`),
    ...ring(12, 15).map((a) => `<path d="${petal(34, 66, 12)}" transform="rotate(${a})"/>`),
  ].join('');
  const dots = ring(16, 11.25)
    .map((a) => `<circle r="3" transform="rotate(${a}) translate(92 0)"/>`)
    .join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-100 -100 200 200">
${background ? `<rect x="-100" y="-100" width="200" height="200" fill="${BG}"/>` : `<circle r="99" fill="${BG}"/>`}
<g fill="none" stroke="${GOLD}" stroke-width="3.2" stroke-linejoin="round" opacity="0.8">${petals}<circle r="56"/></g>
<g fill="${GOLD}" opacity="0.8">${dots}</g>
<g fill="${INK}" font-family="'Bodoni Moda', Didot, 'Bodoni 72', 'Bodoni MT', Georgia, 'Times New Roman', serif" font-weight="600" text-anchor="middle">
<text x="-21" y="36" font-size="128">S</text>
<text x="27" y="55" font-size="120">A</text>
</g>
</svg>
`;
}

const svg = iconSvg();
fs.writeFileSync(out('favicon.svg'), svg);
await sharp(Buffer.from(svg)).resize(32, 32).png().toFile(out('favicon-32.png'));
// Home-screen icon: square with the page colour behind (iOS rounds the corners).
await sharp(Buffer.from(iconSvg({ background: true }))).resize(180, 180).png().toFile(out('apple-touch-icon.png'));
console.log('Favicons written to public/');
