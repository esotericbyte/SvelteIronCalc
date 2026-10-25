<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/ConditionalFormatting/ConditionalFormatting.tsx:
  the conditional formatting rules of the selected sheet in priority
  order, searchable and filtered to the sheet or to the selection. Clicking
  a rule selects its range; each can be moved up or down (the two rows
  slide past each other first), edited, duplicated or deleted.
-->
<script lang="ts" module>
  // Reorder animation, defined in the styles below.
  const MOVING_CLASS = "ic-cf-list-item--moving";
  // Svelte scopes keyframe names, so the animation is matched by prefix
  const MOVING_ANIMATION = "ic-cf-slide";
  // Keep in sync with the animation duration in the CSS. Only used as a safety
  // net in case the animation events never arrive.
  const MOVING_DURATION_MS = 200;
</script>

<script lang="ts">
  import type { IronCalcTheme, Model } from "@ironcalc/wasm";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import Copy from "@lucide/svelte/icons/copy";
  import PackageOpen from "@lucide/svelte/icons/package-open";
  import PencilLine from "@lucide/svelte/icons/pencil-line";
  import Plus from "@lucide/svelte/icons/plus";
  import Search from "@lucide/svelte/icons/search";
  import SearchX from "@lucide/svelte/icons/search-x";
  import Trash2 from "@lucide/svelte/icons/trash-2";
  import { flushSync } from "svelte";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import {
    isRangeInRanges,
    isValidRanges,
    parseRangeInSheet,
    parseRect,
  } from "../../../upstream/components/Editor/util";
  import Button from "../../Button/Button.svelte";
  import IconButton from "../../Button/IconButton.svelte";
  import { iconSpecFor } from "../../IconPicker/iconSpec";
  import Input from "../../Input/Input.svelte";
  import Select from "../../Select/Select.svelte";
  import Tooltip from "../../Tooltip/Tooltip.svelte";
  import DrawerHeader from "../DrawerHeader.svelte";
  import {
    cfRuleToRuleData,
    dxfToFormatStyle,
    ruleDataToCfRule,
    ruleTypeUsesDxf,
  } from "./cfRuleMapping";
  import { steppedGradient } from "./colorScale";
  import DataBarMiniChart from "./DataBarMiniChart.svelte";
  import EditRule from "./EditRule.svelte";
  import { ALL_PRESETS, type IconPreviewInfo } from "./iconSets";
  import type { Rule, RuleData } from "./ruleData";
  import { getRuleDescription } from "./ruleDescription";

  interface Props {
    onClose: () => void;
    getSelectedArea: () => string;
    onUpdate: () => void;
    model: Model;
    /** Bumped by the workbook whenever the model changed outside Svelte's view. */
    version: number;
    currentTheme: IronCalcTheme;
  }

  let { onClose, getSelectedArea, onUpdate, model, version, currentTheme }: Props = $props();

  let editingRule: Rule | null = $state(null);
  let isCreatingNew = $state(false);
  let searchQuery = $state("");
  let filterOption = $state("sheet");
  let listBody: HTMLDivElement | null = $state(null);
  // True while a reorder animation is running; further clicks are ignored
  // until the pending change has been committed.
  let isReordering = false;

  // The rules are those of the sheet selected when the drawer rendered
  const sheet = $derived.by(() => {
    void version;
    return model.getSelectedView().sheet;
  });

  function getSanitizedSelectedArea(): string {
    const selectedArea = getSelectedArea();
    // convert Sheet1!$A$1:$B$2 (or 'My Sheet'!$A$1:$B$2) to A1:B2
    const withoutSheet = selectedArea.split("!").pop() ?? selectedArea;
    return withoutSheet.replace(/\$/g, "");
  }

  const filterOptions = [
    { value: "sheet", label: t("conditional_formatting.filter_this_sheet") },
    { value: "selection", label: t("conditional_formatting.filter_selection") },
  ];

  function resolveRef(val: string): string {
    if (!val.trim()) {
      return val;
    }
    const parsed = parseRangeInSheet(model, val);
    if (parsed) {
      const [sheetIdx, row, col] = parsed;
      const resolved = model.getFormattedCellValue(sheetIdx, row, col);
      return resolved !== "" ? resolved : '""';
    }
    return val;
  }

  function loadRules(): Rule[] {
    const list = model.getConditionalFormattingList(sheet);
    return list.flatMap((cf) => {
      // List is priority-sorted; cf.index is the stable storage index.
      const modelIndex = cf.index;
      const partial = cfRuleToRuleData(cf);
      if (!partial) {
        return [];
      }
      const ruleType = partial.ruleType ?? "cell_value";
      const dxf = ruleTypeUsesDxf(ruleType)
        ? model.getDxfForConditionalFormatting(sheet, modelIndex)
        : null;
      const formatStyle = dxfToFormatStyle(dxf);
      return [
        {
          ...partial,
          id: `${modelIndex}`,
          applyTo: cf.range,
          ruleType,
          ruleOperator: partial.ruleOperator ?? "",
          ruleValue: partial.ruleValue ?? "",
          ruleValue2: partial.ruleValue2 ?? "",
          formatStyle,
        },
      ];
    });
  }

  const rules = $derived.by(() => {
    void version;
    return loadRules();
  });

  function selectRuleRange(rule: Rule): void {
    const firstRange = rule.applyTo.split(/\s+/)[0];
    const range = parseRect(firstRange);
    if (range) {
      const { minCol: columnStart, maxCol: columnEnd, minRow: rowStart, maxRow: rowEnd } = range;
      model.setSelectedCell(rowStart, columnStart);
      model.setSelectedRange(rowStart, columnStart, rowEnd, columnEnd);
    }
    onUpdate();
  }

  function handleCancel(): void {
    isCreatingNew = false;
    editingRule = null;
  }

  function handleSave(raw: RuleData): void {
    // the engine reads plain objects, not Svelte's state proxies
    const data = $state.snapshot(raw) as RuleData;
    const cfRule = ruleDataToCfRule(data);
    if (!cfRule) {
      return;
    }
    const applyTo = data.applyTo;
    if (!isValidRanges(applyTo)) {
      return;
    }
    if (editingRule) {
      model.updateConditionalFormatting(sheet, parseInt(editingRule.id, 10), applyTo, cfRule);
      editingRule = null;
    } else {
      model.addConditionalFormatting(sheet, applyTo, cfRule);
      isCreatingNew = false;
    }
    onUpdate();
  }

  function handleDelete(id: string): void {
    model.deleteConditionalFormatting(sheet, parseInt(id, 10));
    onUpdate();
  }

  function handleDuplicate(rule: Rule): void {
    const cfRule = ruleDataToCfRule($state.snapshot(rule) as Rule);
    if (!cfRule) {
      return;
    }
    model.addConditionalFormatting(sheet, rule.applyTo, cfRule);
    onUpdate();
  }

  function findRowElement(id: string): HTMLElement | null {
    return listBody?.querySelector<HTMLElement>(`[data-rule-id="${id}"]`) ?? null;
  }

  // Swapping two rules visually slides the two rows past each other with a
  // CSS animation. The model is only changed once the animation has ended,
  // so the redraw that follows puts the rows where they already appear to
  // be. The animation is a transform inside the scrollable list, so it is
  // clipped like any other content and touches nothing outside the widget.
  function handleReorder(rule: Rule, lower: boolean): void {
    if (isReordering) {
      return;
    }
    const index = parseInt(rule.id, 10);
    const commit = () => {
      if (lower) {
        model.lowerConditionalFormattingPriority(sheet, index);
      } else {
        model.raiseConditionalFormattingPriority(sheet, index);
      }
      onUpdate();
    };

    const pos = rules.findIndex((r) => r.id === rule.id);
    const neighbor = rules[lower ? pos + 1 : pos - 1];
    const rowEl = findRowElement(rule.id);
    const neighborEl = neighbor ? findRowElement(neighbor.id) : null;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    // No animation when the neighbor is filtered out of the list (nothing
    // moves on screen) or when the user prefers reduced motion.
    if (!rowEl || !neighborEl || reducedMotion) {
      commit();
      return;
    }

    const rowHeight = rowEl.getBoundingClientRect().height;
    const neighborHeight = neighborEl.getBoundingClientRect().height;
    const rowShift = lower ? neighborHeight : -neighborHeight;
    const neighborShift = lower ? -rowHeight : rowHeight;

    let finished = false;
    const finish = () => {
      if (finished) {
        return;
      }
      finished = true;
      clearTimeout(timer);
      rowEl.removeEventListener("animationend", onAnimationEvent);
      rowEl.removeEventListener("animationcancel", onAnimationEvent);
      isReordering = false;
      // Commit synchronously and drop the transforms in the same task, so the
      // DOM reorder and the transform removal are painted together.
      flushSync(commit);
      for (const el of [rowEl, neighborEl]) {
        el.classList.remove(MOVING_CLASS);
        el.style.removeProperty("--ic-cf-shift");
      }
    };
    const onAnimationEvent = (e: AnimationEvent) => {
      if (e.target === rowEl && e.animationName.includes(MOVING_ANIMATION)) {
        finish();
      }
    };
    rowEl.addEventListener("animationend", onAnimationEvent);
    rowEl.addEventListener("animationcancel", onAnimationEvent);
    const timer = setTimeout(finish, MOVING_DURATION_MS + 100);

    isReordering = true;
    rowEl.style.setProperty("--ic-cf-shift", `${rowShift}px`);
    neighborEl.style.setProperty("--ic-cf-shift", `${neighborShift}px`);
    rowEl.classList.add(MOVING_CLASS);
    neighborEl.classList.add(MOVING_CLASS);
  }

  const filteredRules = $derived.by(() => {
    void version;
    const selectedArea = getSanitizedSelectedArea();
    const query = searchQuery.trim().toLowerCase();
    return rules.filter((rule) => {
      if (filterOption === "selection" && !isRangeInRanges(selectedArea, rule.applyTo)) {
        return false;
      }
      if (!query) {
        return true;
      }
      return (
        rule.applyTo.toLowerCase().includes(query) ||
        getRuleDescription({ ...rule, resolveValue: resolveRef, t })
          .toLowerCase()
          .includes(query)
      );
    });
  });

  // What a row of the list shows: its preview and its description
  function describe(rule: Rule) {
    const fontColor =
      resolveColorToHex(rule.formatStyle.fontColor, currentTheme) ||
      "var(--palette-sheet-default-text-color)";
    const fillColor = resolveColorToHex(rule.formatStyle.fillColor, currentTheme) || "transparent";
    const textDecoration =
      [rule.formatStyle.underline ? "underline" : "", rule.formatStyle.strike ? "line-through" : ""]
        .filter(Boolean)
        .join(" ") || "none";
    const classicStyle = [
      `color: ${fontColor}`,
      `background-color: ${fillColor}`,
      `font-weight: ${rule.formatStyle.bold ? "bold" : "normal"}`,
      `font-style: ${rule.formatStyle.italic ? "italic" : "normal"}`,
      `text-decoration: ${textDecoration}`,
    ].join("; ");

    const isColorScale = rule.ruleType === "color_scale";
    const isDataBars = rule.ruleType === "data_bars";
    const isIconSets = rule.ruleType === "icon_sets";
    const isRating = isIconSets && !!rule.iconSets?.rating;

    let previewStyle = classicStyle;
    if (isColorScale && rule.colorScale) {
      const { minimum, midpoint, maximum } = rule.colorScale;
      const colors =
        midpoint.type === "none"
          ? [minimum.color, maximum.color]
          : [minimum.color, midpoint.color, maximum.color];
      previewStyle = `background: ${steppedGradient(
        colors.map((color) => resolveColorToHex(color, currentTheme)),
      )}`;
    } else if (isColorScale) {
      previewStyle = "";
    } else if (isDataBars) {
      previewStyle = "position: relative; overflow: hidden";
    } else if (isIconSets) {
      previewStyle = "background: var(--palette-common-white)";
    }

    let icon: IconPreviewInfo | undefined;
    if (isIconSets && rule.iconSets) {
      if (rule.iconSets.rating) {
        const spec = iconSpecFor(rule.iconSets.rating.icon);
        icon = {
          Icon: spec.Icon,
          color: resolveColorToHex(rule.iconSets.rating.color, currentTheme),
          filled: spec.filled,
        };
      } else {
        icon = ALL_PRESETS.find((p) => p.id === rule.iconSets?.presetId)?.icons[0];
      }
    }

    return {
      previewStyle,
      isColorScale,
      isDataBars,
      icon,
      description: isRating
        ? t("conditional_formatting.icon_sets_ratings")
        : getRuleDescription({ ...rule, resolveValue: resolveRef, t }),
    };
  }

  const selectedArea = $derived.by(() => {
    void version;
    return getSanitizedSelectedArea();
  });
</script>

<div class="ic-cf-container">
  {#if isCreatingNew || editingRule !== null}
    <DrawerHeader
      title={editingRule
        ? t("conditional_formatting.edit_rule")
        : t("conditional_formatting.add_new_rule")}
      {onClose}
      onBack={handleCancel}
      backLabel={t("conditional_formatting.back_to_list")}
    />
    <div class="ic-cf-content">
      <EditRule
        onSave={handleSave}
        onCancel={handleCancel}
        getSelectedArea={getSanitizedSelectedArea}
        resolveValue={resolveRef}
        {currentTheme}
        initialValues={editingRule ?? {
          applyTo: getSanitizedSelectedArea(),
          ruleType: "cell_value",
          ruleOperator: "between",
          ruleValue: "",
          ruleValue2: "",
          formatStyle: {
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            fontColor: "#D21D21",
            fillColor: "#FBE7E8",
          },
        }}
      />
    </div>
  {:else}
    <DrawerHeader title={t("conditional_formatting.title")} {onClose} />
    <div class="ic-cf-content">
      {#if rules.length === 0}
        <div class="ic-cf-empty-state">
          <div class="ic-cf-icon-wrapper"><PackageOpen /></div>
          {t("conditional_formatting.empty_message1")}
          <br />
          {t("conditional_formatting.empty_message2")}
        </div>
      {:else}
        <div class="ic-cf-list-container">
          <div class="ic-cf-search-container">
            <Input
              type="text"
              size="sm"
              bind:value={searchQuery}
              placeholder={t("conditional_formatting.search_placeholder")}
              class="ic-cf-search"
            >
              {#snippet startAdornment()}<Search size={16} />{/snippet}
            </Input>
            <div class="ic-cf-filter">
              <span>{t("conditional_formatting.filter_label")}</span>
              <Select
                size="sm"
                variant="ghost"
                value={filterOption}
                options={filterOptions}
                onChange={(value) => (filterOption = value)}
              />
            </div>
          </div>
          <!-- the pointer must not take the focus from the search field -->
          <!-- svelte-ignore a11y_no_static_element_interactions -->
          <div
            bind:this={listBody}
            class="ic-cf-list-body"
            onmousedown={(event) => event.preventDefault()}
          >
            {#if filteredRules.length === 0}
              <div class="ic-cf-empty-state">
                <div class="ic-cf-icon-wrapper"><SearchX /></div>
                {t("conditional_formatting.no_search_results")}
              </div>
            {:else}
              {#each filteredRules as rule (rule.id)}
                {@const row = describe(rule)}
                {@const position = rules.findIndex((r) => r.id === rule.id)}
                <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_static_element_interactions -->
                <div
                  data-rule-id={rule.id}
                  class={[
                    "ic-cf-list-item",
                    isRangeInRanges(selectedArea, rule.applyTo) && "ic-cf-list-item--selected",
                  ]}
                  tabindex="0"
                  onclick={() => selectRuleRange(rule)}
                  onkeydown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      selectRuleRange(rule);
                    }
                  }}
                >
                  <div class="ic-cf-list-item-order-stack">
                    <IconButton
                      class="ic-cf-list-item-order-chevron"
                      disabled={position === 0}
                      aria-label={t("conditional_formatting.move_up")}
                      onclick={(event) => {
                        event.stopPropagation();
                        handleReorder(rule, false);
                      }}
                    >
                      {#snippet icon()}<ChevronUp />{/snippet}
                    </IconButton>
                    <div class="ic-cf-list-item-order">{position + 1}</div>
                    <IconButton
                      class="ic-cf-list-item-order-chevron"
                      disabled={position === rules.length - 1}
                      aria-label={t("conditional_formatting.move_down")}
                      onclick={(event) => {
                        event.stopPropagation();
                        handleReorder(rule, true);
                      }}
                    >
                      {#snippet icon()}<ChevronDown />{/snippet}
                    </IconButton>
                  </div>
                  <div class="ic-cf-list-item-preview" style={row.previewStyle}>
                    {#if row.isDataBars && rule.dataBars}
                      <DataBarMiniChart
                        color={resolveColorToHex(rule.dataBars.positiveColor, currentTheme) ||
                          rule.dataBars.color}
                        gradient={rule.dataBars.gradient}
                      />
                    {:else if row.icon}
                      <row.icon.Icon
                        size={16}
                        color={row.icon.color}
                        fill={row.icon.filled ? row.icon.color : "none"}
                      />
                    {:else if !row.isColorScale && !row.isDataBars}
                      Aa
                    {/if}
                  </div>
                  <div class="ic-cf-list-item-text">
                    <div class="ic-cf-list-item-rule">{row.description}</div>
                    <div class="ic-cf-list-item-range">{rule.applyTo || "—"}</div>
                  </div>
                  <div class="ic-cf-list-item-icons">
                    <Tooltip title={t("conditional_formatting.edit_rule")}>
                      <IconButton
                        aria-label={t("conditional_formatting.edit_rule")}
                        onclick={(event) => {
                          event.stopPropagation();
                          editingRule = rule;
                        }}
                      >
                        {#snippet icon()}<PencilLine />{/snippet}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("conditional_formatting.duplicate_rule")}>
                      <IconButton
                        aria-label={t("conditional_formatting.duplicate_rule")}
                        onclick={(event) => {
                          event.stopPropagation();
                          handleDuplicate(rule);
                        }}
                      >
                        {#snippet icon()}<Copy />{/snippet}
                      </IconButton>
                    </Tooltip>
                    <Tooltip title={t("conditional_formatting.delete_rule")}>
                      <IconButton
                        aria-label={t("conditional_formatting.delete_rule")}
                        onclick={(event) => {
                          event.stopPropagation();
                          handleDelete(rule.id);
                        }}
                      >
                        {#snippet icon()}<Trash2 />{/snippet}
                      </IconButton>
                    </Tooltip>
                  </div>
                </div>
              {/each}
            {/if}
          </div>
        </div>
      {/if}
    </div>
    <div class="ic-cf-footer">
      <Button onclick={() => (isCreatingNew = true)}>
        {#snippet startIcon()}<Plus />{/snippet}
        {t("conditional_formatting.new")}
      </Button>
    </div>
  {/if}
</div>

<style>
  /* Port of upstream ConditionalFormatting/conditional-formatting.css; the
     headers are DrawerHeader's */
  .ic-cf-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ic-cf-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    color: var(--palette-grey-700);
    line-height: 1.5;
    min-height: 0;
    overflow: hidden;
  }

  .ic-cf-empty-state {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    align-items: center;
    justify-content: center;
    text-align: center;
    font-size: 12px;
    padding: 0 20px;
    color: var(--palette-grey-600);
    font-family: var(--typography-font-family);
    text-wrap: balance;
  }

  .ic-cf-icon-wrapper {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border-radius: 4px;
    background-color: var(--palette-grey-100);
    color: var(--palette-grey-600);
  }

  .ic-cf-icon-wrapper :global(svg) {
    width: 16px;
    height: 16px;
    stroke-width: 2;
  }

  .ic-cf-list-container {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
  }

  .ic-cf-search-container {
    height: 40px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    padding: 0 8px;
    gap: 4px;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-cf-search-container :global(.ic-cf-search) {
    flex: 1;
    min-width: 0;
  }

  .ic-cf-search-container :global(.ic-input-control) {
    border: none;
    border-radius: 0;
    width: 100%;
    background-color: var(--palette-common-white);
  }

  .ic-cf-filter {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }

  .ic-cf-filter > span {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-grey-600);
    white-space: nowrap;
  }

  .ic-cf-filter :global(.ic-select) {
    max-width: 100px;
  }

  .ic-cf-list-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    overflow-y: auto;
  }

  .ic-cf-list-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 8px 12px 8px 8px;
    cursor: pointer;
    height: 68px;
    box-sizing: border-box;
    border-bottom: 1px solid var(--palette-grey-200);
    transition: all 0.2s ease-in-out;
    border-left: 3px solid transparent;
  }

  .ic-cf-list-item:global(.ic-cf-list-item--moving) {
    animation: ic-cf-slide 0.2s ease-in-out forwards;
    pointer-events: none;
  }

  @keyframes ic-cf-slide {
    from {
      transform: none;
    }
    to {
      transform: translateY(var(--ic-cf-shift, 0px));
    }
  }

  .ic-cf-list-item--selected {
    padding-left: 16px;
    border-left: 3px solid var(--palette-primary-main);
  }

  .ic-cf-list-item:hover {
    background-color: var(--palette-grey-50);
  }

  .ic-cf-list-item-order-stack {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
  }

  .ic-cf-list-item-order {
    width: 16px;
    height: 16px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    color: var(--palette-grey-600);
  }

  .ic-cf-list-item-order-stack :global(.ic-cf-list-item-order-chevron) {
    width: 16px;
    height: 16px;
    min-width: 16px;
    padding: 0;
    opacity: 0;
    pointer-events: none;
  }

  .ic-cf-list-item--selected :global(.ic-cf-list-item-order-chevron),
  .ic-cf-list-item:hover :global(.ic-cf-list-item-order-chevron),
  .ic-cf-list-item:focus-within :global(.ic-cf-list-item-order-chevron) {
    opacity: 1;
    pointer-events: auto;
  }

  .ic-cf-list-item-preview {
    width: 40px;
    height: 36px;
    border-radius: 4px;
    box-shadow: inset 0 0 0 1px
      color-mix(in srgb, var(--palette-common-black) 12%, transparent);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    font-weight: 600;
  }

  .ic-cf-list-item-text {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .ic-cf-list-item-rule {
    font-size: 12px;
    font-weight: 600;
    color: var(--palette-common-black);
    font-family: var(--typography-font-family);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ic-cf-list-item-range {
    font-size: 12px;
    color: var(--palette-grey-600);
    font-family: var(--typography-font-family);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .ic-cf-list-item-icons {
    display: flex;
    align-items: center;
    gap: 2px;
    flex-shrink: 0;
    opacity: 0;
    pointer-events: none;
  }

  .ic-cf-list-item--selected .ic-cf-list-item-icons,
  .ic-cf-list-item:hover .ic-cf-list-item-icons,
  .ic-cf-list-item:focus-within .ic-cf-list-item-icons {
    opacity: 1;
    pointer-events: auto;
  }

  .ic-cf-footer {
    padding: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    font-size: 12px;
    color: var(--palette-grey-600);
    border-top: 1px solid var(--palette-grey-300);
    gap: 8px;
  }
</style>
