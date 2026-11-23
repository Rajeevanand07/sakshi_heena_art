// Checks the canvas layout for overlaps and too-small gaps, including against
// the repeated copies of the block on every side.
//   npm run check-layout

import { layout, itemBox, BLOCK_WIDTH, BLOCK_HEIGHT } from '../src/data/layout.js';

const MIN_GAP = 90;
const boxes = layout.map((item) => ({ id: item.id, ...itemBox(item) }));

// Gap between two boxes: 0 or more = space between them, negative = overlap.
const gap = (a, b) => {
  const gx = Math.max(b.x - (a.x + a.w), a.x - (b.x + b.w));
  const gy = Math.max(b.y - (a.y + a.h), a.y - (b.y + b.h));
  return Math.max(gx, gy);
};

const problems = [];
for (const [ia, a] of boxes.entries()) {
  if (a.w > BLOCK_WIDTH - MIN_GAP || a.h > BLOCK_HEIGHT - MIN_GAP) problems.push(`${a.id} is too big for the block`);
  for (const [ib, b] of boxes.entries()) {
    for (const dx of [-1, 0, 1]) {
      for (const dy of [-1, 0, 1]) {
        if (dx === 0 && dy === 0 && ia >= ib) continue; // itself, or pair already checked
        const shifted = { ...b, x: b.x + dx * BLOCK_WIDTH, y: b.y + dy * BLOCK_HEIGHT };
        const g = gap(a, shifted);
        if (g < MIN_GAP) {
          const where = dx || dy ? ` (copy at ${dx},${dy})` : '';
          problems.push(`${a.id} ↔ ${b.id}${where}: ${g < 0 ? 'OVERLAP' : 'gap'} ${g}px`);
        }
      }
    }
  }
}

if (problems.length) {
  console.log(`${problems.length} problem(s), minimum gap is ${MIN_GAP}px:\n` + [...new Set(problems)].join('\n'));
  process.exit(1);
}
console.log(`Layout OK: ${boxes.length} items, every gap at least ${MIN_GAP}px.`);
