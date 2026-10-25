// The conversions between the engine's conditional formatting rules and the
// rule editor's data (ported from upstream's cfRuleMapping.ts), checked
// through the engine: a rule written from editor data reads back as the
// same data, and the descriptions of the list.
import { Model } from "@ironcalc/wasm";
import { describe, expect, it } from "vitest";
import { t } from "../src/lib/i18n";
import {
  cfRuleToRuleData,
  dxfToFormatStyle,
  formatStyleToDxf,
  ruleDataToCfRule,
} from "../src/lib/components/RightDrawer/ConditionalFormatting/cfRuleMapping";
import type { RuleData } from "../src/lib/components/RightDrawer/ConditionalFormatting/ruleData";
import { getRuleDescription } from "../src/lib/components/RightDrawer/ConditionalFormatting/ruleDescription";

const plain = {
  bold: false,
  italic: false,
  underline: false,
  strike: false,
  fontColor: "",
  fillColor: "",
};

function base(overrides: Partial<RuleData>): RuleData {
  return {
    applyTo: "A1:A10",
    ruleType: "cell_value",
    ruleOperator: "between",
    ruleValue: "",
    ruleValue2: "",
    formatStyle: plain,
    ...overrides,
  };
}

/** Writes the rule to a fresh model and reads it back as editor data. */
function roundTrip(data: RuleData): Partial<RuleData> | null {
  const model = new Model("Test", "en", "UTC", "en");
  const rule = ruleDataToCfRule(data);
  if (!rule) {
    throw new Error("no rule");
  }
  model.addConditionalFormatting(0, data.applyTo, rule);
  const [stored] = model.getConditionalFormattingList(0);
  return cfRuleToRuleData(stored);
}

describe("cfRuleMapping", () => {
  it("converts formats both ways, leaving out what is unset", () => {
    expect(formatStyleToDxf(plain)).toEqual({});
    const style = { ...plain, bold: true, fontColor: "#D21D21", fillColor: "#FBE7E8" };
    expect(formatStyleToDxf(style)).toEqual({
      font: { b: true, color: "#D21D21" },
      fill: { color: "#FBE7E8" },
    });
    expect(dxfToFormatStyle(formatStyleToDxf(style))).toEqual(style);
  });

  it("round-trips the classic rules", () => {
    expect(
      roundTrip(base({ ruleOperator: "not_between", ruleValue: "1", ruleValue2: "5" })),
    ).toMatchObject({ ruleType: "cell_value", ruleOperator: "not_between", ruleValue: "1", ruleValue2: "5" });
    expect(
      roundTrip(base({ ruleType: "text", ruleOperator: "begins_with", ruleValue: "ab", stopIfTrue: true })),
    ).toMatchObject({ ruleType: "text", ruleOperator: "begins_with", ruleValue: "ab", stopIfTrue: true });
    expect(roundTrip(base({ ruleType: "date", ruleOperator: "last_week" }))).toMatchObject({
      ruleType: "date",
      ruleOperator: "last_week",
    });
    expect(roundTrip(base({ ruleType: "formula", ruleValue: "=A1>2" }))).toMatchObject({
      ruleType: "formula",
      ruleValue: "=A1>2",
    });
    for (const ruleType of ["duplicate_values", "unique_values", "blanks", "no_blanks", "errors", "no_errors"]) {
      expect(roundTrip(base({ ruleType }))).toMatchObject({ ruleType });
    }
  });

  it("round-trips color scales with two and three stops", () => {
    const two = {
      minimum: { type: "min" as const, value: "", color: "#8CB354" },
      midpoint: { type: "none" as const, value: "", color: "" },
      maximum: { type: "max" as const, value: "", color: "#E8F0DD" },
    };
    expect(roundTrip(base({ ruleType: "color_scale", colorScale: two }))?.colorScale).toEqual(two);
    const three = {
      minimum: { type: "number" as const, value: "1", color: "#EC5753" },
      midpoint: { type: "percentile" as const, value: "50", color: "#F8CD3D" },
      maximum: { type: "percent" as const, value: "90", color: "#8CB354" },
    };
    expect(roundTrip(base({ ruleType: "color_scale", colorScale: three }))?.colorScale).toEqual(three);
  });

  it("round-trips data bars", () => {
    const dataBars = {
      color: "#3458B7",
      gradient: true,
      positiveColor: "#3458B7",
      negativeColor: "#E05C53",
      hideCellContent: true,
      minBound: { type: "automatic" as const, value: "" },
      maxBound: { type: "number" as const, value: "100" },
    };
    expect(roundTrip(base({ ruleType: "data_bars", dataBars }))?.dataBars).toEqual(dataBars);
  });

  it("round-trips icon sets and ratings, thresholds high to low", () => {
    const iconSets = {
      presetId: "dir-3-arrows-color",
      thresholds: [
        { operator: ">=" as const, value: "67", type: "percent" as const, color: "#8CB354", iconName: "ArrowUp" },
        { operator: ">" as const, value: "10", type: "number" as const, color: "#F8CD3D", iconName: "ArrowRight" },
        { operator: ">=" as const, value: "", type: "percent" as const, color: "#EC5753", iconName: "ArrowDown" },
      ],
      showValue: false,
    };
    expect(roundTrip(base({ ruleType: "icon_sets", iconSets }))?.iconSets).toEqual(iconSets);

    const rating = roundTrip(
      base({
        ruleType: "icon_sets",
        iconSets: {
          presetId: "dir-3-arrows-color",
          rating: { count: 3, icon: "Star", color: "#FFD700" },
          thresholds: [
            { operator: ">=", value: "67", type: "percent", color: "#FFD700", iconName: "Star" },
            { operator: ">=", value: "33", type: "percent", color: "#FFD700", iconName: "Star" },
            { operator: ">=", value: "", type: "percent", color: "#FFD700", iconName: "Star" },
          ],
          showValue: true,
        },
      }),
    );
    expect(rating?.iconSets?.rating).toEqual({ count: 3, icon: "Star", color: "#FFD700" });
    expect(rating?.iconSets?.thresholds.map((th) => th.value)).toEqual(["67", "33", ""]);
  });
});

describe("ruleDescription", () => {
  it("describes the rules as the list shows them", () => {
    const describe = (data: Partial<RuleData>) =>
      getRuleDescription({ ...base(data), t });
    expect(describe({ ruleOperator: "greater_than", ruleValue: "100" })).toBe("Cell value > 100");
    expect(describe({ ruleOperator: "between", ruleValue: "1", ruleValue2: "2" })).toBe(
      "Cell value is between 1 and 2",
    );
    expect(describe({ ruleType: "text", ruleOperator: "contains", ruleValue: "x" })).toBe(
      "Text contains 'x'",
    );
    expect(describe({ ruleType: "color_scale" })).toBe("Color Scale");
    expect(describe({ ruleType: "blanks" })).toBe("Blanks");
    // a reference is shown with the value it points at
    expect(
      getRuleDescription({
        ...base({ ruleOperator: "equals", ruleValue: "B1" }),
        resolveValue: (value) => (value === "B1" ? "42" : value),
        t,
      }),
    ).toBe("Cell value = 42");
  });
});
