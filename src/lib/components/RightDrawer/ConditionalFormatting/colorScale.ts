// The color scale rule's data, presets and gradients, from upstream
// webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/ColorScaleRule.tsx
// (the parts that are not JSX).
import type { Color } from "@ironcalc/wasm";

export const TYPE_OPTIONS = ["number", "percent", "formula", "percentile"] as const;

export const MIDPOINT_TYPE_OPTIONS = [...TYPE_OPTIONS, "none"] as const;
export const MIN_TYPE_OPTIONS = ["min", ...TYPE_OPTIONS] as const;
export const MAX_TYPE_OPTIONS = ["max", ...TYPE_OPTIONS] as const;

const STOP_TYPE_OPTIONS = [...TYPE_OPTIONS, "none", "min", "max"] as const;

export type StopType = (typeof STOP_TYPE_OPTIONS)[number];

export interface ColorScaleStop {
  type: StopType;
  value: string;
  color: Color;
}

export interface ColorScaleRuleData {
  minimum: ColorScaleStop;
  midpoint: ColorScaleStop;
  maximum: ColorScaleStop;
}

export interface ColorScalePreset {
  id: string;
  colors: string[];
}

export const PRESETS: ColorScalePreset[] = [
  // Row 1 — 3-stop diverging
  { id: "r-y-g", colors: ["#EC5753", "#F8CD3D", "#8CB354"] },
  { id: "g-y-r", colors: ["#8CB354", "#F8CD3D", "#EC5753"] },
  { id: "r-w-g", colors: ["#EC5753", "#FFFFFF", "#8CB354"] },
  { id: "g-w-r", colors: ["#8CB354", "#FFFFFF", "#EC5753"] },
  { id: "r-w-b", colors: ["#EC5753", "#FFFFFF", "#3458B7"] },
  { id: "b-w-r", colors: ["#3458B7", "#FFFFFF", "#EC5753"] },
  { id: "g-w-p", colors: ["#8CB354", "#FFFFFF", "#523E93"] },
  { id: "p-w-g", colors: ["#523E93", "#FFFFFF", "#8CB354"] },
  // Row 2 — 2-stop sequential + others
  { id: "g-lg", colors: ["#8CB354", "#E8F0DD"] },
  { id: "lg-g", colors: ["#E8F0DD", "#8CB354"] },
  { id: "r-lr", colors: ["#EC5753", "#FBDDDD"] },
  { id: "lr-r", colors: ["#FBDDDD", "#EC5753"] },
  {
    id: "r-y-b",
    colors: ["#EC5753", "#F2994A", "#F8CD3D", "#8CB354", "#3458B7"],
  },
  {
    id: "b-y-r",
    colors: ["#3458B7", "#8CB354", "#F8CD3D", "#F2994A", "#EC5753"],
  },
  {
    id: "dp-m-r",
    colors: ["#35193E", "#AC0070", "#E13342", "#F37651", "#F6B48F"],
  },
  {
    id: "r-m-dp",
    colors: ["#F6B48F", "#F37651", "#E13342", "#AC0070", "#35193E"],
  },
];

const STEPS = 5;

function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function rgbToHex(r: number, g: number, b: number): string {
  return `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("")}`;
}

export function interpolateColor(c1: string, c2: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(c1);
  const [r2, g2, b2] = hexToRgb(c2);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

export function sampleColorAt(colors: string[], t: number): string {
  const pos = t * (colors.length - 1);
  const lo = Math.floor(pos);
  const hi = Math.min(lo + 1, colors.length - 1);
  return interpolateColor(colors[lo], colors[hi], pos - lo);
}

export function steppedGradient(colors: string[]): string {
  const bands: string[] = Array.from({ length: STEPS }, (_, i) => {
    const t = i / (STEPS - 1);
    const pos = t * (colors.length - 1);
    const lo = Math.floor(pos);
    const hi = Math.min(lo + 1, colors.length - 1);
    return interpolateColor(colors[lo], colors[hi], pos - lo);
  });

  const pct = 100 / STEPS;
  const stops = bands
    .map((color, i) => `${color} ${i * pct}%, ${color} ${(i + 1) * pct}%`)
    .join(", ");

  return `linear-gradient(to bottom, ${stops})`;
}
