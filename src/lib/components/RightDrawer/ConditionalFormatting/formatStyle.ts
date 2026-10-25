// The format of a classic conditional formatting rule and its presets, from
// upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/FormatStylePicker.tsx
// (the parts that are not JSX).
import type { Color } from "@ironcalc/wasm";

export interface FormatStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  fontColor: Color;
  fillColor: Color;
}

export const DEFAULT_STYLE: FormatStyle = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  fontColor: "",
  fillColor: "",
};

export const PRESETS: FormatStyle[] = [
  { ...DEFAULT_STYLE, fontColor: "#D21D21", fillColor: "#FBE7E8" },
  { ...DEFAULT_STYLE, fontColor: "#D21D21", fillColor: "" },
  { ...DEFAULT_STYLE, fontColor: "#8B6F00", fillColor: "#FEF9E8" },
  { ...DEFAULT_STYLE, fontColor: "#8B6F00", fillColor: "" },
  { ...DEFAULT_STYLE, fontColor: "#A5530A", fillColor: "#FCE7D4" },
  { ...DEFAULT_STYLE, fontColor: "#A5530A", fillColor: "" },
  { ...DEFAULT_STYLE, fontColor: "#008121", fillColor: "#F1F6EA" },
  { ...DEFAULT_STYLE, fontColor: "#008121", fillColor: "" },
];
