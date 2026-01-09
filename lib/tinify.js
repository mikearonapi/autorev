/**
 * TinyPNG/TinyJPG Compression Service
 * 
 * Compresses images using the TinyPNG API before storing.
 * Supports JPEG, PNG, and WebP formats.
 * 
 * @module lib/tinify
 */

const TINIFY_API_KEY = process.env.TINIFY_API_KEY;
const TINIFY_API_URL = 'https://api.tinify.com/shrink';

// Supported image types for compression
const COMPRESSIBLE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

// Skip compression if savings would be less than this percentage
const MIN_SAVINGS_THRESHOLD = 0.05; // 5%

/**
 * Check if a content type can be compressed by TinyPNG
 * @param {string} contentType - MIME type of the file
 * @returns {boolean}
 */
export function isCompressible(contentType) {
  return COMPRESSIBLE_TYPES.includes(contentType);
}

/**
 * Compress an image buffer using TinyPNG API
 * 
 * @param {Buffer|ArrayBuffer} imageBuffer - The image data to compress
 * @param {Object} options - Compression options
 * @param {string} [options.contentType] - MIME type for logging
 * @param {string} [options.filename] - Filename for logging
 * @returns {Promise<{buffer: Buffer, originalSize: number, compressedSize: number, savings: number} | null>}
 *          Returns compressed result or null if compression failed/skipped
 */
export async function compressImage(imageBuffer, options = {}) {
  const { contentType = 'image/jpeg', filename = 'unknown' } = options;

  // Check if API key is configured
  if (!TINIFY_API_KEY) {
    console.warn('[Tinify] API key not configured, skipping compression');
    return null;
  }

  // Check if type is compressible
  if (!isCompressible(contentType)) {
    console.log(`[Tinify] Skipping non-compressible type: ${contentType}`);
    return null;
  }

  const buffer = Buffer.isBuffer(imageBuffer) 
    ? imageBuffer 
    : Buffer.from(imageBuffer);
  
  const originalSize = buffer.length;

  // Skip very small images (under 10KB) - not worth the API call
  if (originalSize < 10 * 1024) {
    console.log(`[Tinify] Skipping small image (${(originalSize / 1024).toFixed(1)}KB): ${filename}`);
    return null;
  }

  try {
    // Send to TinyPNG API
    const response = await fetch(TINIFY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`api:${TINIFY_API_KEY}`).toString('base64')}`,
        'Content-Type': contentType,
      },
      body: buffer,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Tinify] API error (${response.status}): ${errorText}`);
      return null;
    }

    const result = await response.json();

    // Check if compression achieved meaningful savings
    const compressedSize = result.output.size;
    const savings = (originalSize - compressedSize) / originalSize;

    if (savings < MIN_SAVINGS_THRESHOLD) {
      console.log(`[Tinify] Minimal savings (${(savings * 100).toFixed(1)}%), skipping: ${filename}`);
      return null;
    }

    // Download compressed image
    const compressedResponse = await fetch(result.output.url);
    if (!compressedResponse.ok) {
      console.error(`[Tinify] Failed to download compressed image: ${filename}`);
      return null;
    }

    const compressedBuffer = Buffer.from(await compressedResponse.arrayBuffer());

    console.log(
      `[Tinify] Compressed ${filename}: ${(originalSize / 1024).toFixed(0)}KB → ${(compressedSize / 1024).toFixed(0)}KB (-${(savings * 100).toFixed(1)}%)`
    );

    return {
      buffer: compressedBuffer,
      originalSize,
      compressedSize,
      savings,
    };

  } catch (error) {
    console.error(`[Tinify] Compression failed for ${filename}:`, error.message);
    return null;
  }
}

/**
 * Compress a File/Blob object
 * 
 * @param {File|Blob} file - The file to compress
 * @returns {Promise<{blob: Blob, originalSize: number, compressedSize: number, savings: number} | null>}
 */
export async function compressFile(file) {
  const arrayBuffer = await file.arrayBuffer();
  
  const result = await compressImage(arrayBuffer, {
    contentType: file.type,
    filename: file.name || 'upload',
  });

  if (!result) {
    return null;
  }

  // Convert buffer back to Blob for upload
  const compressedBlob = new Blob([result.buffer], { type: file.type });

  return {
    blob: compressedBlob,
    originalSize: result.originalSize,
    compressedSize: result.compressedSize,
    savings: result.savings,
  };
}
