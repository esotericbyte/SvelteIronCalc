<!--
  Port of upstream webapp/IronCalc/src/components/Worksheet/LinkTooltip.tsx:
  the link of the hovered cell, to follow, copy, edit (in the link dialog)
  or break. Without `onEdit` / `onDelete` (read-only) those actions are not
  shown.
-->
<script lang="ts">
  import type { CellLink } from "@ironcalc/wasm";
  import Copy from "@lucide/svelte/icons/copy";
  import Globe from "@lucide/svelte/icons/globe";
  import Link2Off from "@lucide/svelte/icons/link-2-off";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import { t } from "../../i18n";
  import type { LinkHoverCell } from "../../upstream/components/WorksheetCanvas/cellLinks";
  import {
    headerColumnWidth,
    headerRowHeight,
  } from "../../upstream/components/WorksheetCanvas/constants";

  interface Props {
    cell: LinkHoverCell;
    onFollow: (link: CellLink) => void;
    onEdit?: (row: number, column: number) => void;
    onDelete?: (row: number, column: number) => void;
    onHide: () => void;
    onPointerEnter: () => void;
    onPointerLeave: () => void;
  }

  let {
    cell,
    onFollow,
    onEdit,
    onDelete,
    onHide,
    onPointerEnter,
    onPointerLeave,
  }: Props = $props();

  function linkLabel(link: CellLink): string {
    if (link.type === "Internal") {
      return link.location;
    }
    const target = link.target;
    try {
      const url = new URL(target);
      if (url.protocol === "http:" || url.protocol === "https:") {
        return url.hostname.replace(/^www\./, "");
      }
      if (url.protocol === "mailto:") {
        return url.pathname;
      }
    } catch {
      // not a valid URL: fall through and show the raw target
    }
    return target;
  }

  // The tooltip is measured before it is shown so it can be placed above (or
  // below) the cell, flush with the cell edge: any gap would make the pointer
  // cross a neighboring cell on its way to the tooltip.
  let height: number | null = $state(null);
  let rootElement: HTMLDivElement | null = $state(null);

  $effect(() => {
    void cell;
    const measured = rootElement?.offsetHeight || 26;
    if (height !== measured) {
      height = measured;
    }
  });

  const link = $derived(cell.link);
  const top = $derived.by(() => {
    const above = cell.y - (height ?? 26) + 1;
    return above < headerRowHeight ? cell.y + cell.height - 1 : above;
  });
  const left = $derived(Math.max(headerColumnWidth + 2, cell.x));
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={rootElement}
  class="ic-worksheet-link-tooltip"
  style:left="{left}px"
  style:top="{top}px"
  style:visibility={height === null ? "hidden" : "visible"}
  onpointerenter={onPointerEnter}
  onpointerleave={onPointerLeave}
  onpointerdown={(event) => event.stopPropagation()}
>
  <div class="ic-worksheet-link-tooltip-row">
    <span class="ic-worksheet-link-tooltip-icon"><Globe /></span>
    <button
      type="button"
      class="ic-worksheet-link-tooltip-label"
      onclick={() => {
        onHide();
        onFollow(link);
      }}
    >
      {linkLabel(link)}
    </button>
    <div class="ic-worksheet-link-tooltip-actions">
      <button
        type="button"
        class="ic-worksheet-link-tooltip-button"
        title={t("link_tooltip.copy")}
        aria-label={t("link_tooltip.copy")}
        onclick={() => {
          const text = link.type === "External" ? link.target : link.location;
          navigator.clipboard?.writeText(text).catch(() => {
            // clipboard access denied or unavailable: nothing to do
          });
        }}
      >
        <Copy />
      </button>
      <!-- Dynamic links (created by formulas like HYPERLINK) cannot be edited
        or deleted: only the formula itself can change them. -->
      {#if onEdit && !link.dynamic}
        <button
          type="button"
          class="ic-worksheet-link-tooltip-button"
          title={t("link_tooltip.edit")}
          aria-label={t("link_tooltip.edit")}
          onclick={() => {
            onHide();
            onEdit(cell.row, cell.column);
          }}
        >
          <PencilLine />
        </button>
      {/if}
      {#if onDelete && !link.dynamic}
        <button
          type="button"
          class="ic-worksheet-link-tooltip-button"
          title={t("link_tooltip.break")}
          aria-label={t("link_tooltip.break")}
          onclick={() => {
            onHide();
            onDelete(cell.row, cell.column);
          }}
        >
          <Link2Off />
        </button>
      {/if}
    </div>
  </div>
  {#if link.tooltip}
    <div class="ic-worksheet-link-tooltip-text">{link.tooltip}</div>
  {/if}
</div>

<style>
  .ic-worksheet-link-tooltip {
    position: absolute;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 2px 2px 2px 6px;
    border-radius: 4px;
    background-color: color-mix(
      in srgb,
      var(--palette-grey-900) 94%,
      transparent
    );
    color: var(--palette-common-white);
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    white-space: nowrap;
    box-shadow: var(--shadow-md);
    z-index: 20;
  }

  .ic-worksheet-link-tooltip :global(svg) {
    width: 1em;
    height: 1em;
  }

  .ic-worksheet-link-tooltip-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ic-worksheet-link-tooltip-text {
    color: var(--palette-grey-400);
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 0px 4px 2px 0px;
  }

  .ic-worksheet-link-tooltip-icon {
    display: flex;
    align-items: center;
    color: var(--palette-grey-400);
  }

  .ic-worksheet-link-tooltip-label {
    background: none;
    border: none;
    padding: 0;
    margin: 0;
    color: inherit;
    font-size: inherit;
    font-family: inherit;
    cursor: pointer;
    max-width: 240px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ic-worksheet-link-tooltip-label:hover {
    text-decoration: underline;
  }

  .ic-worksheet-link-tooltip-actions {
    display: flex;
    align-items: center;
    gap: 2px;
    margin-left: auto;
  }

  .ic-worksheet-link-tooltip-button {
    display: flex;
    align-items: center;
    background: none;
    border: none;
    padding: 4px;
    margin: 0;
    color: var(--palette-grey-400);
    cursor: pointer;
    border-radius: 2px;
  }

  .ic-worksheet-link-tooltip-button:hover {
    color: var(--palette-common-white);
    background-color: var(--palette-grey-800);
  }
</style>
