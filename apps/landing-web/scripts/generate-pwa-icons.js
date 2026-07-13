// Regenerates apps/landing-web/public/icons/*.png from public/logo-bidku.png.
// Run manually with `node scripts/generate-pwa-icons.js` from apps/landing-web
// whenever the source logo changes; the output PNGs are committed like any
// other static asset.
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const SRC = path.join(__dirname, "..", "public", "logo-bidku.png");
const OUT_DIR = path.join(__dirname, "..", "public", "icons");
const WHITE = { r: 255, g: 255, b: 255, alpha: 1 };

// logo-bidku.png is 366x448: the triangular mark sits in the top ~300px,
// with the "BIDKU AUCTION COMPANY" wordmark below it. The wordmark is
// illegible at icon sizes, so only the mark is used for app icons.
const MARK_CROP = { left: 0, top: 0, width: 366, height: 300 };

async function makeIcon(markBuffer, size, markFraction, outFile) {
  const innerSize = Math.round(size * markFraction);
  const mark = await sharp(markBuffer)
    .resize(innerSize, innerSize, { fit: "inside" })
    .toBuffer();
  const { width, height } = await sharp(mark).metadata();

  await sharp({
    create: { width: size, height: size, channels: 4, background: WHITE },
  })
    .composite([
      {
        input: mark,
        left: Math.round((size - width) / 2),
        top: Math.round((size - height) / 2),
      },
    ])
    .png()
    .toFile(outFile);

  console.log("wrote", path.relative(process.cwd(), outFile));
}

async function main() {
  await fs.promises.mkdir(OUT_DIR, { recursive: true });
  const markBuffer = await sharp(SRC).extract(MARK_CROP).toBuffer();

  // Regular icons (purpose "any"): modest padding, mark reads clearly.
  await makeIcon(markBuffer, 192, 0.72, path.join(OUT_DIR, "icon-192.png"));
  await makeIcon(markBuffer, 512, 0.72, path.join(OUT_DIR, "icon-512.png"));
  // Apple touch icon: iOS applies its own rounding, similar padding to "any".
  await makeIcon(markBuffer, 180, 0.72, path.join(OUT_DIR, "apple-touch-icon.png"));
  // Maskable: OS launchers clip to arbitrary shapes (circle/squircle/rounded
  // square). Content must stay inside the ~80%-diameter safe-zone circle; for
  // a square bounding box that means side length <= 0.8/sqrt(2) ~= 0.566 of
  // the canvas, so 0.55 keeps it safely inside on any mask shape.
  await makeIcon(markBuffer, 512, 0.55, path.join(OUT_DIR, "icon-512-maskable.png"));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
