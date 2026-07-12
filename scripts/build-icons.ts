/**
 * Rasterize public/icon.svg into the PWA PNG icons (192 and 512 px).
 *
 * The SVG is the single source of truth; the PNGs are derived and committed so
 * the build and Netlify deploy need no image toolchain. Regenerate after
 * editing the SVG with `npm run build:icons`.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');

async function main(): Promise<void> {
  const svg = await readFile(resolve(publicDir, 'icon.svg'));
  for (const size of [192, 512]) {
    const png = await sharp(svg).resize(size, size).png().toBuffer();
    await writeFile(resolve(publicDir, `icon-${size}.png`), png);
    console.log(`wrote icon-${size}.png`);
  }
}

void main();
