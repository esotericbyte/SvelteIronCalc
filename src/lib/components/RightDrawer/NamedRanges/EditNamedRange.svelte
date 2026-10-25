<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/NamedRanges/EditNamedRange.tsx:
  the name, scope (the workbook or one sheet) and formula of a named range.
  The name and formula are validated by the engine 300 ms after each
  change; Ctrl/Cmd+Enter applies.
-->
<script lang="ts" module>
  export interface SaveError {
    nameError: string;
    formulaError: string;
  }

  // HACK (upstream): the text structure of the engine's error decides
  // which field it belongs to. This is wrong for several reasons:
  // 1. There is no i18n
  // 2. Engine error messages could change with no warning
  export function formatOnSaveError(error: string): SaveError {
    if (error.startsWith("Name: ")) {
      return { formulaError: "", nameError: error.slice(6) };
    } else if (error.startsWith("Formula: ")) {
      return { formulaError: error.slice(9), nameError: "" };
    } else if (error.startsWith("Scope: ")) {
      return { formulaError: "", nameError: error.slice(7) };
    }
    // Fallback for other errors
    return { formulaError: error, nameError: "" };
  }
</script>

<script lang="ts">
  import type { DefinedName, Model } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import SquareMousePointer from "@lucide/svelte/icons/square-mouse-pointer";
  import Tag from "@lucide/svelte/icons/tag";
  import { t } from "../../../i18n";
  import { getFullRangeToString } from "../../../upstream/components/util";
  import Button from "../../Button/Button.svelte";
  import IconButton from "../../Button/IconButton.svelte";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import Textarea from "../../Textarea/Textarea.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";

  interface Props {
    name: string;
    scope: string;
    formula: string;
    model: Model;
    onSave: (name: string, scope: string, formula: string) => SaveError;
    onCancel: () => void;
    editingDefinedName: DefinedName | null;
  }

  let {
    name: initialName,
    scope: initialScope,
    formula: initialFormula,
    onSave,
    onCancel,
    editingDefinedName,
    model,
  }: Props = $props();

  function getDefaultName(): string {
    if (initialName) {
      return initialName;
    }
    const rangePrefix = t("name_manager_dialog.default_range_prefix");
    let counter = 1;
    let defaultName = `${rangePrefix}${counter}`;
    const worksheets = model.getWorksheetsProperties();
    const scopeIndex = worksheets.findIndex((s) => s.name === initialScope);
    const newScope = scopeIndex >= 0 ? scopeIndex : undefined;
    const definedNameList = model.getDefinedNameList();

    while (
      definedNameList.some((dn) => dn.name === defaultName && dn.scope === newScope)
    ) {
      counter++;
      defaultName = `${rangePrefix}${counter}`;
    }
    return defaultName;
  }

  let name = $state(getDefaultName());
  // svelte-ignore state_referenced_locally
  const worksheets = model.getWorksheetsProperties();
  // Track the scope by sheet_id so it survives sheet renames
  // svelte-ignore state_referenced_locally
  let scopeSheetId = $state(worksheets.find((s) => s.name === initialScope)?.sheet_id);
  const scope = $derived(
    worksheets.find((s) => s.sheet_id === scopeSheetId)?.name ?? "[Global]",
  );
  // svelte-ignore state_referenced_locally
  let formula = $state(initialFormula);
  let nameError = $state("");
  let formulaError = $state("");

  // Validate name (format and duplicates)
  $effect(() => {
    const currentName = name;
    const currentScope = scope;
    const currentFormula = formula;
    const timer = setTimeout(() => {
      const scopeIndex = model
        .getWorksheetsProperties()
        .findIndex((s) => s.name === currentScope);
      const newScope = scopeIndex >= 0 ? scopeIndex : null;
      try {
        model.isValidDefinedName(currentName, newScope, currentFormula);
      } catch (e) {
        const message = (e as Error).message;
        if (editingDefinedName && message.includes("already exists")) {
          // Allow the same name if it's the one being edited
          nameError = "";
          formulaError = "";
          return;
        }
        const errors = formatOnSaveError(message);
        nameError = errors.nameError;
        formulaError = errors.formulaError;
        return;
      }
      nameError = "";
      formulaError = "";
    }, 300);
    return () => clearTimeout(timer);
  });

  const hasAnyError = $derived(nameError !== "" || formulaError !== "");

  function handleSave(): void {
    if (hasAnyError) {
      return;
    }
    const error = onSave(name.trim(), scope, formula);
    if (error.nameError) {
      nameError = error.nameError;
    }
    if (error.formulaError) {
      formulaError = error.formulaError;
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  }

  function focusOnMount(element: HTMLElement): void {
    element.querySelector<HTMLInputElement>("input")?.focus();
  }
</script>

{#snippet globalLabel()}
  <span class="ic-edit-range-menu-span">{t("name_manager_dialog.workbook")}</span>
  <span class="ic-edit-range-menu-span-grey">{` ${t("name_manager_dialog.global")}`}</span>
{/snippet}

{#snippet useSelection()}
  <Tooltip title={t("name_manager_dialog.use_selection")}>
    <IconButton
      size="sm"
      variant="secondary"
      aria-label={t("name_manager_dialog.use_selection")}
      class="ic-edit-range-range-button"
      onclick={() => {
        const worksheetNames = model.getWorksheetsProperties().map((s) => s.name);
        formula = getFullRangeToString(model.getSelectedView(), worksheetNames);
      }}
    >
      {#snippet icon()}<SquareMousePointer />{/snippet}
    </IconButton>
  </Tooltip>
{/snippet}

<!-- the container captures Cmd/Ctrl+Enter bubbling from its fields -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ic-edit-range-container" onkeydown={handleKeyDown}>
  <div class="ic-edit-range-content-area">
    <div class="ic-edit-range-header-box">
      <div class="ic-edit-range-header-icon"><Tag /></div>
      <span class="ic-edit-range-header-box-text">
        {name || t("name_manager_dialog.new_named_range")}
      </span>
    </div>
    <div class="ic-edit-range-styled-box" {@attach focusOnMount}>
      <Input
        type="text"
        label={t("name_manager_dialog.range_name")}
        placeholder={t("name_manager_dialog.enter_range_name")}
        value={name}
        error={!!nameError}
        helperText={nameError}
        oninput={(event) => (name = event.currentTarget.value)}
        onkeydown={handleKeyDown}
      />
      <Select
        label={t("name_manager_dialog.scope_label")}
        helperText={t("name_manager_dialog.scope_helper")}
        value={scope}
        onChange={(value) => {
          scopeSheetId = worksheets.find((s) => s.name === value)?.sheet_id;
        }}
        options={[
          { value: "[Global]", label: globalLabel, triggerLabel: globalLabel },
          ...worksheets.map((option) => ({
            value: option.name,
            label: option.name,
            triggerLabel: option.name,
          })),
        ]}
      />
      <Textarea
        label={t("name_manager_dialog.refers_to")}
        placeholder={t("name_manager_dialog.enter_formula")}
        value={formula}
        error={!!formulaError}
        helperText={formulaError || undefined}
        oninput={(event) => {
          formula = event.currentTarget.value;
          formulaError = "";
        }}
        onkeydown={handleKeyDown}
        endAdornment={useSelection}
      />
    </div>
  </div>
  <div class="ic-edit-range-footer">
    <Button variant="secondary" onclick={onCancel}>
      {t("name_manager_dialog.cancel")}
    </Button>
    <Button disabled={hasAnyError} onclick={handleSave}>
      {#snippet startIcon()}<Check />{/snippet}
      {t("name_manager_dialog.apply")}
    </Button>
  </div>
</div>

<style>
  /* Port of upstream NamedRanges/edit-name-range.css */
  .ic-edit-range-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ic-edit-range-content-area {
    flex: 1;
    overflow: auto;
  }

  .ic-edit-range-menu-span {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
  }

  .ic-edit-range-menu-span-grey {
    white-space: pre;
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-grey-400);
  }

  .ic-edit-range-header-box {
    font-size: 14px;
    font-family: var(--typography-font-family);
    font-weight: 600;
    width: auto;
    gap: 8px;
    padding: 24px 12px;
    color: var(--palette-common-black);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid var(--palette-grey-200);
  }

  .ic-edit-range-header-box-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ic-edit-range-header-icon {
    width: 28px;
    height: 28px;
    border-radius: 4px;
    background-color: var(--palette-grey-100);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ic-edit-range-header-icon :global(svg) {
    width: 16px;
    height: 16px;
    color: var(--palette-grey-600);
  }

  .ic-edit-range-styled-box {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    width: auto;
    padding: 16px 12px;
  }

  @media (max-width: 600px) {
    .ic-edit-range-styled-box {
      padding: 12px;
    }
  }

  .ic-edit-range-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid var(--palette-grey-300);
  }
</style>
