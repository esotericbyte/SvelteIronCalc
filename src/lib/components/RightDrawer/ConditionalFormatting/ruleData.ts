// The data of a rule being edited, from upstream
// webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/EditRule.tsx
// (`RuleData`) and ConditionalFormatting.tsx (`Rule`).
import type { ColorScaleRuleData } from "./colorScale";
import type { DataBarsRuleData } from "./dataBars";
import type { FormatStyle } from "./formatStyle";
import type { IconSetsRuleData } from "./iconSets";

export interface RuleData {
  applyTo: string;
  ruleType: string;
  ruleOperator: string;
  ruleValue: string;
  ruleValue2: string;
  formatStyle: FormatStyle;
  stopIfTrue?: boolean;
  colorScale?: ColorScaleRuleData;
  dataBars?: DataBarsRuleData;
  iconSets?: IconSetsRuleData;
}

export interface Rule extends RuleData {
  id: string;
}

export const DEFAULT_FORMAT_STYLE: FormatStyle = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  fontColor: "#D21D21",
  fillColor: "#FBE7E8",
};
