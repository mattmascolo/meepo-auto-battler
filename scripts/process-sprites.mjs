#!/usr/bin/env node
/**
 * Sprite Sheet Processor
 *
 * Processes sprite sheets by:
 * 1. Splitting into individual frames
 * 2. Removing background (making transparent)
 * 3. Organizing into proper folder structure
 *
 * Usage: node scripts/process-sprites.mjs <character-folder>
 * Example: node scripts/process-sprites.mjs public/characters/moo-man
 */

import sharp from 'sharp';
import fs from 'fs/promises';
import path from 'path';

// Configuration
const FRAME_SIZE = 128; // Each frame is 128x128
const BG_TOLERANCE = 25; // Color tolerance for background removal (tighter)

/**
 * Detect the most common corner color as background
 */
async function detectBackgroundColor(inputBuffer) {
  const { data, info } = await sharp(inputBuffer)
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Sample corners to find background color
  const corners = [
    { x: 0, y: 0 },
    { x: info.width - 1, y: 0 },
    { x: 0, y: info.height - 1 },
    { x: info.width - 1, y: info.height - 1 }
  ];

  const colors = corners.map(({ x, y }) => {
    const idx = (y * info.width + x) * info.channels;
    return {
      r: data[idx],
      g: data[idx + 1],
      b: data[idx + 2]
    };
  });

  // Return most common corner color (usually all same for solid bg)
  return colors[0];
}

/**
 * Check if a pixel matches the background color within tolerance
 */
function isBackgroundPixel(data, idx, bgColor, tolerance) {
  const r = data[idx];
  const g = data[idx + 1];
  const b = data[idx + 2];

  const rDiff = Math.abs(r - bgColor.r);
  const gDiff = Math.abs(g - bgColor.g);
  const bDiff = Math.abs(b - bgColor.b);

  return rDiff <= tolerance && gDiff <= tolerance && bDiff <= tolerance;
}

/**
 * Remove background using flood fill from edges only
 * This preserves white pixels that are part of the sprite (like cow spots)
 */
async function removeBackground(inputBuffer, bgColor, tolerance = BG_TOLERANCE) {
  const { data, info } = await sharp(inputBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const newData = Buffer.from(data);

  // Track which pixels to make transparent (flood filled from edges)
  const toRemove = new Set();
  const visited = new Set();

  // BFS flood fill from all edge pixels
  const queue = [];

  // Add all edge pixels that match background color
  for (let x = 0; x < width; x++) {
    // Top edge
    queue.push({ x, y: 0 });
    // Bottom edge
    queue.push({ x, y: height - 1 });
  }
  for (let y = 0; y < height; y++) {
    // Left edge
    queue.push({ x: 0, y });
    // Right edge
    queue.push({ x: width - 1, y });
  }

  // Flood fill
  while (queue.length > 0) {
    const { x, y } = queue.shift();
    const key = `${x},${y}`;

    if (visited.has(key)) continue;
    if (x < 0 || x >= width || y < 0 || y >= height) continue;

    visited.add(key);

    const idx = (y * width + x) * 4;

    if (!isBackgroundPixel(data, idx, bgColor, tolerance)) continue;

    // This is a background pixel connected to edge - mark for removal
    toRemove.add(key);

    // Add neighbors to queue
    queue.push({ x: x - 1, y });
    queue.push({ x: x + 1, y });
    queue.push({ x, y: y - 1 });
    queue.push({ x, y: y + 1 });
  }

  // Make marked pixels transparent
  for (const key of toRemove) {
    const [x, y] = key.split(',').map(Number);
    const idx = (y * width + x) * 4;
    newData[idx + 3] = 0; // Set alpha to 0
  }

  return sharp(newData, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4
    }
  }).png().toBuffer();
}

/**
 * Split sprite sheet into individual frames
 */
async function splitSpriteSheet(imagePath, frameWidth = FRAME_SIZE, frameHeight = FRAME_SIZE) {
  const image = sharp(imagePath);
  const metadata = await image.metadata();

  const framesX = Math.floor(metadata.width / frameWidth);
  const framesY = Math.floor(metadata.height / frameHeight);
  const frames = [];

  console.log(`  Sheet: ${metadata.width}x${metadata.height} -> ${framesX}x${framesY} frames`);

  for (let y = 0; y < framesY; y++) {
    for (let x = 0; x < framesX; x++) {
      const frameBuffer = await sharp(imagePath)
        .extract({
          left: x * frameWidth,
          top: y * frameHeight,
          width: frameWidth,
          height: frameHeight
        })
        .toBuffer();

      frames.push({
        index: y * framesX + x,
        buffer: frameBuffer
      });
    }
  }

  return frames;
}

/**
 * Process a single animation sprite sheet
 */
async function processAnimation(sheetPath, outputDir, animName) {
  console.log(`\nProcessing: ${animName}`);

  // Split into frames first
  const frames = await splitSpriteSheet(sheetPath);
  console.log(`  Extracted ${frames.length} frames`);

  // Detect background color from first frame
  const bgColor = await detectBackgroundColor(frames[0].buffer);
  console.log(`  Background color: rgb(${bgColor.r}, ${bgColor.g}, ${bgColor.b})`);

  // Create output directory
  const animOutputDir = path.join(outputDir, animName);
  await fs.mkdir(animOutputDir, { recursive: true });

  // Process each frame
  for (const frame of frames) {
    const transparentBuffer = await removeBackground(frame.buffer, bgColor);
    const outputPath = path.join(animOutputDir, `${animName}_${String(frame.index).padStart(2, '0')}.png`);
    await sharp(transparentBuffer).toFile(outputPath);
    console.log(`  Saved: ${path.basename(outputPath)}`);
  }

  return frames.length;
}

/**
 * Process all sprite sheets in a character folder
 */
async function processCharacter(charFolder) {
  const charName = path.basename(charFolder);
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Processing character: ${charName}`);
  console.log(`${'='.repeat(50)}`);

  // Create processed output directory
  const processedDir = path.join(charFolder, 'processed');
  await fs.mkdir(processedDir, { recursive: true });

  // Find all animation folders
  const entries = await fs.readdir(charFolder, { withFileTypes: true });
  const animFolders = entries.filter(e => e.isDirectory() && e.name !== 'processed');

  let totalFrames = 0;
  const animations = {};

  for (const folder of animFolders) {
    const animDir = path.join(charFolder, folder.name);
    const files = await fs.readdir(animDir);
    const spriteSheets = files.filter(f => /\.(png|jpg|jpeg|webp)$/i.test(f));

    for (const sheet of spriteSheets) {
      const sheetPath = path.join(animDir, sheet);
      const frameCount = await processAnimation(sheetPath, processedDir, folder.name);
      totalFrames += frameCount;
      animations[folder.name] = frameCount;
    }
  }

  // Generate animation manifest
  const manifest = {
    character: charName,
    frameSize: FRAME_SIZE,
    animations: Object.entries(animations).map(([name, frameCount]) => ({
      name,
      frameCount,
      files: Array.from({ length: frameCount }, (_, i) =>
        `${name}/${name}_${String(i).padStart(2, '0')}.png`
      )
    }))
  };

  await fs.writeFile(
    path.join(processedDir, 'manifest.json'),
    JSON.stringify(manifest, null, 2)
  );

  console.log(`\n${'='.repeat(50)}`);
  console.log(`Complete! Processed ${totalFrames} total frames`);
  console.log(`Output: ${processedDir}`);
  console.log(`Manifest: ${path.join(processedDir, 'manifest.json')}`);
  console.log(`${'='.repeat(50)}\n`);

  return manifest;
}

// Main
const charFolder = process.argv[2];

if (!charFolder) {
  console.log('Usage: node scripts/process-sprites.mjs <character-folder>');
  console.log('Example: node scripts/process-sprites.mjs public/characters/moo-man');
  process.exit(1);
}

processCharacter(charFolder).catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
