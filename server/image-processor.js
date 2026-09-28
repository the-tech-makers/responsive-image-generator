import { mkdir, stat } from 'node:fs/promises';
import { basename, extname, join } from 'node:path';
import sharp from 'sharp';
import { writeFile } from 'node:fs/promises';
import { compressWithTinyPng } from './tinypng.js';

const FORMAT_CONFIG = {
  webp: { extension: 'webp', mime: 'image/webp' },
  avif: { extension: 'avif', mime: 'image/avif' },
  jpeg: { extension: 'jpg', mime: 'image/jpeg' },
  png: { extension: 'png', mime: 'image/png' },
};

function normalizeWidths(widths) {
  return [...new Set(
    widths
      .map(Number)
      .filter((width) => Number.isInteger(width) && width > 0 && width <= 10000),
  )].sort((a, b) => a - b);
}

function applyFormat(image, format, options) {
  if (format === 'webp') {
    return image.webp(options.lossless ? { lossless: true } : { quality: options.quality });
  }
  if (format === 'avif') {
    return image.avif(options.lossless ? { lossless: true } : { quality: options.quality });
  }
  if (format === 'jpeg') {
    return image.jpeg(options.lossless ? { quality: 100 } : { quality: options.quality, mozjpeg: true });
  }
  return image.png(options.lossless ? { compressionLevel: 9 } : { compressionLevel: 6, quality: options.quality });
}

export async function processImage({ sourcePath, outputDir, widths, formats, quality = 80, lossless = false, stripMetadata = true, noUpscale = true, tinyPng = null }) {
  await mkdir(outputDir, { recursive: true });

  const metadata = await sharp(sourcePath).metadata();
  const sourceWidth = metadata.width || 0;
  const sourceHeight = metadata.height || 0;
  const requestedWidths = normalizeWidths(widths);

  const actualWidths = noUpscale
    ? requestedWidths.filter((width) => width <= sourceWidth)
    : requestedWidths;

  const finalWidths = actualWidths.length ? actualWidths : [sourceWidth];
  const sourceStem = basename(sourcePath, extname(sourcePath));
  const results = [];

  if (tinyPng?.enabled) {
    const format = tinyPng.format;

    for (const width of finalWidths) {
      let image = sharp(sourcePath).resize({
        width,
        withoutEnlargement: noUpscale,
        fit: 'inside',
      });

      if (!stripMetadata) image = image.withMetadata();

      const resizedBuffer = await image.png({ compressionLevel: 9 }).toBuffer();
      const compressedBuffer = await compressWithTinyPng(resizedBuffer, format);
      const outputName = `${sourceStem}-${width}w.${FORMAT_CONFIG[format].extension}`;
      const outputPath = join(outputDir, outputName);

      await writeFile(outputPath, compressedBuffer);
      const outputStat = await stat(outputPath);

      results.push({
        filename: outputName,
        path: outputPath,
        width,
        height: sourceWidth ? Math.round(sourceHeight * (width / sourceWidth)) : 0,
        format,
        mime: FORMAT_CONFIG[format].mime,
        size: outputStat.size,
        sourceSize: resizedBuffer.length,
        originalSize: metadata.size || null,
      });
    }

    return { sourceWidth, sourceHeight, results };
  }

  for (const format of formats) {
    if (!FORMAT_CONFIG[format]) continue;

    for (const width of finalWidths) {
      const outputName = `${sourceStem}-${width}w.${FORMAT_CONFIG[format].extension}`;
      const outputPath = join(outputDir, outputName);

      let image = sharp(sourcePath).resize({
        width,
        withoutEnlargement: noUpscale,
        fit: 'inside',
      });

      if (!stripMetadata) image = image.withMetadata();
      image = applyFormat(image, format, { quality, lossless });
      await image.toFile(outputPath);

      const outputStat = await stat(outputPath);
      results.push({
        filename: outputName,
        path: outputPath,
        width,
        height: sourceWidth ? Math.round(sourceHeight * (width / sourceWidth)) : 0,
        format,
        mime: FORMAT_CONFIG[format].mime,
        size: outputStat.size,
        sourceSize: metadata.size || null,
        originalSize: metadata.size || null,
      });
    }
  }

  return { sourceWidth, sourceHeight, results };
}
