<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/NamedStyles/EditNamedStyle.tsx:
  the name of a cell style and which of its parts it includes (number
  format, font, fill, alignment, border), each with its settings, over a
  live preview. Ctrl/Cmd+Enter applies.
-->
<script lang="ts" module>
  import type {
    CellStyle,
    Color,
    FmtSettings,
    HorizontalAlignment,
    IronCalcTheme,
    Model,
    StyleIncludes,
    VerticalAlignment,
  } from "@ironcalc/wasm";
  import { BorderStyle } from "@ironcalc/wasm";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import type { FormatStyle } from "../ConditionalFormatting/formatStyle";
  import {
    borderStyleToCss,
    FAINT_PREVIEW_BORDER,
    getPreviewText,
    HORIZONTAL_JUSTIFY,
    type InlineStyle,
    styleText,
    VERTICAL_ALIGN_ITEMS,
  } from "./namedStylesUtils";

  export interface SaveError {
    nameError: string;
  }

  export interface NamedStyleSavePayload {
    name: string;
    style: CellStyle;
    includes: StyleIncludes;
  }

  interface BorderSides {
    top: boolean;
    right: boolean;
    bottom: boolean;
    left: boolean;
  }

  interface PreviewOptions {
    includeFont: boolean;
    includeFill: boolean;
    includeAlignment: boolean;
    includeBorder: boolean;
    horizontalAlign: HorizontalAlignment;
    verticalAlign: VerticalAlignment;
    borderSides: BorderSides;
    borderLineStyle: BorderStyle;
    borderColor: Color;
  }

  function formatStyleToPreview(
    formatStyle: FormatStyle,
    currentTheme: IronCalcTheme,
    options: PreviewOptions,
  ): InlineStyle {
    const preview: InlineStyle = {};
    if (options.includeFill) {
      preview["background-color"] =
        resolveColorToHex(formatStyle.fillColor, currentTheme) || undefined;
    }
    if (options.includeFont) {
      const decorations: string[] = [];
      if (formatStyle.underline) {
        decorations.push("underline");
      }
      if (formatStyle.strike) {
        decorations.push("line-through");
      }
      preview.color = resolveColorToHex(formatStyle.fontColor, currentTheme) || undefined;
      preview["font-weight"] = formatStyle.bold ? "bold" : undefined;
      preview["font-style"] = formatStyle.italic ? "italic" : undefined;
      preview["text-decoration"] =
        decorations.length > 0 ? decorations.join(" ") : undefined;
    }
    if (options.includeAlignment) {
      preview["justify-content"] = HORIZONTAL_JUSTIFY[options.horizontalAlign];
      preview["align-items"] = VERTICAL_ALIGN_ITEMS[options.verticalAlign];
    }
    if (options.includeBorder) {
      const { top, right, bottom, left } = options.borderSides;
      const borderCss = borderStyleToCss(
        options.borderLineStyle,
        resolveColorToHex(options.borderColor, currentTheme),
      );
      // Draw each side explicitly so the box-shadow never doubles a real border.
      preview["box-shadow"] = "none";
      preview["border-top"] = top ? borderCss : FAINT_PREVIEW_BORDER;
      preview["border-right"] = right ? borderCss : FAINT_PREVIEW_BORDER;
      preview["border-bottom"] = bottom ? borderCss : FAINT_PREVIEW_BORDER;
      preview["border-left"] = left ? borderCss : FAINT_PREVIEW_BORDER;
    }
    return preview;
  }

  function initFormatStyle(model: Model, style: CellStyle): FormatStyle {
    return {
      bold: style.font.b,
      italic: style.font.i,
      underline: style.font.u,
      strike: style.font.strike,
      fontColor: model.resolveColor(style.font.color),
      fillColor: model.resolveColor(style.fill.color),
    };
  }

  const CUSTOM_VALUE = "__custom__";

  const FONT_ATTRS = ["bold", "italic", "underline", "strike"] as const;
  type FontAttribute = (typeof FONT_ATTRS)[number];

  const BORDER_SIDES = ["top", "right", "bottom", "left"] as const;
  type BorderSide = (typeof BORDER_SIDES)[number];
</script>

<script lang="ts">
  import AlignCenter from "@lucide/svelte/icons/align-center";
  import AlignLeft from "@lucide/svelte/icons/align-left";
  import AlignRight from "@lucide/svelte/icons/align-right";
  import ArrowDownToLine from "@lucide/svelte/icons/arrow-down-to-line";
  import ArrowUpToLine from "@lucide/svelte/icons/arrow-up-to-line";
  import Bold from "@lucide/svelte/icons/bold";
  import Check from "@lucide/svelte/icons/check";
  import Italic from "@lucide/svelte/icons/italic";
  import Strikethrough from "@lucide/svelte/icons/strikethrough";
  import Underline from "@lucide/svelte/icons/underline";
  import { t } from "../../../i18n";
  import { NumberFormats } from "../../../upstream/components/FormatMenu/formatUtil";
  import { STYLE_OPTIONS as LINE_STYLE_OPTIONS } from "../../BorderPicker/LineStylePicker.svelte";
  import Button from "../../Button/Button.svelte";
  import ColorPicker from "../../ColorPicker/ColorPicker.svelte";
  import {
    ArrowMiddleFromLine,
    BorderBottomIcon,
    BorderLeftIcon,
    BorderNoneIcon,
    BorderOuterIcon,
    BorderRightIcon,
    BorderTopIcon,
  } from "../../icons";
  import Input from "../../Input/Input.svelte";
  import Menu from "../../Menu/Menu.svelte";
  import MenuItem from "../../Menu/MenuItem.svelte";
  import Select from "../../Select/Select.svelte";
  import Switch from "../../Switch/Switch.svelte";
  import ToggleButton from "../../ToggleButton/ToggleButton.svelte";
  import SwatchButton from "../SwatchButton.svelte";

  interface Props {
    model: Model;
    name: string;
    style: CellStyle;
    formatOptions: FmtSettings;
    existingStyleNames: string[];
    currentTheme: IronCalcTheme;
    onSave: (payload: NamedStyleSavePayload) => SaveError;
    onClose: () => void;
  }

  let {
    model,
    name: initialName,
    style,
    formatOptions,
    existingStyleNames,
    currentTheme,
    onSave,
    onClose,
  }: Props = $props();

  function getDefaultName(): string {
    if (initialName) {
      return initialName;
    }
    const prefix = t("named_styles.default_name_prefix");
    const existing = new Set(existingStyleNames.map((n) => n.toLowerCase()));
    let counter = 1;
    let candidate = `${prefix}${counter}`;
    while (existing.has(candidate.toLowerCase())) {
      counter++;
      candidate = `${prefix}${counter}`;
    }
    return candidate;
  }

  const knownFormats = $derived([
    NumberFormats.AUTO,
    formatOptions.number_fmt,
    NumberFormats.PERCENTAGE,
    NumberFormats.CURRENCY_EUR,
    NumberFormats.CURRENCY_USD,
    NumberFormats.CURRENCY_GBP,
    formatOptions.short_date,
    formatOptions.long_date,
  ] as string[]);

  // The initial values are taken once, as upstream's useState initializers
  // svelte-ignore state_referenced_locally
  const initialStyle = style;
  function initialIncludesOf(): StyleIncludes | null {
    if (!initialName) {
      return null;
    }
    try {
      return model.getNamedStyleIncludes(initialName);
    } catch {
      return null;
    }
  }
  const initialIncludes = initialIncludesOf();
  const firstSide =
    initialStyle.border.top ??
    initialStyle.border.right ??
    initialStyle.border.bottom ??
    initialStyle.border.left;

  let name = $state(getDefaultName());
  let nameError = $state("");
  // svelte-ignore state_referenced_locally
  let formatStyle: FormatStyle = $state(initFormatStyle(model, initialStyle));
  let numFmt: string = $state(initialStyle.num_fmt);
  // svelte-ignore state_referenced_locally
  let customFmt = $state(knownFormats.includes(initialStyle.num_fmt) ? "" : initialStyle.num_fmt);
  let customFmtTouched = $state(false);
  let includeFormat = $state(initialIncludes?.number_format ?? true);
  let includeFont = $state(initialIncludes?.font ?? true);
  let includeFill = $state(initialIncludes?.fill ?? true);
  let includeAlignment = $state(initialIncludes?.alignment ?? false);
  let horizontalAlign: HorizontalAlignment = $state(
    initialStyle.alignment?.horizontal ?? "general",
  );
  let verticalAlign: VerticalAlignment = $state(initialStyle.alignment?.vertical ?? "bottom");
  let includeBorder = $state(initialIncludes?.border ?? false);
  let borderSides: BorderSides = $state({
    top: !!initialStyle.border.top?.style,
    right: !!initialStyle.border.right?.style,
    bottom: !!initialStyle.border.bottom?.style,
    left: !!initialStyle.border.left?.style,
  });
  let borderLineStyle: BorderStyle = $state(
    (firstSide?.style as BorderStyle) || BorderStyle.Thin,
  );
  let borderColor: Color = $state(firstSide?.color ?? "");
  let fontColorOpen = $state(false);
  let fillColorOpen = $state(false);
  let borderColorOpen = $state(false);
  let fontColorButton: HTMLButtonElement | null = $state(null);
  let fillColorButton: HTMLButtonElement | null = $state(null);
  let borderColorButton: HTMLButtonElement | null = $state(null);
  let customFmtInput: HTMLInputElement | null = $state(null);

  const allBorderSidesOn = $derived(
    borderSides.top && borderSides.right && borderSides.bottom && borderSides.left,
  );
  const noBorderSidesOn = $derived(
    !borderSides.top && !borderSides.right && !borderSides.bottom && !borderSides.left,
  );

  function setAllBorderSides(on: boolean): void {
    borderSides = { top: on, right: on, bottom: on, left: on };
  }

  const isCustom = $derived(!knownFormats.includes(numFmt));
  // svelte-ignore state_referenced_locally
  let wasCustom = isCustom;

  // Focus the custom format field when "Custom" is picked
  $effect(() => {
    const custom = isCustom;
    const input = customFmtInput;
    if (custom && !wasCustom && input) {
      input.focus();
    }
    if (!custom || input) {
      wasCustom = custom;
    }
  });

  const formatSelectOptions = $derived([
    { value: NumberFormats.AUTO, label: t("toolbar.format_menu.auto") },
    { value: formatOptions.number_fmt, label: t("toolbar.format_menu.number") },
    { value: NumberFormats.PERCENTAGE, label: t("toolbar.format_menu.percentage") },
    { value: NumberFormats.CURRENCY_EUR, label: t("toolbar.format_menu.currency_eur") },
    { value: NumberFormats.CURRENCY_USD, label: t("toolbar.format_menu.currency_usd") },
    { value: NumberFormats.CURRENCY_GBP, label: t("toolbar.format_menu.currency_gbp") },
    { value: formatOptions.short_date, label: t("toolbar.format_menu.date_short") },
    { value: formatOptions.long_date, label: t("toolbar.format_menu.date_long") },
    { value: CUSTOM_VALUE, label: t("toolbar.format_menu.custom") },
  ]);

  function handleFormatChange(value: string): void {
    if (value === CUSTOM_VALUE) {
      customFmtTouched = false;
      numFmt = customFmt || "";
    } else {
      numFmt = value;
    }
  }

  const selectValue = $derived(isCustom ? CUSTOM_VALUE : numFmt);
  const customFmtError = $derived(includeFormat && isCustom && !customFmt.trim());
  const hasError = $derived(!!nameError || !name.trim() || customFmtError);

  const previewStyle = $derived(
    styleText(
      formatStyleToPreview(formatStyle, currentTheme, {
        includeFont,
        includeFill,
        includeAlignment,
        includeBorder,
        horizontalAlign,
        verticalAlign,
        borderSides,
        borderLineStyle,
        borderColor,
      }),
    ),
  );

  const lineStylePreviewClass = $derived(
    LINE_STYLE_OPTIONS.find((option) => option.value === borderLineStyle)
      ?.previewClassName ?? "thin",
  );

  function handleSave(): void {
    if (hasError) {
      customFmtTouched = true;
      return;
    }
    const makeBorderItem = (enabled: boolean) =>
      enabled ? { style: borderLineStyle, color: borderColor || undefined } : undefined;
    const newStyle = {
      ...style,
      num_fmt: numFmt,
      alignment: {
        horizontal: horizontalAlign,
        vertical: verticalAlign,
        wrap_text: style.alignment?.wrap_text ?? false,
      },
      border: {
        ...style.border,
        top: makeBorderItem(borderSides.top),
        right: makeBorderItem(borderSides.right),
        bottom: makeBorderItem(borderSides.bottom),
        left: makeBorderItem(borderSides.left),
      },
      fill: {
        ...style.fill,
        color: formatStyle.fillColor || undefined,
      },
      font: {
        ...style.font,
        b: formatStyle.bold || false,
        i: formatStyle.italic || false,
        u: formatStyle.underline || false,
        strike: formatStyle.strike || false,
        color: formatStyle.fontColor || undefined,
      },
    };
    // Protection is not editable in this panel, so it is always carried
    // over from the base style.
    const error = onSave({
      name: name.trim(),
      style: newStyle,
      includes: {
        number_format: includeFormat,
        font: includeFont,
        fill: includeFill,
        border: includeBorder,
        alignment: includeAlignment,
        protection: true,
      },
    });
    if (error.nameError) {
      nameError = error.nameError;
    } else {
      onClose();
    }
  }

  function handleKeyDown(event: KeyboardEvent): void {
    event.stopPropagation();
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      handleSave();
    }
  }

  function focusOnMount(element: HTMLElement): void {
    element.querySelector<HTMLInputElement>("input")?.focus();
  }
</script>

{#snippet boldIcon()}<Bold />{/snippet}
{#snippet italicIcon()}<Italic />{/snippet}
{#snippet underlineIcon()}<Underline />{/snippet}
{#snippet strikeIcon()}<Strikethrough />{/snippet}
{#snippet alignLeftIcon()}<AlignLeft />{/snippet}
{#snippet alignCenterIcon()}<AlignCenter />{/snippet}
{#snippet alignRightIcon()}<AlignRight />{/snippet}
{#snippet alignTopIcon()}<ArrowUpToLine />{/snippet}
{#snippet alignMiddleIcon()}<ArrowMiddleFromLine />{/snippet}
{#snippet alignBottomIcon()}<ArrowDownToLine />{/snippet}
{#snippet borderOuterIcon()}<BorderOuterIcon />{/snippet}
{#snippet borderNoneIcon()}<BorderNoneIcon />{/snippet}
{#snippet borderTopIcon()}<BorderTopIcon />{/snippet}
{#snippet borderRightIcon()}<BorderRightIcon />{/snippet}
{#snippet borderBottomIcon()}<BorderBottomIcon />{/snippet}
{#snippet borderLeftIcon()}<BorderLeftIcon />{/snippet}

<!-- the container captures Cmd/Ctrl+Enter bubbling from its fields -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="ic-edit-style-container" onkeydown={handleKeyDown}>
  <div class="ic-edit-style-content-area">
    <div class="ic-edit-style-header-box">
      <div class="ic-edit-style-preview" style={previewStyle}>
        {getPreviewText(includeFormat ? numFmt : NumberFormats.AUTO, formatOptions, t)}
      </div>
      <span class="ic-edit-style-header-box-text">
        {name.trim() || t("named_styles.new_style")}
      </span>
    </div>
    <div class="ic-edit-style-styled-box" {@attach focusOnMount}>
      <Input
        type="text"
        label={t("named_styles.name_label")}
        placeholder={t("named_styles.name_placeholder")}
        value={name}
        error={!!nameError}
        helperText={nameError}
        oninput={(event) => {
          name = event.currentTarget.value;
          nameError = "";
        }}
        onkeydown={handleKeyDown}
      />
    </div>

    <div class="ic-edit-style-styled-box ic-edit-style-section-header">
      <div class="ic-edit-style-section-title">{t("named_styles.style_properties")}</div>
    </div>

    <div class="ic-edit-style-styled-box ic-edit-style-format-group">
      <Switch
        checked={includeFormat}
        onChange={(checked) => (includeFormat = checked)}
        label={t("named_styles.number_label")}
      />
      {#if includeFormat}
        <Select
          label={t("named_styles.format_label")}
          value={selectValue}
          options={formatSelectOptions}
          onChange={handleFormatChange}
        />
        {#if isCustom}
          <Input
            bind:ref={customFmtInput}
            type="text"
            placeholder={t("named_styles.custom_format_placeholder")}
            value={customFmt}
            error={customFmtTouched && customFmtError}
            helperText={customFmtTouched && customFmtError
              ? t("named_styles.custom_format_required")
              : ""}
            oninput={(event) => {
              customFmt = event.currentTarget.value;
              numFmt = event.currentTarget.value;
            }}
            onblur={() => (customFmtTouched = true)}
            onkeydown={handleKeyDown}
          />
        {/if}
      {/if}
    </div>
    <div class="ic-edit-style-styled-box ic-edit-style-format-group">
      <Switch
        checked={includeFont}
        onChange={(checked) => {
          includeFont = checked;
          if (!checked) {
            fontColorOpen = false;
          }
        }}
        label={t("named_styles.font_label")}
      />
      {#if includeFont}
        <div class="ic-edit-style-subrow">
          <span class="ic-edit-style-sublabel">{t("named_styles.font_style_label")}</span>
          <div class="ic-edit-style-controls-row">
            <ToggleButton
              multiple
              size="md"
              value={FONT_ATTRS.filter((attr) => formatStyle[attr])}
              onChange={(attrs: FontAttribute[]) => {
                formatStyle = {
                  ...formatStyle,
                  bold: attrs.includes("bold"),
                  italic: attrs.includes("italic"),
                  underline: attrs.includes("underline"),
                  strike: attrs.includes("strike"),
                };
              }}
              options={[
                { value: "bold", icon: boldIcon, "aria-label": t("toolbar.bold") },
                { value: "italic", icon: italicIcon, "aria-label": t("toolbar.italic") },
                { value: "underline", icon: underlineIcon, "aria-label": t("toolbar.underline") },
                { value: "strike", icon: strikeIcon, "aria-label": t("toolbar.strike_through") },
              ]}
            />
            <SwatchButton
              bind:ref={fontColorButton}
              color={resolveColorToHex(formatStyle.fontColor, currentTheme) ||
                "var(--palette-sheet-default-text-color)"}
              aria-label={t("toolbar.font_color")}
              onclick={() => (fontColorOpen = true)}
            />
            <ColorPicker
              color={formatStyle.fontColor}
              defaultColor=""
              defaultSwatchColor="var(--palette-sheet-default-text-color)"
              title={t("color_picker.default")}
              onChange={(color) => {
                formatStyle = { ...formatStyle, fontColor: color };
                fontColorOpen = false;
              }}
              onClose={() => (fontColorOpen = false)}
              anchorEl={() => fontColorButton}
              open={fontColorOpen}
              theme={currentTheme}
            />
          </div>
        </div>
      {/if}
    </div>
    <div class="ic-edit-style-styled-box ic-edit-style-format-group">
      <Switch
        checked={includeFill}
        onChange={(checked) => {
          includeFill = checked;
          if (!checked) {
            fillColorOpen = false;
          }
        }}
        label={t("named_styles.fill_label")}
      />
      {#if includeFill}
        <div class="ic-edit-style-subrow">
          <span class="ic-edit-style-sublabel">
            {t("named_styles.background_color_label")}
          </span>
          <SwatchButton
            bind:ref={fillColorButton}
            color={resolveColorToHex(formatStyle.fillColor, currentTheme) || "transparent"}
            aria-label={t("toolbar.fill_color")}
            onclick={() => (fillColorOpen = true)}
          />
          <ColorPicker
            color={formatStyle.fillColor || "#FFFFFF"}
            defaultColor=""
            title={t("color_picker.default")}
            onChange={(color) => {
              formatStyle = { ...formatStyle, fillColor: color };
              fillColorOpen = false;
            }}
            onClose={() => (fillColorOpen = false)}
            anchorEl={() => fillColorButton}
            open={fillColorOpen}
            theme={currentTheme}
          />
        </div>
      {/if}
    </div>
    <div class="ic-edit-style-styled-box ic-edit-style-format-group">
      <Switch
        checked={includeAlignment}
        onChange={(checked) => (includeAlignment = checked)}
        label={t("named_styles.alignment_label")}
      />
      {#if includeAlignment}
        <div class="ic-edit-style-subrow">
          <span class="ic-edit-style-sublabel">
            {t("named_styles.horizontal_align_label")}
          </span>
          <!-- "general" is the unpressed state: clicking the pressed option goes back to it -->
          <ToggleButton
            size="md"
            value={horizontalAlign}
            onChange={(value: HorizontalAlignment) => {
              horizontalAlign = horizontalAlign === value ? "general" : value;
            }}
            options={[
              { value: "left", icon: alignLeftIcon, "aria-label": t("toolbar.align_left") },
              { value: "center", icon: alignCenterIcon, "aria-label": t("toolbar.align_center") },
              { value: "right", icon: alignRightIcon, "aria-label": t("toolbar.align_right") },
            ]}
          />
        </div>
        <div class="ic-edit-style-subrow">
          <span class="ic-edit-style-sublabel">
            {t("named_styles.vertical_align_label")}
          </span>
          <ToggleButton
            size="md"
            value={verticalAlign}
            onChange={(value: VerticalAlignment) => (verticalAlign = value)}
            options={[
              { value: "top", icon: alignTopIcon, "aria-label": t("toolbar.vertical_align_top") },
              {
                value: "center",
                icon: alignMiddleIcon,
                "aria-label": t("toolbar.vertical_align_middle"),
              },
              {
                value: "bottom",
                icon: alignBottomIcon,
                "aria-label": t("toolbar.vertical_align_bottom"),
              },
            ]}
          />
        </div>
      {/if}
    </div>
    <div class="ic-edit-style-styled-box ic-edit-style-format-group">
      <Switch
        checked={includeBorder}
        onChange={(checked) => {
          includeBorder = checked;
          if (!checked) {
            borderColorOpen = false;
          }
        }}
        label={t("named_styles.border_label")}
      />
      {#if includeBorder}
        <div class="ic-edit-style-subrow">
          <span class="ic-edit-style-sublabel">{t("named_styles.border_label")}</span>
          <div class="ic-edit-style-controls-row">
            <!-- "mixed" matches no option, so both show unpressed -->
            <ToggleButton
              size="md"
              value={allBorderSidesOn ? "all" : noBorderSidesOn ? "none" : "mixed"}
              onChange={(value: string) => setAllBorderSides(value === "all" && !allBorderSidesOn)}
              options={[
                { value: "all", icon: borderOuterIcon, "aria-label": t("toolbar.borders.all") },
                { value: "none", icon: borderNoneIcon, "aria-label": t("toolbar.borders.clear") },
              ]}
            />
            <ToggleButton
              multiple
              size="md"
              value={BORDER_SIDES.filter((side) => borderSides[side])}
              onChange={(sides: BorderSide[]) => {
                borderSides = {
                  top: sides.includes("top"),
                  right: sides.includes("right"),
                  bottom: sides.includes("bottom"),
                  left: sides.includes("left"),
                };
              }}
              options={[
                { value: "top", icon: borderTopIcon, "aria-label": t("toolbar.borders.top") },
                { value: "right", icon: borderRightIcon, "aria-label": t("toolbar.borders.right") },
                {
                  value: "bottom",
                  icon: borderBottomIcon,
                  "aria-label": t("toolbar.borders.bottom"),
                },
                { value: "left", icon: borderLeftIcon, "aria-label": t("toolbar.borders.left") },
              ]}
            />
          </div>
        </div>
        <div class="ic-edit-style-subrow">
          <span class="ic-edit-style-sublabel">{t("named_styles.line_style_label")}</span>
          <div class="ic-edit-style-controls-row">
            <Menu>
              {#snippet trigger(attributes)}
                <div class="input ic-edit-style-line-style-wrapper">
                  <button
                    {...attributes}
                    type="button"
                    class="ic-edit-style-line-style-trigger"
                    aria-label={t("toolbar.borders.style")}
                  >
                    <span
                      class={["ic-line-preview", lineStylePreviewClass]}
                      style:color={resolveColorToHex(borderColor, currentTheme)}
                    ></span>
                  </button>
                </div>
              {/snippet}
              {#each LINE_STYLE_OPTIONS as option (option.value)}
                <MenuItem
                  checked={borderLineStyle === option.value}
                  onClick={() => (borderLineStyle = option.value)}
                >
                  <span
                    class={["ic-line-preview", option.previewClassName]}
                    style:color={resolveColorToHex(borderColor, currentTheme)}
                    aria-label={option.value}
                  ></span>
                </MenuItem>
              {/each}
            </Menu>
            <SwatchButton
              bind:ref={borderColorButton}
              color={resolveColorToHex(borderColor, currentTheme) ||
                "var(--palette-sheet-default-text-color)"}
              aria-label={t("toolbar.borders.color")}
              onclick={() => (borderColorOpen = true)}
            />
            <ColorPicker
              color={borderColor}
              defaultColor=""
              defaultSwatchColor="var(--palette-sheet-default-text-color)"
              title={t("color_picker.default")}
              onChange={(color) => {
                borderColor = color;
                borderColorOpen = false;
              }}
              onClose={() => (borderColorOpen = false)}
              anchorEl={() => borderColorButton}
              open={borderColorOpen}
              theme={currentTheme}
            />
          </div>
        </div>
      {/if}
    </div>
  </div>
  <div class="ic-edit-style-footer">
    <Button variant="secondary" onclick={onClose}>{t("named_styles.cancel")}</Button>
    <Button disabled={hasError} onclick={handleSave}>
      {#snippet startIcon()}<Check />{/snippet}
      {t("named_styles.apply")}
    </Button>
  </div>
</div>

<style>
  /* Port of upstream NamedStyles/edit-named-style.css; the swatches are
     SwatchButton's */
  .ic-edit-style-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ic-edit-style-content-area {
    flex: 1;
    overflow: auto;
  }

  .ic-edit-style-header-box {
    font-size: 14px;
    font-family: var(--typography-font-family);
    gap: 8px;
    padding: 24px 12px;
    color: var(--palette-common-black);
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    border-bottom: 1px solid var(--palette-grey-200);
  }

  .ic-edit-style-header-box-text {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-weight: 600;
  }

  .ic-edit-style-styled-box {
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
    padding: 16px 12px;
    border-bottom: 1px solid var(--palette-grey-200);
  }

  .ic-edit-style-styled-box:last-child {
    border-bottom: none;
  }

  .ic-edit-style-section-header {
    gap: 4px;
    padding-bottom: 0;
    border-bottom: none;
  }

  .ic-edit-style-section-title {
    font-size: 14px;
    font-weight: 600;
    font-family: var(--typography-font-family);
    margin: 0;
    color: var(--palette-common-black);
  }

  .ic-edit-style-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px;
    border-top: 1px solid var(--palette-grey-300);
  }

  .ic-edit-style-subrow {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
  }

  .ic-edit-style-sublabel {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-common-black);
  }

  .ic-edit-style-controls-row {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .ic-edit-style-line-style-wrapper {
    flex: none;
    box-sizing: border-box;
    width: 88px;
    height: 32px;
    padding: 2px;
    display: flex;
  }

  .ic-edit-style-line-style-trigger {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: none;
    border-radius: 3px;
    cursor: pointer;
  }

  .ic-edit-style-format-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .ic-edit-style-format-group > :global(.ic-switch) {
    display: flex;
    justify-content: space-between;
  }

  .ic-edit-style-format-group :global(.ic-switch-label) {
    font-weight: 800;
  }

  .ic-edit-style-preview {
    box-sizing: border-box;
    width: 40px;
    height: 32px;
    padding: 4px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
    font-family: var(--typography-font-family);
    font-weight: 400;
  }
</style>
