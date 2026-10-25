// The data bars rule's data and colors, from upstream
// webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/DataBarsRule.tsx
// (the parts that are not JSX).
import type { Color } from "@ironcalc/wasm";

export type DataBarBoundType =
  | "automatic"
  | "min"
  | "max"
  | "number"
  | "percent"
  | "percentile"
  | "formula";

export interface DataBarBound {
  type: DataBarBoundType;
  value: string;
}

export interface DataBarsRuleData {
  color: string;
  gradient: boolean;
  positiveColor: Color;
  negativeColor: Color;
  hideCellContent: boolean;
  minBound: DataBarBound;
  maxBound: DataBarBound;
}

export const COLORS = [
  "#8CB354",
  "#EC5753",
  "#3458B7",
  "#F2994A",
  "#F8CD3D",
  "#523E93",
  "#FF2D55",
  "#333333",
];

export const BAR_WIDTHS = [0.6, 0.85, 0.35, 0.55];

export const VALUE_DISABLED_TYPES: DataBarBoundType[] = ["automatic", "min", "max"];

/** The background of a bar: the color, or a gradient fading it out. */
export function barBackground(color: string, gradient: boolean): string {
  return gradient ? `linear-gradient(to right, ${color}, ${color}1a)` : color;
}
