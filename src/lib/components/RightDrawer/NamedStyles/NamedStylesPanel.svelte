<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/NamedStyles/NamedStylesPanel.tsx:
  the cell styles as tiles (the workbook's own ones, then the built-in ones
  in their categories); clicking one applies it to the selection. New
  styles start from "Normal"; the workbook's own can be managed (edited,
  deleted).
-->
<script lang="ts" module>
  import type { NamedStyle } from "@ironcalc/wasm";

  type CategoryType = "grid" | "themed";

  interface Category {
    labelKey: string;
    type: CategoryType;
    names: string[];
  }

  const BUILTIN_CATEGORIES: Category[] = [
    {
      labelKey: "named_styles.category_good_bad_neutral",
      type: "grid",
      names: ["normal", "bad", "good", "neutral"],
    },
    {
      labelKey: "named_styles.category_data_and_model",
      type: "grid",
      names: [
        "calculation",
        "check cell",
        "explanatory text",
        "input",
        "linked cell",
        "note",
        "output",
        "warning text",
      ],
    },
    {
      labelKey: "named_styles.category_titles_and_headings",
      type: "grid",
      names: ["heading 1", "heading 2", "heading 3", "heading 4", "title", "total"],
    },
    {
      labelKey: "named_styles.category_themed_cell_styles",
      type: "themed",
      // Each group of 4 = one accent (20% → 40% → 60% → 100%)
      names: [
        "20% - accent1",
        "40% - accent1",
        "60% - accent1",
        "80% - accent1",
        "accent1",
        "20% - accent2",
        "40% - accent2",
        "60% - accent2",
        "80% - accent2",
        "accent2",
        "20% - accent3",
        "40% - accent3",
        "60% - accent3",
        "80% - accent3",
        "accent3",
        "20% - accent4",
        "40% - accent4",
        "60% - accent4",
        "80% - accent4",
        "accent4",
        "20% - accent5",
        "40% - accent5",
        "60% - accent5",
        "80% - accent5",
        "accent5",
        "20% - accent6",
        "40% - accent6",
        "60% - accent6",
        "80% - accent6",
        "accent6",
      ],
    },
    {
      labelKey: "named_styles.category_number_format",
      type: "grid",
      names: ["comma", "comma [0]", "currency", "currency [0]", "percent"],
    },
  ];

  interface StyleGroup {
    label: string;
    type: CategoryType;
    styles: NamedStyle[];
  }

  function getBuiltinGroups(
    builtinStyles: NamedStyle[],
    t: (key: string) => string,
  ): StyleGroup[] {
    const byLowerName = new Map(builtinStyles.map((s) => [s.name.toLowerCase(), s]));
    return BUILTIN_CATEGORIES.map((cat) => ({
      label: t(cat.labelKey),
      type: cat.type,
      styles: cat.names
        .map((n) => byLowerName.get(n))
        .filter((s): s is NamedStyle => s !== undefined),
    })).filter((g) => g.styles.length > 0);
  }

  const ACCENT_LABEL_KEYS = [
    "named_styles.accent_1",
    "named_styles.accent_2",
    "named_styles.accent_3",
    "named_styles.accent_4",
    "named_styles.accent_5",
    "named_styles.accent_6",
  ];

  type PanelView =
    | { mode: "list" }
    | { mode: "create" }
    | { mode: "manage" }
    | { mode: "editing"; style: NamedStyle };
</script>

<script lang="ts">
  import type { FmtSettings, IronCalcTheme, Model } from "@ironcalc/wasm";
  import Plus from "@lucide/svelte/icons/plus";
  import Settings2 from "@lucide/svelte/icons/settings-2";
  import { t } from "../../../i18n";
  import Button from "../../Button/Button.svelte";
  import IconButton from "../../Button/IconButton.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";
  import DrawerHeader from "../DrawerHeader.svelte";
  import EditNamedStyle, {
    type NamedStyleSavePayload,
    type SaveError,
  } from "./EditNamedStyle.svelte";
  import ManageCustomStyles from "./ManageCustomStyles.svelte";
  import { getTileStyle, styleText } from "./namedStylesUtils";

  interface Props {
    model: Model;
    customStyles: NamedStyle[];
    builtinStyles: NamedStyle[];
    formatOptions: FmtSettings;
    currentTheme: IronCalcTheme;
    onApplyNamedStyle: (name: string) => void;
    onAddNamedStyle: (payload: NamedStyleSavePayload) => SaveError;
    onUpdateNamedStyle: (originalName: string, payload: NamedStyleSavePayload) => SaveError;
    onDeleteNamedStyle: (name: string) => void;
    onClose: () => void;
  }

  let {
    model,
    customStyles,
    builtinStyles,
    formatOptions,
    currentTheme,
    onApplyNamedStyle,
    onAddNamedStyle,
    onUpdateNamedStyle,
    onDeleteNamedStyle,
    onClose,
  }: Props = $props();

  let view: PanelView = $state({ mode: "list" });

  const normalStyle = $derived(builtinStyles.find((s) => s.name.toLowerCase() === "normal"));
  const builtinGroups = $derived(getBuiltinGroups(builtinStyles, t));
  const allStyleNames = $derived([
    ...customStyles.map((s) => s.name),
    ...builtinStyles.map((s) => s.name),
  ]);

  function backToList(): void {
    view = { mode: "list" };
  }
</script>

{#snippet tile({ name, style }: NamedStyle, label?: string)}
  <button
    type="button"
    class="ic-named-styles-tile"
    style={styleText(getTileStyle(model, style))}
    onclick={() => onApplyNamedStyle(name)}
  >
    <span class="ic-named-styles-tile-text">{label ?? name}</span>
  </button>
{/snippet}

<div class="ic-named-styles-container">
  {#if view.mode === "create" && normalStyle}
    <DrawerHeader
      title={t("named_styles.add_new_style")}
      {onClose}
      onBack={backToList}
      backLabel={t("named_styles.back_to_list")}
    />
    <div class="ic-named-styles-content">
      <EditNamedStyle
        {model}
        name=""
        style={normalStyle.style}
        {formatOptions}
        existingStyleNames={allStyleNames}
        {currentTheme}
        onSave={(payload) => {
          if (allStyleNames.some((n) => n.toLowerCase() === payload.name.toLowerCase())) {
            return { nameError: t("named_styles.name_already_exists") };
          }
          return onAddNamedStyle(payload);
        }}
        onClose={backToList}
      />
    </div>
  {:else if view.mode === "manage"}
    <DrawerHeader
      title={t("named_styles.manage_styles")}
      {onClose}
      onBack={backToList}
      backLabel={t("named_styles.back_to_list")}
    />
    <div class="ic-named-styles-content">
      <ManageCustomStyles
        {model}
        {customStyles}
        {formatOptions}
        onEdit={(style) => (view = { mode: "editing", style })}
        onDelete={(style) => onDeleteNamedStyle(style.name)}
      />
    </div>
    <div class="ic-named-styles-footer">
      <Button onclick={() => (view = { mode: "create" })}>
        {#snippet startIcon()}<Plus />{/snippet}
        {t("named_styles.add_new_style")}
      </Button>
    </div>
  {:else if view.mode === "editing"}
    {@const editingStyle = view.style}
    {@const otherStyleNames = allStyleNames.filter(
      (n) => n.toLowerCase() !== editingStyle.name.toLowerCase(),
    )}
    <DrawerHeader
      title={t("named_styles.update_style")}
      {onClose}
      onBack={() => (view = { mode: "manage" })}
      backLabel={t("named_styles.back_to_list")}
    />
    <div class="ic-named-styles-content">
      <EditNamedStyle
        {model}
        name={editingStyle.name}
        style={editingStyle.style}
        {formatOptions}
        existingStyleNames={allStyleNames}
        {currentTheme}
        onSave={(payload) => {
          if (otherStyleNames.some((n) => n.toLowerCase() === payload.name.toLowerCase())) {
            return { nameError: t("named_styles.name_already_exists") };
          }
          return onUpdateNamedStyle(editingStyle.name, payload);
        }}
        onClose={() => (view = { mode: "manage" })}
      />
    </div>
  {:else}
    <DrawerHeader title={t("named_styles.panel_title")} {onClose} />
    <div class="ic-named-styles-content">
      {#if customStyles.length > 0}
        <div class="ic-named-styles-section">
          <div class="ic-named-styles-section-title" style:height="17px">
            {t("named_styles.section_custom")}
            <div class="ic-named-styles-section-title-actions">
              <Tooltip title={t("named_styles.manage_styles")}>
                <IconButton
                  aria-label={t("named_styles.manage_styles")}
                  onclick={() => (view = { mode: "manage" })}
                >
                  {#snippet icon()}<Settings2 size={14} />{/snippet}
                </IconButton>
              </Tooltip>
            </div>
          </div>
          <div class="ic-named-styles-grid">
            {#each customStyles as s (s.name)}{@render tile(s)}{/each}
          </div>
        </div>
      {/if}
      <div class="ic-named-styles-section">
        <div class="ic-named-styles-section-title">{t("named_styles.section_theme")}</div>
        {#each builtinGroups as group (group.label)}
          <div class="ic-named-styles-category">
            <div class="ic-named-styles-category-label">{group.label}</div>
            {#if group.type === "themed"}
              <div class="ic-named-styles-rows">
                {#each ACCENT_LABEL_KEYS as accentLabelKey, i (accentLabelKey)}
                  {@const row = group.styles.filter((s) =>
                    s.name.toLowerCase().endsWith(`accent${i + 1}`),
                  )}
                  {#if row.length > 0}
                    <div class="ic-named-styles-row">
                      {#each row as s (s.name)}
                        {@const pct = s.name.match(/^(\d+%)/)}
                        {@render tile(s, pct ? pct[1] : t(accentLabelKey))}
                      {/each}
                    </div>
                  {/if}
                {/each}
              </div>
            {:else}
              <div class="ic-named-styles-grid">
                {#each group.styles as s (s.name)}{@render tile(s)}{/each}
              </div>
            {/if}
          </div>
        {/each}
      </div>
    </div>
    <div class="ic-named-styles-footer">
      <Button onclick={() => (view = { mode: "create" })}>
        {#snippet startIcon()}<Plus />{/snippet}
        {t("named_styles.add_new_style")}
      </Button>
    </div>
  {/if}
</div>

<style>
  /* Port of upstream NamedStyles/named-styles.css; the headers are
     DrawerHeader's and the manage list ManageCustomStyles' */
  .ic-named-styles-container {
    height: 100%;
    display: flex;
    flex-direction: column;
    font-family: var(--typography-font-family);
  }

  .ic-named-styles-content {
    flex: 1;
    overflow-y: auto;
    font-size: var(--typography-font-size);
  }

  .ic-named-styles-footer {
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
    border-top: 1px solid var(--palette-grey-300);
  }

  .ic-named-styles-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 12px;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-named-styles-section:last-child {
    border-bottom: none;
  }

  .ic-named-styles-section-title {
    font-size: 14px;
    font-weight: 600;
    font-family: var(--typography-font-family);
    margin: 0;
    color: var(--palette-common-black);
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .ic-named-styles-section-title-actions {
    display: flex;
    align-items: center;
    margin-left: auto;
  }

  .ic-named-styles-category {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .ic-named-styles-category-label {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    font-weight: 500;
    color: var(--palette-common-black);
  }

  .ic-named-styles-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
  }

  .ic-named-styles-rows {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ic-named-styles-row {
    display: flex;
    gap: 4px;
  }

  .ic-named-styles-tile {
    box-sizing: border-box;
    height: 32px;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: flex-start;
    border: none;
    cursor: pointer;
    font-size: var(--typography-font-size);
    padding: 0 6px;
    background-color: var(--palette-common-white, #fff);
    color: var(--palette-common-black);
    font-family: inherit;
  }

  .ic-named-styles-grid .ic-named-styles-tile {
    box-shadow: 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
  }

  .ic-named-styles-tile-text {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .ic-named-styles-row .ic-named-styles-tile {
    flex: 1;
    border-radius: 0;
  }

  .ic-named-styles-tile:hover {
    outline: 1px solid var(--palette-common-black);
    outline-offset: 1px;
    z-index: 1;
    position: relative;
  }

  .ic-named-styles-tile:focus-visible {
    outline: 1px solid var(--palette-common-black);
    outline-offset: 1px;
    box-shadow: 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 40%, transparent);
    z-index: 1;
    position: relative;
  }
</style>
