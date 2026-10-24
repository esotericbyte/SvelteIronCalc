<!--
  Port of upstream webapp/IronCalc/src/components/Menu/Menu.tsx on
  Skeleton's Menu, which brings what upstream's useMenuKeyDown,
  useAnchorPosition and the outside-press handling implement by hand
  (arrow keys, typeahead, Escape, flipping to stay in the viewport).

  Like upstream it has two modes: given a `trigger`, the menu opens below
  it on click (the snippet gets the attributes to spread on its button);
  otherwise it is controlled by `open`, `onClose` and `anchorPosition`, the
  viewport point it opens at (context menus). It portals into the widget's
  `.ic-root`, so the theme variables apply.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  interface MenuTriggerProperties {
    /** The trigger button; spread the attributes on it. */
    trigger: Snippet<[Record<string, unknown>]>;
    open?: never;
    onClose?: never;
    anchorPosition?: never;
    children: Snippet;
  }

  interface MenuControlledProperties {
    trigger?: never;
    open: boolean;
    onClose: () => void;
    anchorPosition: { x: number; y: number } | null;
    children: Snippet;
  }

  export type MenuProperties = MenuTriggerProperties | MenuControlledProperties;
</script>

<script lang="ts">
  import { Menu, Portal } from "@skeletonlabs/skeleton-svelte";
  import { getRootElement } from "../rootContext";
  import { createMenuHandlers } from "./menuContext";

  let props: MenuProperties = $props();

  const root = getRootElement();
  const handlers = createMenuHandlers();

  const positioning = $derived.by(() => {
    const point = props.anchorPosition;
    if (props.trigger || !point) {
      return { placement: "bottom-start" as const, gutter: 4 };
    }
    return {
      placement: "bottom-start" as const,
      gutter: 0,
      getAnchorRect: () => ({ x: point.x, y: point.y, width: 0, height: 0 }),
    };
  });
</script>

<Menu
  open={props.trigger ? undefined : props.open && props.anchorPosition !== null}
  onOpenChange={(details) => {
    if (!details.open) {
      props.onClose?.();
    }
  }}
  onSelect={(details) => handlers.select(details.value)}
  {positioning}
>
  {#if props.trigger}
    <Menu.Trigger element={props.trigger} />
  {/if}
  <Portal target={root() ?? undefined}>
    <Menu.Positioner class="ic-menu-wrapper">
      <Menu.Content class="ic-menu">
        {@render props.children()}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>

<style>
  /* Port of upstream Menu/menu.css; the items are in MenuItem.svelte */
  :global(.ic-menu-wrapper) {
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
    z-index: 1300 !important;
  }

  :global(.ic-menu) {
    box-sizing: border-box;
    min-width: 160px;
    max-height: calc(100vh - 16px);
    overflow-y: auto;
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 8px;
    background: var(--palette-surface-elevated);
    padding: 4px;
    box-shadow: var(--shadow-md);
    outline: none;
  }

  :global(.ic-menu[hidden]) {
    display: none;
  }
</style>
