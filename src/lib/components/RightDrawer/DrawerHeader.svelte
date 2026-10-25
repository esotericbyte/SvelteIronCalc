<!--
  The header every section of the right drawer repeats upstream: in a list,
  its title and a close button; in an edit view, a back button too. Upstream
  writes it out in each section (`ic-named-ranges-header`,
  `ic-cf-edit-header`, ...) with the same styles.
-->
<script lang="ts">
  import ArrowLeft from "@lucide/svelte/icons/arrow-left";
  import X from "@lucide/svelte/icons/x";
  import { t } from "../../i18n";
  import IconButton from "../Button/IconButton.svelte";
  import Tooltip from "../Tooltip/Tooltip.svelte";

  interface Props {
    title: string;
    onClose: () => void;
    /** Shows the back button of an edit view. */
    onBack?: () => void;
    backLabel?: string;
  }

  let { title, onClose, onBack, backLabel = "" }: Props = $props();
</script>

<div class={onBack ? "ic-drawer-edit-header" : "ic-drawer-header"}>
  {#if onBack}
    <Tooltip title={backLabel}>
      <IconButton aria-label={backLabel} onclick={onBack}>
        {#snippet icon()}<ArrowLeft />{/snippet}
      </IconButton>
    </Tooltip>
  {/if}
  <div class={onBack ? "ic-drawer-edit-header-title" : "ic-drawer-header-title"}>
    {title}
  </div>
  <Tooltip title={t("right_drawer.close")}>
    <IconButton aria-label={t("right_drawer.close")} onclick={onClose}>
      {#snippet icon()}<X />{/snippet}
    </IconButton>
  </Tooltip>
</div>

<style>
  /* The headers of upstream's named-ranges.css, conditional-formatting.css,
     named-styles.css, themes.css and regional-settings.css */
  .ic-drawer-header,
  .ic-drawer-edit-header {
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 8px;
    color: var(--palette-common-black);
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-drawer-header {
    justify-content: flex-end;
  }

  .ic-drawer-edit-header {
    justify-content: space-between;
    gap: 8px;
  }

  .ic-drawer-header-title {
    width: 100%;
    font-size: var(--typography-font-size);
  }

  .ic-drawer-edit-header-title {
    flex: 1;
    font-size: var(--typography-font-size);
    font-weight: 500;
  }
</style>
