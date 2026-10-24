<!-- Port of upstream webapp/IronCalc/src/components/Menu/MenuDivider.tsx. -->
<script lang="ts">
  import { Menu } from "@skeletonlabs/skeleton-svelte";
</script>

<Menu.Separator class="ic-menu-divider" />

<style>
  :global(.ic-menu-divider) {
    height: 1px;
    margin: 4px -4px;
    border: none;
    background: var(--palette-grey-200);
  }
</style>
