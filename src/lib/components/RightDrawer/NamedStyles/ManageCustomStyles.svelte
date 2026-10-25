<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/NamedStyles/ManageCustomStyles.tsx:
  the workbook's own cell styles, each with its preview and buttons to edit
  or delete it.
-->
<script lang="ts">
  import type { FmtSettings, Model, NamedStyle } from "@ironcalc/wasm";
  import PackageOpen from "@lucide/svelte/icons/package-open";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { t } from "../../../i18n";
  import IconButton from "../../Button/IconButton.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";
  import { getPreviewText, getTileStyle, styleText } from "./namedStylesUtils";

  interface Props {
    model: Model;
    customStyles: NamedStyle[];
    formatOptions: FmtSettings;
    onEdit: (style: NamedStyle) => void;
    onDelete: (style: NamedStyle) => void;
  }

  let { model, customStyles, formatOptions, onEdit, onDelete }: Props = $props();
</script>

{#if customStyles.length === 0}
  <div class="ic-named-styles-empty-state-message">
    <div class="ic-named-styles-icon-wrapper"><PackageOpen /></div>
    {t("named_styles.empty_message1")}
    <br />
    {t("named_styles.empty_message2")}
  </div>
{:else}
  <div class="ic-named-styles-manage-list">
    {#each customStyles as s (s.name)}
      <div class="ic-named-styles-manage-item">
        <div
          class="ic-named-styles-manage-item-preview"
          style={styleText(getTileStyle(model, s.style))}
        >
          {getPreviewText(s.style.num_fmt, formatOptions, t)}
        </div>
        <div class="ic-named-styles-manage-item-name">{s.name}</div>
        <div class="ic-named-styles-manage-item-icons">
          <Tooltip title={t("named_styles.update_style")}>
            <IconButton aria-label={t("named_styles.update_style")} onclick={() => onEdit(s)}>
              {#snippet icon()}<PencilLine size={16} />{/snippet}
            </IconButton>
          </Tooltip>
          <Tooltip title={t("named_styles.delete_style")}>
            <IconButton aria-label={t("named_styles.delete_style")} onclick={() => onDelete(s)}>
              {#snippet icon()}<Trash2 size={16} />{/snippet}
            </IconButton>
          </Tooltip>
        </div>
      </div>
    {/each}
  </div>
{/if}

<style>
  /* The manage list rules of upstream NamedStyles/named-styles.css */
  .ic-named-styles-manage-list {
    flex: 1;
    display: flex;
    flex-direction: column;
  }

  .ic-named-styles-manage-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px 8px 15px;
    height: 68px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--palette-grey-200);
  }

  .ic-named-styles-manage-item-preview {
    box-sizing: border-box;
    width: 40px;
    height: 36px;
    padding: 4px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--typography-font-size);
    line-height: 1;
    font-family: var(--typography-font-family);
    font-weight: 400;
    color: var(--palette-common-black);
  }

  .ic-named-styles-manage-item-name {
    flex: 1;
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-common-black);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-weight: 600;
  }

  .ic-named-styles-manage-item-icons {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .ic-named-styles-empty-state-message {
    height: 100%;
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

  .ic-named-styles-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background-color: var(--palette-grey-100);
    color: var(--palette-grey-600);
  }

  .ic-named-styles-icon-wrapper :global(svg) {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }
</style>
