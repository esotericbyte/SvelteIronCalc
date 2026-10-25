<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/FormatStylePicker.tsx:
  the format a classic rule gives the cells (bold, italic, underline,
  strikethrough, font and fill colors) over a preview, with a button to
  clear it and eight preset formats.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import Bold from "@lucide/svelte/icons/bold";
  import Italic from "@lucide/svelte/icons/italic";
  import PaintBucket from "@lucide/svelte/icons/paint-bucket";
  import RemoveFormatting from "@lucide/svelte/icons/remove-formatting";
  import Strikethrough from "@lucide/svelte/icons/strikethrough";
  import Type from "@lucide/svelte/icons/type";
  import Underline from "@lucide/svelte/icons/underline";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import IconButton from "../../Button/IconButton.svelte";
  import ColorPicker from "../../ColorPicker/ColorPicker.svelte";
  import { DEFAULT_STYLE, type FormatStyle, PRESETS } from "./formatStyle";

  interface Props {
    value: FormatStyle;
    onChange: (style: FormatStyle) => void;
    currentTheme: IronCalcTheme;
  }

  let { value, onChange, currentTheme }: Props = $props();

  let fontColorOpen = $state(false);
  let fillColorOpen = $state(false);
  let fontColorButton: HTMLButtonElement | null = $state(null);
  let fillColorButton: HTMLButtonElement | null = $state(null);

  function toggle(key: "bold" | "italic" | "underline" | "strike"): void {
    onChange({ ...value, [key]: !value[key] });
  }

  const fontColor = $derived(
    resolveColorToHex(value.fontColor, currentTheme) ||
      "var(--palette-sheet-default-text-color)",
  );
  const fillColor = $derived(resolveColorToHex(value.fillColor, currentTheme) || "transparent");
  const textDecoration = $derived(
    [value.underline ? "underline" : "", value.strike ? "line-through" : ""]
      .filter(Boolean)
      .join(" ") || "none",
  );
</script>

<div class="ic-fsp-wrapper">
  <div class="ic-fsp-editor">
    <div
      class="ic-fsp-preview"
      style:font-weight={value.bold ? "bold" : "normal"}
      style:font-style={value.italic ? "italic" : "normal"}
      style:text-decoration={textDecoration}
      style:color={fontColor}
      style:background-color={fillColor}
    >
      AaBbCc
    </div>
    <div class="ic-fsp-toolbar">
      <div class="ic-fsp-toolbar-left">
        <IconButton pressed={value.bold} aria-label={t("toolbar.bold")} onclick={() => toggle("bold")}>
          {#snippet icon()}<Bold />{/snippet}
        </IconButton>
        <IconButton
          pressed={value.italic}
          aria-label={t("toolbar.italic")}
          onclick={() => toggle("italic")}
        >
          {#snippet icon()}<Italic />{/snippet}
        </IconButton>
        <IconButton
          pressed={value.underline}
          aria-label={t("toolbar.underline")}
          onclick={() => toggle("underline")}
        >
          {#snippet icon()}<Underline />{/snippet}
        </IconButton>
        <IconButton
          pressed={value.strike}
          aria-label={t("toolbar.strike_through")}
          onclick={() => toggle("strike")}
        >
          {#snippet icon()}<Strikethrough />{/snippet}
        </IconButton>
        <IconButton
          bind:ref={fontColorButton}
          class="ic-fsp-color-button"
          aria-label={t("toolbar.font_color")}
          onclick={() => (fontColorOpen = true)}
        >
          {#snippet icon()}
            <Type />
            <div class="ic-fsp-color-bar" style:background-color={fontColor}></div>
          {/snippet}
        </IconButton>
        <IconButton
          bind:ref={fillColorButton}
          class="ic-fsp-color-button"
          aria-label={t("toolbar.fill_color")}
          onclick={() => (fillColorOpen = true)}
        >
          {#snippet icon()}
            <PaintBucket />
            <div class="ic-fsp-color-bar" style:background-color={fillColor}></div>
          {/snippet}
        </IconButton>
      </div>
      <IconButton aria-label={t("toolbar.clear_formatting")} onclick={() => onChange(DEFAULT_STYLE)}>
        {#snippet icon()}<RemoveFormatting />{/snippet}
      </IconButton>
    </div>
  </div>

  <div class="ic-fsp-presets-section">
    <div class="ic-fsp-presets-label">{t("conditional_formatting.default_styles")}</div>
    <div class="ic-fsp-presets">
      {#each PRESETS as preset, index (index)}
        <button
          type="button"
          class="ic-fsp-preset"
          style:color={resolveColorToHex(preset.fontColor, currentTheme)}
          style:background-color={resolveColorToHex(preset.fillColor, currentTheme) || "#FFFFFF"}
          style:border-color={resolveColorToHex(preset.fontColor, currentTheme)}
          onclick={() => onChange(preset)}
          aria-label={t("conditional_formatting.apply_preset")}
        >
          Aa
        </button>
      {/each}
    </div>
  </div>

  <ColorPicker
    color={value.fontColor}
    defaultColor=""
    defaultSwatchColor="var(--palette-sheet-default-text-color)"
    title={t("color_picker.default")}
    onChange={(color) => {
      onChange({ ...value, fontColor: color });
      fontColorOpen = false;
    }}
    onClose={() => (fontColorOpen = false)}
    anchorEl={() => fontColorButton}
    open={fontColorOpen}
    theme={currentTheme}
  />
  <ColorPicker
    color={value.fillColor || "#FFFFFF"}
    defaultColor=""
    title={t("color_picker.default")}
    onChange={(color) => {
      onChange({ ...value, fillColor: color });
      fillColorOpen = false;
    }}
    onClose={() => (fillColorOpen = false)}
    anchorEl={() => fillColorButton}
    open={fillColorOpen}
    theme={currentTheme}
  />
</div>

<style>
  /* Port of upstream ConditionalFormatting/format-style-picker.css; the
     presets' rules, which the other rule editors share, are EditRule's */
  .ic-fsp-wrapper {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ic-fsp-editor {
    border: 1px solid var(--palette-grey-300);
    border-radius: 6px;
    overflow: hidden;
  }

  .ic-fsp-preview {
    height: 32px;
    padding: 0 12px;
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    text-align: center;
    border-bottom: 1px solid var(--palette-grey-200);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .ic-fsp-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 2px 4px;
  }

  .ic-fsp-toolbar-left {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .ic-fsp-toolbar-left :global(.ic-fsp-color-button) {
    position: relative;
  }

  .ic-fsp-color-bar {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    width: 14px;
    height: 3px;
    border-radius: 1px;
  }

  .ic-fsp-presets-label {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-common-black);
  }
</style>
