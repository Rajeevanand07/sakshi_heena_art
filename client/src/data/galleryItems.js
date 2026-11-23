// Combines the canvas layout (layout.js) with the converted photos (photos.json).
//
// Photos come from `npm run photos` (see scripts/optimize-photos.mjs). Each image
// slot gets the unused photo whose shape (portrait/landscape) is closest to it.
// To pin a specific photo to a slot, add `photo: 'file-name-slug'` to that item
// in layout.js.

import photos from './photos.json';
import { layout, BLOCK_WIDTH, BLOCK_HEIGHT } from './layout.js';

export { BLOCK_WIDTH, BLOCK_HEIGHT };

function assignPhotos(items, pool) {
  if (pool.length === 0) return items;
  const byName = new Map(pool.map((p) => [p.name, p]));
  const used = new Set(items.map((i) => i.photo).filter((n) => byName.has(n)));

  return items.map((item) => {
    if (item.type !== 'image') return item;
    if (item.photo && byName.has(item.photo)) return { ...item, image: byName.get(item.photo) };

    let candidates = pool.filter((p) => !used.has(p.name));
    if (candidates.length === 0) candidates = pool; // fewer photos than slots: reuse
    const slotRatio = Math.log(item.w / item.h);
    let best = candidates[0];
    let bestDiff = Infinity;
    for (const p of candidates) {
      const diff = Math.abs(Math.log(p.width / p.height) - slotRatio);
      if (diff < bestDiff) {
        best = p;
        bestDiff = diff;
      }
    }
    used.add(best.name);
    return { ...item, image: best };
  });
}

export const galleryItems = assignPhotos(layout, photos);
