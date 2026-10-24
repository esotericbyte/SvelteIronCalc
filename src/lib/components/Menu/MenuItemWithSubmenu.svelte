<!--
  Port of upstream MenuItemWithSubmenu (Menu/MenuItem.tsx): an item that
  opens a submenu to its right, on hover or with ArrowRight / Enter. It is a
  nested Skeleton Menu whose trigger is a Menu.TriggerItem of the parent;
  zag handles the hover intent, the keys and closing the whole tree when a
  submenu item is chosen.
-->
<script lang="ts" module>
  import type { Snippet } from "svelte";

  export interface MenuItemWithSubmenuProps {
    icon?: Snippet;
    children: Snippet;
    submenu: Snippet;
  }
</script>

<script lang="ts">
  import ChevronRight from "@lucide/svelte/icons/chevron-right";
  import { Menu, Portal } from "@skeletonlabs/skeleton-svelte";
  import { getRootElement } from "../rootContext";
  import { createMenuHandlers } from "./menuContext";

  let { icon, children, submenu }: MenuItemWithSubmenuProps = $props();

  const root = getRootElement();
  const handlers = createMenuHandlers();
  const value = $props.id();
</script>

<Menu
  onSelect={(details) => handlers.select(details.value)}
  positioning={{ placement: "right-start", gutter: 4 }}
>
  <Menu.TriggerItem {value} class="ic-menu-item">
    {#if icon}
      <span class="ic-menu-item-icon" aria-hidden="true">{@render icon()}</span>
    {/if}
    <span class="ic-menu-item-label">{@render children()}</span>
    <span class="ic-menu-item-icon" aria-hidden="true"><ChevronRight /></span>
  </Menu.TriggerItem>
  <Portal target={root() ?? undefined}>
    <Menu.Positioner class="ic-menu-wrapper">
      <Menu.Content class="ic-menu">
        {@render submenu()}
      </Menu.Content>
    </Menu.Positioner>
  </Portal>
</Menu>
