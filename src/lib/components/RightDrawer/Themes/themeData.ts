// The editable colors of a theme, from upstream
// webapp/IronCalc/src/components/RightDrawer/Themes/EditTheme.tsx
// (`ThemeData`) and themes.tsx (`themeToThemeData`).
import type { IronCalcTheme } from "@ironcalc/wasm";

export interface ThemeData {
  name: string;
  textColor: string;
  bgColor: string;
  lightColor: string;
  darkColor: string;
  accentColors: [string, string, string, string, string, string];
  hlinkColor: string;
  folHlinkColor: string;
}

export function themeToThemeData(theme: IronCalcTheme): ThemeData {
  return {
    name: theme.name,
    textColor: theme.dk1,
    bgColor: theme.lt1,
    darkColor: theme.dk2,
    lightColor: theme.lt2,
    accentColors: [
      theme.accent1,
      theme.accent2,
      theme.accent3,
      theme.accent4,
      theme.accent5,
      theme.accent6,
    ],
    hlinkColor: theme.hlink,
    folHlinkColor: theme.fol_hlink,
  };
}
