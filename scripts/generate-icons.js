/**
 * Generate PWA icons from SVG source
 *
 * Usage: node scripts/generate-icons.js
 *
 * Requires: npm install sharp
 */

const fs = require('fs');
const path = require('path');

async function generateIcons() {
  try {
    // Try to import sharp
    const sharp = require('sharp');

    const svgPath = path.join(__dirname, '../public/icon.svg');
    const svgBuffer = fs.readFileSync(svgPath);

    const sizes = [192, 384, 512];

    console.log('Generating PWA icons from icon.svg...\n');

    for (const size of sizes) {
      const outputPath = path.join(__dirname, `../public/icon-${size}x${size}.png`);

      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated: icon-${size}x${size}.png`);
    }

    console.log('\n✓ All icons generated successfully!');
    console.log('\nNext steps:');
    console.log('1. Verify the icons look correct');
    console.log('2. Commit the changes: git add public/icon*.png public/icon.svg');

  } catch (error) {
    if (error.code === 'MODULE_NOT_FOUND') {
      console.error('\n❌ Error: "sharp" module not found');
      console.log('\nPlease install sharp first:');
      console.log('  npm install --save-dev sharp');
      console.log('\nThen run this script again:');
      console.log('  node scripts/generate-icons.js');
    } else {
      console.error('Error generating icons:', error);
    }
    process.exit(1);
  }
}

generateIcons();
