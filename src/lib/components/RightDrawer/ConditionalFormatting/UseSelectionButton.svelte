<!--
  The "Use selection" button of upstream's rule editors
  (`ic-edit-rule-range-button`): it fills a field with the selected range.
-->
<script lang="ts">
  import SquareMousePointer from "@lucide/svelte/icons/square-mouse-pointer";
  import { t } from "../../../i18n";
  import IconButton from "../../Button/IconButton.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";

  interface Props {
    onclick: () => void;
  }

  let { onclick }: Props = $props();
</script>

<Tooltip title={t("conditional_formatting.use_selection")}>
  <IconButton
    size="xs"
    variant="secondary"
    aria-label={t("conditional_formatting.use_selection")}
    class="ic-edit-rule-range-button"
    {onclick}
  >
    {#snippet icon()}<SquareMousePointer />{/snippet}
  </IconButton>
</Tooltip>
