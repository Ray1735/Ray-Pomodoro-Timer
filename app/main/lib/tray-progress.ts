// Chinese fork: menu bar progress ring.
//
// Draws the menu bar icon as a thin circle with a filled wedge inside showing
// how much of the current focus period is left. The wedge starts at 12 o'clock
// and shrinks as time passes, like a kitchen timer.
//
// Output is raw pixel data: black with an alpha channel only, which macOS turns
// into a "template image" that matches light and dark menu bars. Alpha sits in
// the fourth byte of each pixel for both BGRA and RGBA, so the colour channel
// order doesn't matter.

export const RING_SIZE_PX = 36; // 18 pt at 2x
export const RING_STEPS = 60; // redraw at most 60 times per focus period

const SUPERSAMPLE = 4; // 4x4 samples per pixel for smooth edges

export function drawProgressRing(
  fraction: number,
  size: number = RING_SIZE_PX,
): Buffer {
  const remaining = Math.min(1, Math.max(0, fraction));
  const limitAngle = remaining * 2 * Math.PI;
  const center = size / 2;
  const outerRadius = size * 0.46;
  const ringWidth = size * 0.08;
  const innerRadius = outerRadius - ringWidth;
  const wedgeRadius = size * 0.32;

  const pixels = Buffer.alloc(size * size * 4);
  const samples = SUPERSAMPLE * SUPERSAMPLE;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      let covered = 0;
      for (let sy = 0; sy < SUPERSAMPLE; sy++) {
        for (let sx = 0; sx < SUPERSAMPLE; sx++) {
          const dx = x + (sx + 0.5) / SUPERSAMPLE - center;
          const dy = y + (sy + 0.5) / SUPERSAMPLE - center;
          const distance = Math.hypot(dx, dy);

          const inRing = distance <= outerRadius && distance >= innerRadius;

          // Angle measured clockwise from 12 o'clock, in [0, 2π).
          let angle = Math.atan2(dx, -dy);
          if (angle < 0) angle += 2 * Math.PI;
          const inWedge =
            distance <= wedgeRadius && (remaining >= 1 || angle < limitAngle);

          if (inRing || inWedge) covered++;
        }
      }
      pixels[(y * size + x) * 4 + 3] = Math.round((covered / samples) * 255);
    }
  }

  return pixels;
}

// Quantise the fraction so the icon is only redrawn when it visibly changes.
export function progressStep(fraction: number): number {
  return Math.ceil(Math.min(1, Math.max(0, fraction)) * RING_STEPS);
}
