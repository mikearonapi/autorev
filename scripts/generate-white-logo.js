import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function generateWhiteLogo() {
  const inputPath = path.join(process.cwd(), 'public/images/autorev-logo-trimmed.png');
  const outputPath = path.join(process.cwd(), 'public/images/autorev-logo-white.png');

  console.log('Processing logo...');
  
  try {
    const { data, info } = await sharp(inputPath)
      .raw()
      .toBuffer({ resolveWithObject: true });

    const pixelArray = new Uint8ClampedArray(data.buffer);
    
    // Iterate through every pixel
    for (let i = 0; i < pixelArray.length; i += 4) {
      const r = pixelArray[i];
      const g = pixelArray[i + 1];
      const b = pixelArray[i + 2];
      const a = pixelArray[i + 3];

      // Skip fully transparent pixels
      if (a === 0) continue;

      // Brand Navy is roughly R:26, G:77, B:110 (#1a4d6e)
      // Dark Navy is roughly R:15, G:51, B:71 (#0f3347)
      
      // Check if pixel is "dark/navy"
      // Logic: Low red, mid green/blue dominant
      const isNavy = (r < 60 && g < 100 && b < 130) && (b > r);

      if (isNavy) {
        // Change to White
        pixelArray[i] = 255;     // R
        pixelArray[i + 1] = 255; // G
        pixelArray[i + 2] = 255; // B
        // Alpha stays same
      }
    }

    await sharp(pixelArray, {
      raw: {
        width: info.width,
        height: info.height,
        channels: 4
      }
    })
    .png()
    .toFile(outputPath);

    console.log(`✅ Generated white logo at: ${outputPath}`);

  } catch (error) {
    console.error('Error generating logo:', error);
  }
}

generateWhiteLogo();


