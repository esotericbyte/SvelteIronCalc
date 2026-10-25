<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/ClassicRule.tsx:
  a rule that formats the cells meeting a condition (a cell value compared
  with one or two values, a text, a date period, a formula, duplicates,
  blanks, errors...), with its format and "stop if true".
-->
<script lang="ts" module>
  const OPERATOR_TYPES_WITH_SECOND_DROPDOWN = ["cell_value", "text", "date"];
</script>

<script lang="ts">
  import { getTokens, type IronCalcTheme } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import { untrack } from "svelte";
  import { t } from "../../../i18n";
  import Button from "../../Button/Button.svelte";
  import Checkbox from "../../Checkbox/Checkbox.svelte";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import ApplyToField from "./ApplyToField.svelte";
  import type { FormatStyle } from "./formatStyle";
  import FormatStylePicker from "./FormatStylePicker.svelte";
  import type { RuleData } from "./ruleData";
  import { getRuleDescription } from "./ruleDescription";
  import UseSelectionButton from "./UseSelectionButton.svelte";

  interface Props {
    onSave: (data: RuleData) => void;
    onCancel: () => void;
    initialValues?: RuleData;
    getSelectedArea: () => string;
    applyTo: string;
    onApplyToChange: (value: string) => void;
    formatStyle: FormatStyle;
    onFormatStyleChange: (style: FormatStyle) => void;
    onDescriptionChange?: (description: string) => void;
    resolveValue?: (value: string) => string;
    currentTheme: IronCalcTheme;
  }

  let {
    onSave,
    onCancel,
    initialValues,
    getSelectedArea,
    applyTo,
    onApplyToChange,
    formatStyle,
    onFormatStyleChange,
    onDescriptionChange,
    resolveValue,
    currentTheme,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let ruleType = $state(initialValues?.ruleType ?? "cell_value");
  // svelte-ignore state_referenced_locally
  let ruleOperator = $state(initialValues?.ruleOperator ?? "between");
  // svelte-ignore state_referenced_locally
  let ruleValue = $state(initialValues?.ruleValue ?? "");
  // svelte-ignore state_referenced_locally
  let ruleValue2 = $state(initialValues?.ruleValue2 ?? "");
  // svelte-ignore state_referenced_locally
  let stopIfTrue = $state(initialValues?.stopIfTrue ?? false);

  const ruleTypeOptions = [
    { value: "cell_value", label: t("conditional_formatting.rule_type_cell_value") },
    { value: "text", label: t("conditional_formatting.rule_type_text") },
    { value: "date", label: t("conditional_formatting.rule_type_date") },
    { value: "formula", label: t("conditional_formatting.rule_type_formula") },
    {
      value: "duplicate_values",
      label: t("conditional_formatting.rule_type_duplicate_values"),
    },
    { value: "unique_values", label: t("conditional_formatting.rule_type_unique_values") },
    { value: "blanks", label: t("conditional_formatting.rule_type_blanks") },
    { value: "no_blanks", label: t("conditional_formatting.rule_type_no_blanks") },
    { value: "errors", label: t("conditional_formatting.rule_type_errors") },
    { value: "no_errors", label: t("conditional_formatting.rule_type_no_errors") },
  ];

  const operatorOptionsByType: Record<string, { value: string; label: string }[]> = {
    cell_value: [
      { value: "between", label: t("conditional_formatting.op_between") },
      { value: "not_between", label: t("conditional_formatting.op_not_between") },
      { value: "less_than", label: t("conditional_formatting.op_less_than") },
      {
        value: "less_than_or_equal",
        label: t("conditional_formatting.op_less_than_or_equal"),
      },
      { value: "greater_than", label: t("conditional_formatting.op_greater_than") },
      {
        value: "greater_than_or_equal",
        label: t("conditional_formatting.op_greater_than_or_equal"),
      },
      { value: "equals", label: t("conditional_formatting.op_equals") },
      { value: "does_not_equal", label: t("conditional_formatting.op_does_not_equal") },
    ],
    text: [
      { value: "contains", label: t("conditional_formatting.op_contains") },
      { value: "does_not_contain", label: t("conditional_formatting.op_does_not_contain") },
      { value: "begins_with", label: t("conditional_formatting.op_begins_with") },
      { value: "ends_with", label: t("conditional_formatting.op_ends_with") },
      { value: "equals", label: t("conditional_formatting.op_equals") },
    ],
    date: [
      { value: "between", label: t("conditional_formatting.op_between") },
      { value: "not_between", label: t("conditional_formatting.op_not_between") },
      { value: "yesterday", label: t("conditional_formatting.op_yesterday") },
      { value: "today", label: t("conditional_formatting.op_today") },
      { value: "tomorrow", label: t("conditional_formatting.op_tomorrow") },
      { value: "in_last_7_days", label: t("conditional_formatting.op_in_last_7_days") },
      { value: "in_next_7_days", label: t("conditional_formatting.op_in_next_7_days") },
      { value: "last_week", label: t("conditional_formatting.op_last_week") },
      { value: "this_week", label: t("conditional_formatting.op_this_week") },
      { value: "next_week", label: t("conditional_formatting.op_next_week") },
      { value: "last_month", label: t("conditional_formatting.op_last_month") },
      { value: "this_month", label: t("conditional_formatting.op_this_month") },
      { value: "next_month", label: t("conditional_formatting.op_next_month") },
      { value: "last_year", label: t("conditional_formatting.op_last_year") },
      { value: "this_year", label: t("conditional_formatting.op_this_year") },
      { value: "next_year", label: t("conditional_formatting.op_next_year") },
    ],
  };

  const showSecondDropdown = $derived(OPERATOR_TYPES_WITH_SECOND_DROPDOWN.includes(ruleType));
  const currentOperatorOptions = $derived(operatorOptionsByType[ruleType] ?? []);
  const showTwoInputs = $derived(
    showSecondDropdown && ["between", "not_between"].includes(ruleOperator),
  );
  const showValueInput = $derived(
    showSecondDropdown &&
      !(ruleType === "date" && !["between", "not_between"].includes(ruleOperator)),
  );
  const showFormulaInput = $derived(ruleType === "formula");

  const formulaError = $derived.by(() => {
    if (!showFormulaInput || !ruleValue.trim()) {
      return null;
    }
    if (!ruleValue.trim().startsWith("=")) {
      return t("conditional_formatting.formula_error_must_start_with_equals");
    }
    if (getTokens(ruleValue.trim().slice(1)).some((token) => token.token === "Illegal")) {
      return t("conditional_formatting.formula_error_invalid");
    }
    return null;
  });

  // A new rule type starts at its first operator (not on the first render)
  const firstOperator = $derived(currentOperatorOptions[0]?.value);
  // svelte-ignore state_referenced_locally
  let previousFirstOperator = firstOperator;
  $effect(() => {
    const first = firstOperator;
    if (first !== previousFirstOperator) {
      previousFirstOperator = first;
      ruleOperator = first ?? "";
    }
  });

  $effect(() => {
    const description = getRuleDescription({
      ruleType,
      ruleOperator,
      ruleValue,
      ruleValue2,
      resolveValue,
      t,
    });
    untrack(() => onDescriptionChange?.(description));
  });

  const canSave = $derived(
    !(
      !applyTo.trim() ||
      (showFormulaInput && (!ruleValue.trim() || !!formulaError)) ||
      (showValueInput && (!ruleValue.trim() || (showTwoInputs && !ruleValue2.trim())))
    ),
  );
</script>

<div class="ic-edit-rule-content">
  <ApplyToField {applyTo} {onApplyToChange} {getSelectedArea} />
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">{t("conditional_formatting.format_rules")}</div>
    <div class="ic-edit-rule-condition">
      <span class="ic-edit-rule-label">{t("conditional_formatting.highlight_cells_if")}</span>
      <div class="ic-edit-rule-dropdowns-row">
        <Select
          value={ruleType}
          options={ruleTypeOptions}
          onChange={(value) => (ruleType = value)}
          hideCheck
        />
        {#if showSecondDropdown}
          <Select
            value={ruleOperator}
            options={currentOperatorOptions}
            onChange={(value) => (ruleOperator = value)}
            hideCheck
          />
        {/if}
      </div>
      {#if showFormulaInput}
        <Input
          type="text"
          placeholder={t("conditional_formatting.formula_placeholder")}
          value={ruleValue}
          error={!!formulaError}
          helperText={formulaError ?? undefined}
          oninput={(event) => (ruleValue = event.currentTarget.value)}
        />
      {/if}
      {#if showValueInput}
        {#if showTwoInputs}
          <div class="ic-edit-rule-values-row">
            <Input
              type="text"
              placeholder={t("conditional_formatting.rule_value_placeholder")}
              value={ruleValue}
              oninput={(event) => (ruleValue = event.currentTarget.value)}
            />
            <Input
              type="text"
              placeholder={t("conditional_formatting.rule_value_placeholder")}
              value={ruleValue2}
              oninput={(event) => (ruleValue2 = event.currentTarget.value)}
            />
          </div>
        {:else}
          <Input
            type="text"
            placeholder={t("conditional_formatting.rule_value_placeholder")}
            value={ruleValue}
            oninput={(event) => (ruleValue = event.currentTarget.value)}
          >
            {#snippet endAdornment()}
              <UseSelectionButton onclick={() => (ruleValue = getSelectedArea())} />
            {/snippet}
          </Input>
        {/if}
      {/if}
    </div>
  </div>
  <div class="ic-edit-rule-section">
    <div class="ic-edit-rule-section-title">{t("conditional_formatting.format_style")}</div>
    <FormatStylePicker value={formatStyle} onChange={onFormatStyleChange} {currentTheme} />
  </div>
  <div class="ic-edit-rule-section">
    <Checkbox
      checked={stopIfTrue}
      onChange={(checked) => (stopIfTrue = checked)}
      label={t("conditional_formatting.stop_if_true")}
    />
  </div>
</div>
<div class="ic-edit-rule-footer">
  <Button variant="secondary" onclick={onCancel}>{t("conditional_formatting.cancel")}</Button>
  <Button
    disabled={!canSave}
    onclick={() =>
      onSave({
        applyTo,
        ruleType,
        ruleOperator,
        ruleValue,
        ruleValue2,
        formatStyle,
        stopIfTrue,
      })}
  >
    {#snippet startIcon()}<Check />{/snippet}
    {t("conditional_formatting.apply")}
  </Button>
</div>
