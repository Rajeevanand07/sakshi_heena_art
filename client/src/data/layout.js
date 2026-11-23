// One "block" of the home page canvas. The canvas repeats this block in every
// direction, so it feels infinite. Coordinates are desktop pixels inside the
// block; on phones everything is scaled down.
//
// Two kinds of items:
//   image: x, y = top-left of the photo. A number sits 26px above it and the
//          caption ~60px below, so leave room for those.
//   text:  x, y = top-left of the heading block; h = space it may take up.
//
// Gaps are deliberately uneven (roughly 90–300px). After moving things,
// check for overlaps with:  npm run check-layout

export const BLOCK_WIDTH = 3270;
export const BLOCK_HEIGHT = 2490;

export const LABEL_SPACE = 26; // number above each image
export const CAPTION_SPACE = 60; // title + subtitle below each image

export const layout = [
  // ---- band 1 ----
  {
    id: 't1', type: 'text', x: 90, y: 100, w: 640, h: 240,
    heading: 'Sakshi Heena Art',
    meta: 'Heena artist',
    tag: 'Bridal, party, festival',
    body: 'Hand-drawn mehndi with natural heena. Every design is made for the person wearing it.',
  },
  { id: 1, type: 'image', x: 860, y: 70, w: 440, h: 290, title: 'Arabic vine', subtitle: 'Back hand' },
  { id: 2, type: 'image', x: 1530, y: 230, w: 320, h: 430, title: 'Bridal full hand', subtitle: 'Front, elbow length' },
  { id: 3, type: 'image', x: 2110, y: 50, w: 510, h: 340, title: 'Sangeet set', subtitle: 'Party guests' },
  { id: 4, type: 'image', x: 2840, y: 200, w: 290, h: 370, title: 'Indo-western', subtitle: 'Fingers and wrist' },

  // ---- band 2 ----
  { id: 5, type: 'image', x: 110, y: 520, w: 390, h: 510, title: 'Dulhan portrait', subtitle: 'Bridal, figure work' },
  { id: 6, type: 'image', x: 710, y: 660, w: 480, h: 320, title: 'Mandala palm', subtitle: 'Minimal' },
  {
    id: 't2', type: 'text', x: 1980, y: 580, w: 620, h: 240,
    heading: 'Bridal Mehndi',
    meta: 'Full hands and feet',
    tag: 'Signature work',
    body: 'Detailed dulhan designs with figures, portraits and hidden initials, planned with the bride before the wedding.',
  },
  { id: 7, type: 'image', x: 1340, y: 880, w: 360, h: 260, title: 'Floral trail', subtitle: 'Both hands' },
  { id: 8, type: 'image', x: 2760, y: 810, w: 410, h: 310, title: 'Couple names', subtitle: 'Hidden initials' },
  { id: 9, type: 'image', x: 1930, y: 990, w: 310, h: 410, title: 'Karwa Chauth', subtitle: 'Festival design' },

  // ---- band 3 ----
  { id: 10, type: 'image', x: 640, y: 1200, w: 510, h: 360, title: 'Bridal feet', subtitle: 'Ankle length' },
  { id: 11, type: 'image', x: 90, y: 1310, w: 320, h: 430, title: 'Jaal pattern', subtitle: 'Back hand' },
  {
    id: 't3', type: 'text', x: 1250, y: 1320, w: 580, h: 240,
    heading: 'Arabic & Minimal',
    meta: 'Quick, flowing designs',
    tag: 'Everyday',
    body: 'Bold vines, florals and open space. Light enough for a weekend, elegant enough for a party.',
  },
  { id: 12, type: 'image', x: 2390, y: 1310, w: 480, h: 340, title: 'Peacock motif', subtitle: 'Front hand' },

  // ---- band 4 ----
  { id: 13, type: 'image', x: 30, y: 1980, w: 260, h: 200, title: 'Kids special', subtitle: 'Small motifs' },
  { id: 14, type: 'image', x: 420, y: 1950, w: 370, h: 270, title: 'Simple Eid', subtitle: 'Quick design' },
  { id: 15, type: 'image', x: 950, y: 1780, w: 320, h: 440, title: 'Teej special', subtitle: 'Elbow length' },
  { id: 16, type: 'image', x: 1490, y: 1770, w: 510, h: 340, title: 'Engagement set', subtitle: 'Both hands' },
  {
    id: 't4', type: 'text', x: 2160, y: 1840, w: 620, h: 240,
    heading: 'Festival Designs',
    meta: 'Karwa Chauth, Teej, Eid',
    tag: 'Seasonal',
    body: 'Festive patterns for the whole family, from simple palms to full hands.',
  },
  { id: 17, type: 'image', x: 2900, y: 1840, w: 270, h: 360, title: 'Finger tips', subtitle: 'Minimal' },
];

// The vertical space an item really occupies (photo + number + caption).
export function itemBox(item) {
  if (item.type === 'text') return { x: item.x, y: item.y, w: item.w, h: item.h };
  return { x: item.x, y: item.y - LABEL_SPACE, w: item.w, h: item.h + LABEL_SPACE + CAPTION_SPACE };
}
