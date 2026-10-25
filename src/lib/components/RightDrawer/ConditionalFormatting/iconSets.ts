// The icon sets rule's presets, data and default thresholds, from upstream
// webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/IconSetsRule.tsx
// (the parts that are not JSX). The Lucide icons are Svelte components and
// an icon's extra style is a CSS string.
import type { Color } from "@ironcalc/wasm";
import type { LucideIcon } from "@lucide/svelte";
import ArrowDown from "@lucide/svelte/icons/arrow-down";
import ArrowDownRight from "@lucide/svelte/icons/arrow-down-right";
import ArrowRight from "@lucide/svelte/icons/arrow-right";
import ArrowUp from "@lucide/svelte/icons/arrow-up";
import ArrowUpRight from "@lucide/svelte/icons/arrow-up-right";
import Check from "@lucide/svelte/icons/check";
import ChevronDown from "@lucide/svelte/icons/chevron-down";
import ChevronUp from "@lucide/svelte/icons/chevron-up";
import Circle from "@lucide/svelte/icons/circle";
import CircleAlert from "@lucide/svelte/icons/circle-alert";
import Diamond from "@lucide/svelte/icons/diamond";
import Flag from "@lucide/svelte/icons/flag";
import Heart from "@lucide/svelte/icons/heart";
import Minus from "@lucide/svelte/icons/minus";
import Star from "@lucide/svelte/icons/star";
import ThumbsDown from "@lucide/svelte/icons/thumbs-down";
import ThumbsUp from "@lucide/svelte/icons/thumbs-up";
import Triangle from "@lucide/svelte/icons/triangle";
import X from "@lucide/svelte/icons/x";

export interface IconSetIcon {
  Icon: LucideIcon;
  color: string;
  filled?: boolean;
  backendName: string;
  style?: string;
}

export interface IconSetPreset {
  id: string;
  icons: IconSetIcon[];
}

export const DIRECTIONAL: IconSetPreset[] = [
  {
    id: "dir-3-arrows-color",
    icons: [
      { Icon: ArrowUp, color: "#8CB354", backendName: "ArrowUp" },
      { Icon: ArrowRight, color: "#F8CD3D", backendName: "ArrowRight" },
      { Icon: ArrowDown, color: "#EC5753", backendName: "ArrowDown" },
    ],
  },
  {
    id: "dir-3-chevrons-color",
    icons: [
      { Icon: ChevronUp, color: "#8CB354", backendName: "TriangleUp" },
      { Icon: Minus, color: "#F8CD3D", backendName: "FlatRectangle" },
      { Icon: ChevronDown, color: "#EC5753", backendName: "TriangleDown" },
    ],
  },
  {
    id: "dir-4-arrows-color",
    icons: [
      { Icon: ArrowUp, color: "#8CB354", backendName: "ArrowUp" },
      { Icon: ArrowUpRight, color: "#F8CD3D", backendName: "ArrowAngleUp" },
      { Icon: ArrowDownRight, color: "#F8CD3D", backendName: "ArrowAngleDown" },
      { Icon: ArrowDown, color: "#EC5753", backendName: "ArrowDown" },
    ],
  },
  {
    id: "dir-5-arrows-color",
    icons: [
      { Icon: ArrowUp, color: "#8CB354", backendName: "ArrowUp" },
      { Icon: ArrowUpRight, color: "#B4D67E", backendName: "ArrowAngleUp" },
      { Icon: ArrowRight, color: "#F8CD3D", backendName: "ArrowRight" },
      { Icon: ArrowDownRight, color: "#FC9F6E", backendName: "ArrowAngleDown" },
      { Icon: ArrowDown, color: "#EC5753", backendName: "ArrowDown" },
    ],
  },
];

export const SHAPES: IconSetPreset[] = [
  {
    id: "shapes-3-circles-color",
    icons: [
      { Icon: Circle, color: "#EC5753", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#F8CD3D", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#8CB354", filled: true, backendName: "Circle" },
    ],
  },
  {
    id: "shapes-4-circles-color",
    icons: [
      { Icon: Circle, color: "#333333", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#404040", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#808080", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#D9D9D9", filled: true, backendName: "Circle" },
    ],
  },
  {
    id: "shapes-3-multiple",
    icons: [
      { Icon: Diamond, color: "#EC5753", filled: true, backendName: "Rhombus" },
      {
        Icon: Triangle,
        color: "#F8CD3D",
        filled: true,
        backendName: "TriangleUpFilled",
      },
      { Icon: Circle, color: "#8CB354", filled: true, backendName: "Circle" },
    ],
  },
  {
    id: "shapes-4-circles",
    icons: [
      { Icon: Circle, color: "#333333", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#757575", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#EC5753", filled: true, backendName: "Circle" },
      { Icon: Circle, color: "#FF888A", filled: true, backendName: "Circle" },
    ],
  },
];

export const INDICATORS: IconSetPreset[] = [
  {
    id: "ind-2-arrows",
    icons: [
      { Icon: ArrowUp, color: "#8CB354", backendName: "ArrowUp" },
      { Icon: ArrowDown, color: "#EC5753", backendName: "ArrowDown" },
    ],
  },
  {
    id: "ind-2-thumbs",
    icons: [
      { Icon: ThumbsUp, color: "#8CB354", backendName: "ThumbsUp" },
      { Icon: ThumbsDown, color: "#EC5753", backendName: "ThumbsDown" },
    ],
  },
  {
    id: "ind-3-checkx",
    icons: [
      { Icon: Check, color: "#8CB354", backendName: "Check" },
      { Icon: X, color: "#EC5753", backendName: "Cross" },
    ],
  },
  {
    id: "ind-2-triangles",
    icons: [
      {
        Icon: Triangle,
        color: "#8CB354",
        filled: true,
        backendName: "TriangleUpFilled",
      },
      {
        Icon: Triangle,
        color: "#EC5753",
        filled: true,
        backendName: "TriangleDownFilled",
        style: "transform: rotate(180deg)",
      },
    ],
  },
  {
    id: "ind-3-check-exclaim-x",
    icons: [
      { Icon: Check, color: "#8CB354", backendName: "Check" },
      { Icon: CircleAlert, color: "#F8CD3D", backendName: "Exclamation" },
      { Icon: X, color: "#EC5753", backendName: "Cross" },
    ],
  },
  {
    id: "ind-4-flags",
    icons: [
      { Icon: Flag, color: "#8CB354", filled: true, backendName: "Flag" },
      { Icon: Flag, color: "#F8CD3D", filled: true, backendName: "Flag" },
      { Icon: Flag, color: "#EC5753", filled: true, backendName: "Flag" },
    ],
  },
];

export const DEFAULT_RATING_COLOR = "#FFD700";
const DEFAULT_HEART_COLOR = "#EC5753";

export const RATINGS: IconSetPreset[] = [
  {
    id: "rating-3-stars",
    icons: [
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
    ],
  },
  {
    id: "rating-4-stars",
    icons: [
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
    ],
  },
  {
    id: "rating-5-stars",
    icons: [
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
      { Icon: Star, color: "#FFD700", filled: true, backendName: "Star" },
    ],
  },
  {
    id: "rating-3-hearts",
    icons: [
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
    ],
  },
  {
    id: "rating-4-hearts",
    icons: [
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
    ],
  },
  {
    id: "rating-5-hearts",
    icons: [
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
      {
        Icon: Heart,
        color: DEFAULT_HEART_COLOR,
        filled: true,
        backendName: "Heart",
      },
    ],
  },
];

export const ALL_PRESETS = [...DIRECTIONAL, ...SHAPES, ...INDICATORS];

export const THRESHOLD_TYPE_OPTIONS = [
  "min",
  "max",
  "percent",
  "number",
  "percentile",
  "formula",
] as const;
export type ThresholdType = (typeof THRESHOLD_TYPE_OPTIONS)[number];

export interface IconThreshold {
  operator: ">=" | ">";
  value: string;
  type: ThresholdType;
  color: Color;
  iconName: string;
}

// Thresholds are ordered HIGH→LOW (index 0 = highest icon bucket, index n-1 = lowest/"else").
// Each threshold's value is the LOWER bound for that icon bucket.
export function defaultThresholds(icons: IconSetIcon[]): IconThreshold[] {
  const count = icons.length;
  return icons.map((icon, i) => ({
    operator: ">=" as const,
    value:
      i < count - 1 ? `${Math.round(((count - 1 - i) * 100) / count)}` : "",
    type: "percent",
    color: icon.color,
    iconName: icon.backendName,
  }));
}

export function defaultRatingThresholds(
  count: number,
  color: Color,
  iconName = "Star",
): IconThreshold[] {
  return Array.from({ length: count }, (_, i) => ({
    operator: ">=" as const,
    value:
      i < count - 1 ? `${Math.round(((count - 1 - i) * 100) / count)}` : "",
    type: "percent",
    color,
    iconName,
  }));
}

export interface IconPreviewInfo {
  Icon: LucideIcon;
  color: string;
  filled?: boolean;
}

export interface IconSetsRuleData {
  presetId: string;
  rating?: { count: 3 | 4 | 5; icon: string; color: Color };
  // Ordered HIGH→LOW: thresholds[0] = highest icon bucket, thresholds[n-1] = lowest/"else".
  // Each threshold's value is the LOWER bound for that bucket (operator ">=" or ">").
  thresholds: {
    operator: ">=" | ">";
    value: string;
    type: ThresholdType;
    color: Color;
    iconName: string;
  }[];
  showValue: boolean;
}
