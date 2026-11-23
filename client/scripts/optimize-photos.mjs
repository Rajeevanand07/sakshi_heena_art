// Turns the original photos in `photos-original/` into small, fast WebP files.
//
//   npm run photos
//
// For each photo it writes two sizes to `public/gallery/` (600px and 1200px wide,
// so phones and retina screens both get a sharp image without wasting data) and
// a tiny blurred preview that shows while the real image loads.
// The list of photos is saved to `src/data/photos.json`, which the gallery reads.

import { readdir, mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const inputDir = path.join(root, 'photos-original');
const outputDir = path.join(root, 'public', 'gallery');
const manifestPath = path.join(root, 'src', 'data', 'photos.json');

const SIZES = [600, 1200];
const QUALITY = 72;
const EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.tif', '.tiff', '.heic', '.heif']);

const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/\.[^.]+$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'photo';

const files = (await readdir(inputDir))
  .filter((f) => EXTENSIONS.has(path.extname(f).toLowerCase()))
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (files.length === 0) {
  console.log(`No photos found in ${inputDir}. Add some and run again.`);
  process.exit(0);
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

const photos = [];
const usedSlugs = new Set();

for (const file of files) {
  let slug = slugify(file);
  for (let n = 2; usedSlugs.has(slug); n++) slug = `${slugify(file)}-${n}`;
  usedSlugs.add(slug);

  try {
    const inputPath = path.join(inputDir, file);
    // .rotate() applies the phone's EXIF orientation so photos aren't sideways.
    const open = () => sharp(inputPath).rotate();
    const meta = await sharp(inputPath).metadata();
    const sideways = (meta.orientation ?? 1) >= 5;
    const width = sideways ? meta.height : meta.width;
    const height = sideways ? meta.width : meta.height;

    const srcSet = [];
    for (const size of SIZES) {
      const w = Math.min(size, width);
      if (srcSet.some((s) => s.w === w)) continue; // photo smaller than this size
      const outName = `${slug}-${size}.webp`;
      await open().resize({ width: w }).webp({ quality: QUALITY }).toFile(path.join(outputDir, outName));
      srcSet.push({ src: `/gallery/${outName}`, w });
    }

    const blurBuf = await open().resize({ width: 16 }).blur(1).webp({ quality: 40 }).toBuffer();

    photos.push({
      name: slug,
      width,
      height,
      src: srcSet[0].src,
      srcSet,
      blur: `data:image/webp;base64,${blurBuf.toString('base64')}`,
    });
    console.log(`✓ ${file}  (${width}×${height})`);
  } catch (err) {
    console.warn(`✗ Skipped ${file}: ${err.message}`);
  }
}

await writeFile(manifestPath, JSON.stringify(photos, null, 2) + '\n');
console.log(`\n${photos.length} photo(s) ready. List saved to src/data/photos.json`);
