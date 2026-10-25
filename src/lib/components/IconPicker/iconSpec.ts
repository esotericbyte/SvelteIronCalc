// The icons of upstream webapp/IronCalc/src/components/IconPicker/IconPicker.tsx
// (the icon sets of conditional formatting), with its `iconSpecFor`, as plain
// TypeScript: the Lucide icons are Svelte components here.
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

export interface IconSpec {
  Icon: LucideIcon;
  name: string;
  filled?: boolean;
}

// Ordered list of all available icons for cycling.
export const CYCLE_ICONS: IconSpec[] = [
  { Icon: ArrowUp, name: "ArrowUp" },
  { Icon: ArrowUpRight, name: "ArrowAngleUp" },
  { Icon: ArrowRight, name: "ArrowRight" },
  { Icon: ArrowDownRight, name: "ArrowAngleDown" },
  { Icon: ArrowDown, name: "ArrowDown" },
  { Icon: ChevronUp, name: "TriangleUp" },
  { Icon: Minus, name: "FlatRectangle" },
  { Icon: ChevronDown, name: "TriangleDown" },
  { Icon: Check, name: "Check" },
  { Icon: CircleAlert, name: "Exclamation" },
  { Icon: X, name: "Cross" },
  { Icon: ThumbsUp, name: "ThumbsUp" },
  { Icon: ThumbsDown, name: "ThumbsDown" },
  { Icon: Circle, name: "Circle", filled: true },
  { Icon: Diamond, name: "Rhombus", filled: true },
  { Icon: Triangle, name: "Triangle", filled: true },
  { Icon: Flag, name: "Flag", filled: true },
  { Icon: Star, name: "Star", filled: true },
  { Icon: Heart, name: "Heart", filled: true },
];

export function iconSpecFor(name: string): Omit<IconSpec, "name"> {
  const result = CYCLE_ICONS.find((ic) => ic.name === name);
  if (!result) {
    console.warn(`Unknown icon name: ${name}`);
    return { Icon: X, filled: false };
  }
  return result;
}
