import { Color } from './color.js';

/**
 * Load and colorize the workspace icon
 * @param hex The color to apply to the icon
 * @returns The colorized icon as ImageData
 */
export const loadIcon = async (hex: HexColor): Promise<ImageData> => {
  const color = Color.from(hex);

  // Load the base icon image
  const img = new Image();
  img.src = '/dist/icon-128.png';

  // Wait for image to load
  await new Promise((resolve, reject) => {
    img.onload = resolve;
    img.onerror = reject;
  });

  // Create canvas and context
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  // Set canvas size to match image
  canvas.width = img.width;
  canvas.height = img.height;

  // Draw the original image
  ctx.drawImage(img, 0, 0);

  // Get image data
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Apply color tinting
  // We'll colorize by replacing non-transparent pixels with the target color
  // while preserving the alpha channel and luminance
  for (let i = 0; i < data.length; i += 4) {
    const alpha = data[i + 3];

    // Only process non-transparent pixels
    if (alpha > 0) {
      // Get original luminance (grayscale value)
      const originalR = data[i];
      const originalG = data[i + 1];
      const originalB = data[i + 2];

      // Calculate luminance using standard formula
      const luminance = 0.299 * originalR + 0.587 * originalG + 0.114 * originalB;
      const factor = luminance / 255;

      // Apply the target color with luminance-based intensity
      data[i] = color.r * factor; // Red
      data[i + 1] = color.g * factor; // Green
      data[i + 2] = color.b * factor; // Blue
      // Alpha stays the same
    }
  }

  return imageData;
};
