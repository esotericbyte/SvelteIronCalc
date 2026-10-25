<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/NamedRanges/NamedRanges.tsx:
  the workbook's named ranges, searchable by name or scope and filtered by
  scope (all, global, the selected sheet). Clicking one selects its range;
  each can be edited or deleted, and new ones start from the selection.
-->
<script lang="ts">
  import type { DefinedName, Model } from "@ironcalc/wasm";
  import PackageOpen from "@lucide/svelte/icons/package-open";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import Plus from "@lucide/svelte/icons/plus";
  import Search from "@lucide/svelte/icons/search";
  import SearchX from "@lucide/svelte/icons/search-x";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "../../../i18n";
  import { parseRangeInSheet } from "../../../upstream/components/Editor/util";
  import Button from "../../Button/Button.svelte";
  import IconButton from "../../Button/IconButton.svelte";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";
  import DrawerHeader from "../DrawerHeader.svelte";
  import EditNamedRange, { formatOnSaveError, type SaveError } from "./EditNamedRange.svelte";

  interface Props {
    onClose: () => void;
    model: Model;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    getSelectedArea: () => string;
    onUpdate: () => void;
  }

  let { onClose, getSelectedArea, model, version, onUpdate }: Props = $props();

  const normalizeRangeString = (range: string): string => {
    return range.trim().replace(/['"]/g, "");
  };

  let editingDefinedName: DefinedName | null = $state(null);
  let isCreatingNew = $state(false);
  let scopeFilter = $state("[all]");
  let searchQuery = $state("");
  let searchInput: HTMLInputElement | null = $state(null);

  const isListView = $derived(!editingDefinedName && !isCreatingNew);

  $effect(() => {
    if (isListView) {
      searchInput?.focus();
    }
  });

  function handleListItemClick(definedName: DefinedName): void {
    editingDefinedName = definedName;
    isCreatingNew = false;
  }

  function handleNewClick(): void {
    isCreatingNew = true;
    editingDefinedName = null;
  }

  function handleCancel(): void {
    editingDefinedName = null;
    isCreatingNew = false;
  }

  function handleSave(name: string, scope: string, formula: string): SaveError {
    const worksheets = model.getWorksheetsProperties();
    const scopeIndex = worksheets.findIndex((s) => s.name === scope);
    const newScope = scopeIndex >= 0 ? scopeIndex : null;
    if (isCreatingNew) {
      try {
        model.newDefinedName(name, newScope, formula);
        isCreatingNew = false;
        onUpdate();
        return { formulaError: "", nameError: "" };
      } catch (e) {
        if (e instanceof Error) {
          return formatOnSaveError(e.message);
        }
        return { formulaError: "", nameError: `${e}` };
      }
    }
    if (!editingDefinedName) {
      return { formulaError: "", nameError: "" };
    }
    try {
      model.updateDefinedName(
        editingDefinedName.name,
        editingDefinedName.scope ?? null,
        name,
        newScope,
        formula,
      );
      editingDefinedName = null;
      onUpdate();
      return { formulaError: "", nameError: "" };
    } catch (e) {
      if (e instanceof Error) {
        return formatOnSaveError(e.message);
      }
      return { formulaError: "", nameError: `${e}` };
    }
  }

  // select the area corresponding to the defined name
  function onNameSelected(formula: string): void {
    const range = parseRangeInSheet(model, formula);
    if (range) {
      const [sheetIndex, rowStart, columnStart, rowEnd, columnEnd] = range;
      model.setSelectedSheet(sheetIndex);
      model.setSelectedCell(rowStart, columnStart);
      model.setSelectedRange(rowStart, columnStart, rowEnd, columnEnd);
    }
    onUpdate();
  }

  const list = $derived.by(() => {
    void version;
    const worksheets = model.getWorksheetsProperties();
    const definedNameList = model.getDefinedNameList();
    const currentSheetIndex = model.getSelectedView().sheet;
    const currentSelectedArea = getSelectedArea();
    const query = searchQuery.trim().toLowerCase();
    const filtered = definedNameList.filter((definedName) => {
      if (scopeFilter === "[global]" && definedName.scope != null) {
        return false;
      }
      if (scopeFilter === "[current]" && definedName.scope !== currentSheetIndex) {
        return false;
      }
      if (query) {
        const scopeName =
          definedName.scope != null
            ? (worksheets[definedName.scope]?.name ?? "")
            : t("name_manager_dialog.scope_filter_global");
        return (
          definedName.name.toLowerCase().includes(query) ||
          scopeName.toLowerCase().includes(query)
        );
      }
      return true;
    });
    return {
      isEmpty: definedNameList.length === 0,
      items: filtered.map((definedName) => ({
        definedName,
        scopeName:
          definedName.scope != null
            ? worksheets[definedName.scope]?.name || "[Unknown]"
            : "[Global]",
        isSelected:
          normalizeRangeString(definedName.formula) ===
          normalizeRangeString(currentSelectedArea),
      })),
    };
  });

  const scopeOptions = [
    { value: "[all]", label: t("name_manager_dialog.scope_filter_all") },
    { value: "[global]", label: t("name_manager_dialog.scope_filter_global") },
    { value: "[current]", label: t("name_manager_dialog.scope_filter_current") },
  ];
</script>

<div class="ic-named-ranges-container">
  {#if editingDefinedName || isCreatingNew}
    {@const worksheets = model.getWorksheetsProperties()}
    <DrawerHeader
      title={isCreatingNew
        ? t("name_manager_dialog.add_new_range")
        : t("name_manager_dialog.edit_range")}
      {onClose}
      onBack={handleCancel}
      backLabel={t("name_manager_dialog.back_to_list")}
    />
    <div class="ic-named-ranges-content">
      {#if editingDefinedName}
        <EditNamedRange
          name={editingDefinedName.name}
          scope={editingDefinedName.scope != null
            ? worksheets[editingDefinedName.scope]?.name || "[unknown]"
            : "[Global]"}
          formula={editingDefinedName.formula}
          onSave={handleSave}
          onCancel={handleCancel}
          {editingDefinedName}
          {model}
        />
      {:else}
        <EditNamedRange
          name=""
          scope="[Global]"
          formula={getSelectedArea()}
          onSave={handleSave}
          onCancel={handleCancel}
          editingDefinedName={null}
          {model}
        />
      {/if}
    </div>
  {:else}
    <DrawerHeader title={t("name_manager_dialog.title")} {onClose} />
    <div class="ic-named-ranges-content">
      {#if list.isEmpty}
        <div class="ic-named-ranges-empty-state-message">
          <div class="ic-named-ranges-icon-wrapper"><PackageOpen /></div>
          {t("name_manager_dialog.empty_message1")}
          <br />
          {t("name_manager_dialog.empty_message2")}
        </div>
      {:else}
        <div class="ic-named-ranges-list-container">
          <div class="ic-named-ranges-search-container">
            <Input
              bind:ref={searchInput}
              type="text"
              size="sm"
              bind:value={searchQuery}
              placeholder={t("name_manager_dialog.search_placeholder")}
              class="ic-named-ranges-search"
            >
              {#snippet startAdornment()}<Search size={16} />{/snippet}
            </Input>
            <div class="ic-named-ranges-scope-filter">
              <span>{t("name_manager_dialog.scope_label")}</span>
              <Select
                size="sm"
                variant="ghost"
                value={scopeFilter}
                options={scopeOptions}
                onChange={(value) => (scopeFilter = value)}
              />
            </div>
          </div>
          <!-- the pointer must not take the focus from the search field -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div class="ic-named-ranges-list-body" onmousedown={(event) => event.preventDefault()}>
            {#if list.items.length === 0}
              <div class="ic-named-ranges-empty-state-message">
                <div class="ic-named-ranges-icon-wrapper"><SearchX /></div>
                {t("name_manager_dialog.no_search_results")}
              </div>
            {/if}
            {#each list.items as { definedName, scopeName, isSelected } (`${definedName.name}-${definedName.scope}`)}
              <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
              <div
                class={["ic-named-ranges-list-item", isSelected && "ic-named-ranges-list-item--selected"]}
                tabindex="0"
                onclick={() => onNameSelected(definedName.formula)}
                onkeydown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onNameSelected(definedName.formula);
                  }
                }}
              >
                <div class="ic-named-ranges-list-item-text">
                  <div class="ic-named-ranges-name-text">{definedName.name}</div>
                  <div class="ic-named-ranges-scope-text">{scopeName}</div>
                  <div class="ic-named-ranges-formula-text">{definedName.formula}</div>
                </div>
                <div class="ic-named-ranges-icons-wrapper">
                  <Tooltip title={t("name_manager_dialog.edit")}>
                    <IconButton
                      aria-label={t("name_manager_dialog.edit")}
                      onclick={(event) => {
                        event.stopPropagation();
                        handleListItemClick(definedName);
                      }}
                    >
                      {#snippet icon()}<PencilLine />{/snippet}
                    </IconButton>
                  </Tooltip>
                  <Tooltip title={t("name_manager_dialog.delete")}>
                    <IconButton
                      aria-label={t("name_manager_dialog.delete")}
                      onclick={(event) => {
                        event.stopPropagation();
                        model.deleteDefinedName(definedName.name, definedName.scope ?? null);
                        onUpdate();
                      }}
                    >
                      {#snippet icon()}<Trash2 />{/snippet}
                    </IconButton>
                  </Tooltip>
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
    </div>
    <div class="ic-named-ranges-footer">
      <Button onclick={handleNewClick}>
        {#snippet startIcon()}<Plus />{/snippet}
        {t("name_manager_dialog.new")}
      </Button>
    </div>
  {/if}
</div>

<style>
  /* Port of upstream NamedRanges/named-ranges.css; the headers are
     DrawerHeader's */
  .ic-named-ranges-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ic-named-ranges-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    color: var(--palette-grey-700);
    line-height: 1.5;
    min-height: 0;
    overflow: hidden;
  }

  .ic-named-ranges-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .ic-named-ranges-list-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .ic-named-ranges-scope-filter {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .ic-named-ranges-scope-filter :global(.ic-select) {
    max-width: 100px;
  }

  .ic-named-ranges-scope-filter > span {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-grey-600);
    white-space: nowrap;
  }

  .ic-named-ranges-search-container :global(.ic-named-ranges-search) {
    flex: 1;
    min-width: 0;
  }

  .ic-named-ranges-search-container :global(.ic-input-control) {
    border: none;
    border-radius: 0;
    width: 100%;
    background-color: var(--palette-common-white);
  }

  .ic-named-ranges-search-container {
    height: 40px;
    flex-shrink: 0;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
    padding: 0 8px;
    gap: 8px;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-named-ranges-list-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 12px;
    cursor: pointer;
    min-height: 76px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--palette-grey-200);
    transition: all 0.2s ease-in-out;
    border-left: 3px solid transparent;
  }

  .ic-named-ranges-list-item--selected {
    padding-left: 20px;
    border-left: 3px solid var(--palette-primary-main);
  }

  .ic-named-ranges-list-item:hover {
    background-color: var(--palette-grey-50);
    padding-left: 20px;
  }

  .ic-named-ranges-list-item-text {
    font-size: 12px;
    color: var(--palette-common-black);
    font-family: var(--typography-font-family);
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }

  .ic-named-ranges-scope-text {
    font-size: 12px;
    color: var(--palette-common-black);
    width: 100%;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .ic-named-ranges-formula-text {
    font-size: 12px;
    line-height: 1.5;
    color: var(--palette-grey-600);
    overflow: hidden;
    word-break: break-all;
    overflow-wrap: break-word;
  }

  .ic-named-ranges-name-text {
    font-size: 12px;
    line-height: 1.5;
    color: var(--palette-common-black);
    font-weight: 600;
    max-height: calc(1.5em * 2);
    overflow: hidden;
    word-break: break-all;
    overflow-wrap: break-word;
  }

  .ic-named-ranges-icons-wrapper {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .ic-named-ranges-footer {
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 12px;
    color: var(--palette-grey-600);
    border-top: 1px solid var(--palette-grey-300);
    gap: 8px;
  }

  .ic-named-ranges-empty-state-message {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 12px;
    padding: 0 20px;
    color: var(--palette-grey-600);
    font-family: var(--typography-font-family);
    text-wrap: balance;
  }

  .ic-named-ranges-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background-color: var(--palette-grey-100);
    color: var(--palette-grey-600);
  }

  .ic-named-ranges-icon-wrapper :global(svg) {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
</style>
