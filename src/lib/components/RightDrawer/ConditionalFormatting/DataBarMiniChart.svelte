<!--
  Port of the DataBarMiniChart of upstream
  webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/DataBarsRule.tsx:
  four bars of different lengths, the preview of a data bars rule.
-->
<script lang="ts">
  import { BAR_WIDTHS, barBackground } from "./dataBars";

  interface Props {
    color: string;
    gradient: boolean;
  }

  let { color, gradient }: Props = $props();
</script>

<div class="ic-db-mini-chart">
  {#each BAR_WIDTHS as w (w)}
    <div class="ic-db-bar-segment">
      <div style:width={`${w * 100}%`} style:height="100%" style:background={barBackground(color, gradient)}></div>
    </div>
  {/each}
</div>

<style>
  .ic-db-mini-chart {
    position: absolute;
    inset: 1px;
    display: flex;
    flex-direction: column;
    border-radius: 3px;
    overflow: hidden;
  }

  .ic-db-bar-segment {
    flex: 1;
    display: flex;
    align-items: center;
  }

  .ic-db-bar-segment + .ic-db-bar-segment {
    border-top: 1px solid var(--palette-grey-200);
  }
</style>
