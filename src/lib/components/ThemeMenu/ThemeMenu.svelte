<!--
  Port of upstream webapp/IronCalc/src/components/ThemeMenu/ThemeMenu.tsx:
  the toolbar's workbook theme menu. It lists the built-in themes (and the
  workbook's own when it is none of them) with their six accent colors, the
  current one checked, and ends with "Manage themes", which opens the themes
  drawer. The menu opens below `trigger`, which spreads the attributes it
  gets on its button.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import Settings from "@lucide/svelte/icons/settings";
  import type { Snippet } from "svelte";
  import { t } from "../../i18n";
  import { themeEquals } from "../../upstream/components/RightDrawer/Themes/themeUtils";
  import Menu from "../Menu/Menu.svelte";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";

  const ACCENT_KEYS: (keyof IronCalcTheme)[] = [
    "accent1",
    "accent2",
    "accent3",
    "accent4",
    "accent5",
    "accent6",
  ];

  interface Props {
    trigger: Snippet<[Record<string, unknown>]>;
    themes: IronCalcTheme[];
    currentTheme: IronCalcTheme;
    onChange: (theme: IronCalcTheme) => void;
    /** Opens the themes drawer; the entry is disabled without it. */
    onManageThemes?: () => void;
  }

  let { trigger, themes, currentTheme, onChange, onManageThemes }: Props = $props();

  const allThemes = $derived(
    themes.some((theme) => themeEquals(theme, currentTheme))
      ? themes
      : [...themes, currentTheme],
  );
</script>

<Menu {trigger}>
  {#each allThemes as theme, index (index)}
    {@const isCurrent = themeEquals(theme, currentTheme)}
    <MenuItem onClick={() => onChange(theme)} checked={isCurrent}>
      {#snippet secondaryText()}
        <span class="ic-theme-menu-swatches">
          {#each ACCENT_KEYS as key (key)}
            <span
              class="ic-theme-menu-swatch"
              style:background-color={theme[key] as string}
            ></span>
          {/each}
        </span>
      {/snippet}
      {theme.name}
    </MenuItem>
  {/each}
  <MenuDivider />
  <MenuItem onClick={onManageThemes} disabled={!onManageThemes}>
    {#snippet icon()}<Settings />{/snippet}
    {t("themes.manage_themes")}
  </MenuItem>
</Menu>

<style>
  /* Port of upstream ThemeMenu/theme-menu.css */
  .ic-theme-menu-swatches {
    display: flex;
    align-items: center;
  }

  .ic-theme-menu-swatch {
    display: inline-block;
    width: 12px;
    height: 12px;
    border-radius: 4px;
    border: 1px solid var(--palette-surface-elevated);
  }

  .ic-theme-menu-swatch + .ic-theme-menu-swatch {
    margin-left: -4px;
  }

  :global(.ic-menu-item[data-highlighted]) .ic-theme-menu-swatch {
    border: 1px solid var(--palette-grey-200);
  }
</style>
