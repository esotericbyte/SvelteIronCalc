<!--
  Port of upstream webapp/IronCalc/src/components/Tooltip/Tooltip.tsx on
  Skeleton's Tooltip: a short label shown above the wrapped element on
  hover or focus, below it when there is no room. The wrapper is a span,
  as upstream's, so the child keeps its own role.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  export interface TooltipProperties {
    title: string;
    children: Snippet;
  }
</script>

<script lang="ts">
  import { Portal, Tooltip } from "@skeletonlabs/skeleton-svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import { getRootElement } from "../rootContext";

  let { title, children }: TooltipProperties = $props();

  const root = getRootElement();
</script>

<Tooltip openDelay={300} closeDelay={0} positioning={{ placement: "top" }}>
  <Tooltip.Trigger>
    {#snippet element(attributes)}
      <!-- the span only relays the pointer and focus events of its child -->
      <span {...attributes as HTMLAttributes<HTMLSpanElement>} role="none" class="ic-tooltip-trigger">
        {@render children()}
      </span>
    {/snippet}
  </Tooltip.Trigger>
  <Portal target={root() ?? undefined}>
    <Tooltip.Positioner class="ic-tooltip-positioner">
      <Tooltip.Content class="ic-tooltip">{title}</Tooltip.Content>
    </Tooltip.Positioner>
  </Portal>
</Tooltip>

<style>
  /* Port of upstream Tooltip/tooltip.css */
  .ic-tooltip-trigger {
    display: inline-flex;
  }

  :global(.ic-tooltip-positioner) {
    z-index: 1400 !important;
  }

  :global(.ic-tooltip) {
    pointer-events: none;
    white-space: nowrap;
    font-family: var(--typography-font-family);
    font-size: calc(var(--typography-font-size) - 1px);
    color: var(--palette-common-white);
    background-color: color-mix(
      in srgb,
      var(--palette-common-black) 80%,
      transparent
    );
    border-radius: 4px;
    padding: 4px 8px;
  }
</style>
