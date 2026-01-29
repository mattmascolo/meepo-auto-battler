/**
 * Sprite Processing Script for Project Meepo
 *
 * Processes PNG images:
 * 1. Trims transparent borders
 * 2. Resizes to target size (128x128 for game sprites)
 * 3. Outputs to public/sprites for use in Phaser
 *
 * Usage: node scripts/process_sprites.js
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.join(__dirname, '../assets/sprites');
const OUTPUT_DIR = path.join(__dirname, '../public/sprites');
const TARGET_SIZE = 128; // Target sprite size in pixels

async function processSprite(inputPath, outputPath) {
  const filename = path.basename(inputPath);
  console.log(`Processing: ${filename}`);

  try {
    // Read image and get metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();
    console.log(`  Original size: ${metadata.width}x${metadata.height}`);

    // Trim transparent borders, then resize
    const processed = await image
      .trim() // Removes transparent borders
      .resize(TARGET_SIZE, TARGET_SIZE, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 } // Transparent background
      })
      .png()
      .toBuffer();

    // Get new metadata
    const processedImage = sharp(processed);
    const newMetadata = await processedImage.metadata();
    console.log(`  Processed size: ${newMetadata.width}x${newMetadata.height}`);

    // Write to output
    await sharp(processed).toFile(outputPath);
    console.log(`  Saved: ${outputPath}`);

    return true;
  } catch (error) {
    console.error(`  Error processing ${filename}: ${error.message}`);
    return false;
  }
}

async function main() {
  // Create output directory
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
    console.log(`Created output directory: ${OUTPUT_DIR}`);
  }

  // Find all PNG files in input directory
  const files = fs.readdirSync(INPUT_DIR)
    .filter(f => f.endsWith('.png'));

  console.log(`Found ${files.length} PNG files to process\n`);

  let success = 0;
  let failed = 0;

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const outputPath = path.join(OUTPUT_DIR, file);

    if (await processSprite(inputPath, outputPath)) {
      success++;
    } else {
      failed++;
    }
    console.log('');
  }

  console.log(`\nDone! Processed ${success} files, ${failed} failed.`);
}

main().catch(console.error);
