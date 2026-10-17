import { describe, expect, it } from "vitest";
import {
  drawProgressRing,
  progressStep,
  RING_SIZE_PX,
  RING_STEPS,
} from "./tray-progress";

const size = RING_SIZE_PX;
const center = size / 2;

function alphaAt(pixels: Buffer, x: number, y: number): number {
  return pixels[(Math.floor(y) * size + Math.floor(x)) * 4 + 3];
}

// Points inside the wedge area at a given clock position (clockwise from 12).
function wedgePoint(angleDeg: number): [number, number] {
  const r = size * 0.2;
  const a = (angleDeg * Math.PI) / 180;
  return [center + r * Math.sin(a), center - r * Math.cos(a)];
}

describe("drawProgressRing", () => {
  it("produces one RGBA pixel per position, black with alpha only", () => {
    const pixels = drawProgressRing(0.5);
    expect(pixels.length).toBe(size * size * 4);
    for (let i = 0; i < pixels.length; i += 4) {
      expect(pixels[i]).toBe(0);
      expect(pixels[i + 1]).toBe(0);
      expect(pixels[i + 2]).toBe(0);
    }
  });

  it("always draws the outer circle", () => {
    for (const fraction of [0, 0.5, 1]) {
      const pixels = drawProgressRing(fraction);
      // Just inside the top edge of the outer circle.
      expect(alphaAt(pixels, center, center - size * 0.42)).toBeGreaterThan(
        200,
      );
    }
  });

  it("fills the whole wedge when the period has just started", () => {
    const pixels = drawProgressRing(1);
    for (const angle of [20, 110, 200, 290]) {
      expect(alphaAt(pixels, ...wedgePoint(angle))).toBe(255);
    }
  });

  it("leaves the wedge empty when the time is up", () => {
    const pixels = drawProgressRing(0);
    for (const angle of [20, 110, 200, 290]) {
      expect(alphaAt(pixels, ...wedgePoint(angle))).toBe(0);
    }
  });

  it("fills clockwise from 12 o'clock for the remaining fraction", () => {
    const half = drawProgressRing(0.5);
    expect(alphaAt(half, ...wedgePoint(90))).toBe(255); // 3 o'clock
    expect(alphaAt(half, ...wedgePoint(270))).toBe(0); // 9 o'clock

    const quarter = drawProgressRing(0.25);
    expect(alphaAt(quarter, ...wedgePoint(45))).toBe(255);
    expect(alphaAt(quarter, ...wedgePoint(135))).toBe(0);
  });

  it("clamps out-of-range input", () => {
    expect(drawProgressRing(2)).toEqual(drawProgressRing(1));
    expect(drawProgressRing(-1)).toEqual(drawProgressRing(0));
  });
});

describe("progressStep", () => {
  it("quantises the fraction into steps", () => {
    expect(progressStep(1)).toBe(RING_STEPS);
    expect(progressStep(0)).toBe(0);
    expect(progressStep(0.5)).toBe(RING_STEPS / 2);
    expect(progressStep(0.0001)).toBe(1);
  });
});
