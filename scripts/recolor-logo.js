import sharp from 'sharp';
import fs from 'fs';

const inputPath = 'generated-images/logo/autorev-logo-tachometer-3-2025-12-11T15-10-39.png';
const outputPath = 'public/images/autorev-logo-colored.png';

async function recolorLogo() {
  console.log('🎨 Recoloring logo...');
  
  const image = sharp(inputPath);
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  
  const w = info.width;
  const h = info.height;
  
  // Colors
  const ORANGE = { r: 255, g: 140, b: 0 }; // Bright orange for speed/needle
  const RED = { r: 220, g: 20, b: 60 };    // Deep red for rev lines
  const BLUE = { r: 26, g: 58, b: 82 };    // Dark blue for 'A' and gauge
  
  // Helper to check pixel color
  const isRedish = (r, g, b) => r > 150 && g < 100 && b < 100;
  const isBlueish = (r, g, b) => r < 100 && g < 120 && b < 140 && (b > r || g > r);
  const isBackground = (r, g, b) => r > 200 && g > 200 && b > 200; // White/light

  // 1. First pass: Identify connected red components to distinguish needle from dashes
  const visited = new Int8Array(w * h); // 0=unvisited, 1=visited
  const components = [];
  
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx], g = data[idx+1], b = data[idx+2];
      
      // If it's a red pixel and not visited
      if (isRedish(r, g, b) && !visited[y * w + x]) {
        // Start flood fill to find component size and pixels
        const component = { pixels: [], minX: x, maxX: x, minY: y, maxY: y };
        const stack = [[x, y]];
        visited[y * w + x] = 1;
        
        while (stack.length > 0) {
          const [cx, cy] = stack.pop();
          component.pixels.push((cy * w + cx) * 4);
          
          if (cx < component.minX) component.minX = cx;
          if (cx > component.maxX) component.maxX = cx;
          if (cy < component.minY) component.minY = cy;
          if (cy > component.maxY) component.maxY = cy;
          
          // Check neighbors
          const neighbors = [[cx+1, cy], [cx-1, cy], [cx, cy+1], [cx, cy-1]];
          for (const [nx, ny] of neighbors) {
            if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
              const nIdx = (ny * w + nx) * 4;
              if (!visited[ny * w + nx] && isRedish(data[nIdx], data[nIdx+1], data[nIdx+2])) {
                visited[ny * w + nx] = 1;
                stack.push([nx, ny]);
              }
            }
          }
        }
        components.push(component);
      }
    }
  }
  
  console.log(`Found ${components.length} red components`);
  
  // Sort components by size (pixel count)
  // The needle should be the largest red component (or one of the largest)
  // The dashes are smaller.
  components.sort((a, b) => b.pixels.length - a.pixels.length);
  
  // The largest component is likely the needle. Let's color it ORANGE.
  // The others are dashes. Color them RED.
  
  if (components.length > 0) {
    // Needle -> Orange
    const needle = components[0];
    console.log('Coloring needle Orange (size: ' + needle.pixels.length + ')');
    for (const idx of needle.pixels) {
      data[idx] = ORANGE.r;
      data[idx+1] = ORANGE.g;
      data[idx+2] = ORANGE.b;
      data[idx+3] = 255; // Ensure opacity
    }
    
    // Remaining components -> Red (Rev marks)
    for (let i = 1; i < components.length; i++) {
      const dash = components[i];
      console.log('Coloring dash Red (size: ' + dash.pixels.length + ')');
      for (const idx of dash.pixels) {
        data[idx] = RED.r;
        data[idx+1] = RED.g;
        data[idx+2] = RED.b;
        data[idx+3] = 255;
      }
    }
  }

  // 2. Clean up Blue parts and Background
  let removedBg = 0;
  for (let i = 0; i < w * h; i++) {
    const idx = i * 4;
    const r = data[idx], g = data[idx+1], b = data[idx+2];
    
    // Skip if we just colored it (it was redish)
    // We can check if it matches our new Orange or Red
    if ((r === ORANGE.r && g === ORANGE.g && b === ORANGE.b) || 
        (r === RED.r && g === RED.g && b === RED.b)) {
      continue;
    }
    
    if (isBlueish(r, g, b)) {
      // Enforce standard Blue color for consistency
      data[idx] = BLUE.r;
      data[idx+1] = BLUE.g;
      data[idx+2] = BLUE.b;
      data[idx+3] = 255;
    } else {
      // Assume everything else is background -> Make Transparent
      data[idx+3] = 0;
      removedBg++;
    }
  }

  await sharp(data, {
    raw: { width: w, height: h, channels: 4 }
  }).png().toFile(outputPath);
  
  console.log(`✅ Saved to ${outputPath}`);
}

recolorLogo();
