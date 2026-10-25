<!--
  Port of upstream webapp/IronCalc/src/components/FormulaBar/FormulaBarMenu.tsx:
  the menu behind the formula bar's address box, listing the workbook's
  named ranges (choosing one selects its range) and opening the named
  ranges drawer. It is built on the Menu primitive, so it has the WAI-ARIA
  menu keys upstream's FIXME asks for, where upstream's popover only closes
  on Escape and presses outside.
-->
<script lang="ts">
  import type { Model } from "@ironcalc/wasm";
  import Tag from "@lucide/svelte/icons/tag";
  import type { Snippet } from "svelte";
  import { t } from "../../i18n";
  import { parseRangeInSheet } from "../../upstream/components/Editor/util";
  import Menu from "../Menu/Menu.svelte";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";

  interface Props {
    /** The address button; spread the attributes on it. */
    trigger: Snippet<[Record<string, unknown>]>;
    openDrawer: () => void;
    canEdit: boolean;
    model: Model;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    onUpdate: () => void;
  }

  let { trigger, openDrawer, canEdit, model, version, onUpdate }: Props = $props();

  const definedNameList = $derived.by(() => {
    void version;
    return model.getDefinedNameList();
  });

  function selectDefinedName(formula: string): void {
    const range = parseRangeInSheet(model, formula);
    if (range) {
      const [sheetIndex, rowStart, columnStart, rowEnd, columnEnd] = range;
      model.setSelectedSheet(sheetIndex);
      model.setSelectedCell(rowStart, columnStart);
      model.setSelectedRange(rowStart, columnStart, rowEnd, columnEnd);
    }
    onUpdate();
  }
</script>

<Menu {trigger}>
  {#each definedNameList as definedName (`${definedName.name}-${definedName.scope}`)}
    <MenuItem onClick={() => selectDefinedName(definedName.formula)}>
      {#snippet icon()}
        <span class="ic-formula-bar-menu-item-icon"><Tag /></span>
      {/snippet}
      {#snippet secondaryText()}
        <span class="ic-formula-bar-menu-item-example">{definedName.formula}</span>
      {/snippet}
      <span class="ic-formula-bar-menu-item-text">{definedName.name}</span>
    </MenuItem>
  {/each}
  {#if definedNameList.length > 0}
    <MenuDivider />
  {/if}
  <MenuItem disabled={!canEdit} onClick={openDrawer}>
    <span class="ic-formula-bar-menu-item-text">{t("formula_bar.manage_named_ranges")}</span>
  </MenuItem>
</Menu>

<style>
  /* Port of upstream FormulaBar/formula-bar-menu.css; the popover and the
     items are the Menu primitive's */
  .ic-formula-bar-menu-item-icon {
    display: inline-flex;
    color: var(--palette-grey-500);
  }

  .ic-formula-bar-menu-item-icon :global(svg) {
    width: 12px;
    height: 12px;
  }

  .ic-formula-bar-menu-item-text {
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: var(--palette-common-black);
  }

  .ic-formula-bar-menu-item-example {
    max-width: 200px;
    margin-left: 12px;
    overflow: hidden;
    color: var(--palette-grey-400);
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
