<!--
  The "Apply to" section every rule editor of upstream's
  ConditionalFormatting/ (ClassicRule.tsx, ColorScaleRule.tsx,
  DataBarsRule.tsx, IconSetsRule.tsx) starts with: the range the rule
  applies to, with a button that takes the selection.
-->
<script lang="ts">
  import { t } from "../../../i18n";
  import Input from "../../Input/Input.svelte";
  import UseSelectionButton from "./UseSelectionButton.svelte";

  interface Props {
    applyTo: string;
    onApplyToChange: (value: string) => void;
    getSelectedArea: () => string;
  }

  let { applyTo, onApplyToChange, getSelectedArea }: Props = $props();
</script>

<div class="ic-edit-rule-section">
  <div class="ic-edit-rule-section-title">{t("conditional_formatting.apply_to")}</div>
  <div class="ic-edit-rule-field-wrapper">
    <span class="ic-edit-rule-label">{t("conditional_formatting.apply_to_range")}</span>
    <Input
      type="text"
      placeholder={t("conditional_formatting.apply_to_placeholder")}
      value={applyTo}
      oninput={(event) => onApplyToChange(event.currentTarget.value)}
    >
      {#snippet endAdornment()}
        <UseSelectionButton onclick={() => onApplyToChange(getSelectedArea())} />
      {/snippet}
    </Input>
  </div>
</div>
