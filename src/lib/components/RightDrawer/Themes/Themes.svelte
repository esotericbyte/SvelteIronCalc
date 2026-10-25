<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/Themes/themes.tsx:
  the list of themes (the built-in ones, the workbook's own if it is not
  one of them, and the custom one once made); picking one applies it, and
  the selected one can be customized, which makes the single custom theme,
  kept on top of the list.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import { t } from "../../../i18n";
  import { themeEquals } from "../../../upstream/components/RightDrawer/Themes/themeUtils";
  import IconButton from "../../Button/IconButton.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";
  import DrawerHeader from "../DrawerHeader.svelte";
  import EditTheme from "./EditTheme.svelte";
  import { type ThemeData, themeToThemeData } from "./themeData";
  import ThemePreview from "./ThemePreview.svelte";

  interface Props {
    themes: IronCalcTheme[];
    currentTheme: IronCalcTheme;
    onThemePicked: (theme: IronCalcTheme) => void;
    onClose: () => void;
  }

  let { themes: builtinThemes, currentTheme, onThemePicked, onClose }: Props = $props();

  // svelte-ignore state_referenced_locally
  let themes: IronCalcTheme[] = $state(builtinThemes);
  const allThemes = $derived(
    themes.some((theme) => themeEquals(theme, currentTheme))
      ? themes
      : [...themes, currentTheme],
  );
  // svelte-ignore state_referenced_locally
  let selectedIndex = $state(
    Math.max(
      0,
      allThemes.findIndex((theme) => themeEquals(theme, currentTheme)),
    ),
  );
  let editing: IronCalcTheme | null = $state(null);

  function selectTheme(index: number): void {
    selectedIndex = index;
    onThemePicked(allThemes[index]);
  }

  function handleSave(data: ThemeData): void {
    if (editing === null) {
      return;
    }
    const customThemeName = t("themes.custom_theme_name");
    const newTheme: IronCalcTheme = {
      ...editing,
      name: customThemeName,
      dk1: data.textColor,
      lt1: data.bgColor,
      dk2: data.darkColor,
      lt2: data.lightColor,
      accent1: data.accentColors[0],
      accent2: data.accentColors[1],
      accent3: data.accentColors[2],
      accent4: data.accentColors[3],
      accent5: data.accentColors[4],
      accent6: data.accentColors[5],
      hlink: data.hlinkColor,
      fol_hlink: data.folHlinkColor,
    };

    // Only one custom theme at a time. Always placed on top.
    themes = [newTheme, ...themes.filter((theme) => theme.name !== customThemeName)];
    selectedIndex = 0;
    onThemePicked(newTheme);
    editing = null;
  }
</script>

<div class="ic-themes-container">
  {#if editing}
    {@const editingData = themeToThemeData(editing)}
    <DrawerHeader
      title={t("themes.customize_theme")}
      {onClose}
      onBack={() => (editing = null)}
      backLabel={t("themes.back_to_list")}
    />
    <div class="ic-themes-content">
      <EditTheme
        initialName={editingData.name}
        initialTextColor={editingData.textColor}
        initialBgColor={editingData.bgColor}
        initialLightColor={editingData.lightColor}
        initialDarkColor={editingData.darkColor}
        initialAccentColors={editingData.accentColors}
        initialHlinkColor={editingData.hlinkColor}
        initialFolHlinkColor={editingData.folHlinkColor}
        {currentTheme}
        onSave={handleSave}
        onClose={() => (editing = null)}
      />
    </div>
  {:else}
    <DrawerHeader title={t("themes.panel_title")} {onClose} />
    <div class="ic-themes-content" role="listbox" aria-label={t("themes.panel_title")}>
      {#each allThemes as theme, i (i)}
        <div
          class={["ic-themes-list-item", selectedIndex === i && "ic-themes-list-item--selected"]}
          role="option"
          aria-selected={selectedIndex === i}
          aria-label={theme.name}
          tabindex="0"
          onclick={() => selectTheme(i)}
          onkeydown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              selectTheme(i);
            }
          }}
        >
          <ThemePreview theme={themeToThemeData(theme)} class="ic-themes-list-item-preview" />
          <div class="ic-themes-list-item-name">{theme.name}</div>
          {#if selectedIndex === i}
            <div class="ic-themes-list-item-icons">
              <Tooltip title={t("themes.customize_theme")}>
                <IconButton
                  aria-label={t("themes.customize_theme")}
                  onclick={(event) => {
                    event.stopPropagation();
                    editing = theme;
                  }}
                >
                  {#snippet icon()}<PencilLine />{/snippet}
                </IconButton>
              </Tooltip>
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  /* Port of upstream Themes/themes.css; the headers are DrawerHeader's and
     the preview's inner rules ThemePreview's */
  .ic-themes-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: var(--typography-font-family);
  }

  .ic-themes-content {
    flex: 1;
    overflow: auto;
  }

  .ic-themes-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px;
    height: 68px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--palette-grey-200);
    border-left: 3px solid transparent;
    transition: all 0.2s ease-in-out;
    cursor: pointer;
  }

  .ic-themes-list-item--selected {
    padding-left: 20px;
    border-left: 3px solid var(--palette-primary-main);
  }

  .ic-themes-list-item:hover {
    background-color: var(--palette-grey-50);
    padding-left: 20px;
  }

  :global(.ic-themes-list-item-preview) {
    width: 56px;
    height: 40px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-family: var(--typography-font-family);
    font-weight: 600;
    overflow: hidden;
  }

  .ic-themes-list-item-name {
    flex: 1;
    font-size: 12px;
    font-weight: 600;
    color: var(--palette-common-black);
    font-family: var(--typography-font-family);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    min-width: 0;
  }

  .ic-themes-list-item-icons {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }
</style>
