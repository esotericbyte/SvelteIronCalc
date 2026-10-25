<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/Themes/EditTheme.tsx:
  the colors of a theme (text, background, dark, light, the six accents and
  the two link colors) with a live preview. Ctrl/Cmd+Enter applies.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import { t } from "../../../i18n";
  import Button from "../../Button/Button.svelte";
  import ColorField from "./ColorField.svelte";
  import type { ThemeData } from "./themeData";
  import ThemePreview from "./ThemePreview.svelte";

  interface Props {
    initialName: string;
    initialTextColor: string;
    initialBgColor: string;
    initialLightColor: string;
    initialDarkColor: string;
    currentTheme: IronCalcTheme;
    initialAccentColors: ThemeData["accentColors"];
    initialHlinkColor: string;
    initialFolHlinkColor: string;
    onSave: (data: ThemeData) => void;
    onClose: () => void;
  }

  let {
    initialName,
    initialTextColor,
    initialBgColor,
    initialLightColor,
    initialDarkColor,
    initialAccentColors,
    initialHlinkColor,
    initialFolHlinkColor,
    onSave,
    onClose,
    currentTheme,
  }: Props = $props();

  // svelte-ignore state_referenced_locally
  let textColor = $state(initialTextColor);
  // svelte-ignore state_referenced_locally
  let bgColor = $state(initialBgColor);
  // svelte-ignore state_referenced_locally
  let lightColor = $state(initialLightColor);
  // svelte-ignore state_referenced_locally
  let darkColor = $state(initialDarkColor);
  // svelte-ignore state_referenced_locally
  let accentColors: ThemeData["accentColors"] = $state([...initialAccentColors]);
  // svelte-ignore state_referenced_locally
  let hlinkColor = $state(initialHlinkColor);
  // svelte-ignore state_referenced_locally
  let folHlinkColor = $state(initialFolHlinkColor);

  function handleSave(): void {
    onSave({
      name: initialName,
      textColor,
      bgColor,
      lightColor,
      darkColor,
      accentColors: [...accentColors],
      hlinkColor,
      folHlinkColor,
    });
  }

  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  }
</script>

<!-- the container captures Cmd/Ctrl+Enter bubbling from its fields -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ic-edit-theme-container" onkeydown={handleKeyDown}>
  <div class="ic-edit-theme-content-area">
    <div class="ic-edit-theme-header-box">
      <ThemePreview theme={{ bgColor, textColor, accentColors }} class="ic-edit-theme-preview" />
      <span class="ic-edit-theme-header-box-text">{initialName}</span>
    </div>
    <div class="ic-edit-theme-section">
      <ColorField
        label={t("themes.text_color_label")}
        value={textColor}
        onChange={(color) => (textColor = color)}
        onKeyDown={handleKeyDown}
        {currentTheme}
      />
      <ColorField
        label={t("themes.bg_color_label")}
        value={bgColor}
        onChange={(color) => (bgColor = color)}
        onKeyDown={handleKeyDown}
        {currentTheme}
      />
    </div>
    <div class="ic-edit-theme-section">
      <ColorField
        label={t("themes.dark_color_label")}
        value={darkColor}
        onChange={(color) => (darkColor = color)}
        onKeyDown={handleKeyDown}
        {currentTheme}
      />
      <ColorField
        label={t("themes.light_color_label")}
        value={lightColor}
        onChange={(color) => (lightColor = color)}
        onKeyDown={handleKeyDown}
        {currentTheme}
      />
    </div>
    <div class="ic-edit-theme-section">
      {#each accentColors as color, i (i)}
        <ColorField
          label={t("themes.accent_color_label", { n: i + 1 })}
          value={color}
          onChange={(value) => (accentColors[i] = value)}
          onKeyDown={handleKeyDown}
          {currentTheme}
        />
      {/each}
    </div>
    <div class="ic-edit-theme-section">
      <ColorField
        label={t("themes.hlink_color_label")}
        value={hlinkColor}
        onChange={(color) => (hlinkColor = color)}
        onKeyDown={handleKeyDown}
        {currentTheme}
      />
      <ColorField
        label={t("themes.fol_hlink_color_label")}
        value={folHlinkColor}
        onChange={(color) => (folHlinkColor = color)}
        onKeyDown={handleKeyDown}
        {currentTheme}
      />
    </div>
  </div>
  <div class="ic-edit-theme-footer">
    <Button variant="secondary" onclick={onClose}>{t("themes.cancel")}</Button>
    <Button onclick={handleSave}>
      {#snippet startIcon()}<Check />{/snippet}
      {t("themes.apply")}
    </Button>
  </div>
</div>

<style>
  /* Port of upstream Themes/edit-theme.css; the fields are ColorField's */
  .ic-edit-theme-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ic-edit-theme-content-area {
    flex: 1;
    overflow: auto;
  }

  :global(.ic-edit-theme-preview) {
    width: 52px;
    height: 36px;
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

  .ic-edit-theme-header-box {
    font-size: 14px;
    font-family: var(--typography-font-family);
    font-weight: 600;
    gap: 8px;
    padding: 24px 12px;
    color: var(--palette-common-black);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-edit-theme-header-box-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ic-edit-theme-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 12px;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-edit-theme-section:last-child {
    border-bottom: none;
  }

  .ic-edit-theme-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid var(--palette-grey-300);
  }
</style>
