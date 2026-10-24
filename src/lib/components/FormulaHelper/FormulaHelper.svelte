<!--
  Port of upstream webapp/IronCalc/src/components/FormulaHelper/FormulaHelper.tsx
  and formulaHelper.css: the formula helper popup shown while editing a
  formula. It renders a `Completion` (see the carried formulaCompletion.ts)
  as one of two cards:

  * a list of functions matching the partial name (e.g. "=SU" -> SUM, SUMIF…)
  * the signature / docs of the function whose arguments are being filled in
    (e.g. "=SUM(" -> SUM ( number1 , [number2] , … ) + description/examples)

  The selected list row is controlled by the editor so it can be driven from
  either the mouse (hover) or the keyboard (arrow keys).
-->
<script lang="ts" module>
  // The details card unmounts whenever the helper closes, so the user's
  // choice (collapsed or not) is remembered here.
  let lastCollapsed = false;
</script>

<script lang="ts">
  import ChevronUp from "@lucide/svelte/icons/chevron-up";
  import {
    type Completion,
    displayArgName,
    docsUrl,
    firstSentence,
    lookup,
  } from "../../upstream/components/FormulaHelper/formulaCompletion";

  interface Props {
    completion: Completion;
    /** Index of the highlighted row in list mode (controlled by the editor). */
    selected: number;
    /** Called when a row is hovered, so the editor can update `selected`. */
    onSelect: (index: number) => void;
    /** Called when a row is clicked, to accept that row's completion. */
    onAccept: (index: number) => void;
  }

  let { completion, selected, onSelect, onAccept }: Props = $props();

  let collapsed = $state(lastCollapsed);

  function toggleCollapsed(): void {
    collapsed = !collapsed;
    lastCollapsed = collapsed;
  }

  // The popup sits over the workbook while a cell is being edited. Without
  // this, clicking inside it blurs the editor textarea (which commits the
  // edit) and the click also reaches the workbook, moving the selection.
  // preventDefault on pointer-down keeps focus on the textarea so editing
  // continues; stopPropagation keeps the click from reaching the workbook.
  // Buttons and links still receive their own click events.
  function swallowPointerDown(event: PointerEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  function swallowClick(event: MouseEvent): void {
    event.stopPropagation();
  }

  const clamped = $derived(
    completion?.kind === "list"
      ? Math.min(Math.max(selected, 0), completion.matches.length - 1)
      : 0,
  );

  const detail = $derived.by(() => {
    if (completion?.kind !== "detail") {
      return null;
    }
    const info = lookup(completion.name);
    if (!info) {
      return null;
    }
    return {
      name: completion.name,
      info,
      url: docsUrl(completion.name, info.category),
      // Extra commas can push the index past the listed args; keep it on the
      // last one (typically the repeating "…" argument).
      activeIndex: Math.min(completion.activeIndex, info.args.length - 1),
    };
  });
</script>

{#if completion?.kind === "list"}
  {@const prefix = completion.prefix}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div
    class="ic-fh ic-fh-list"
    onpointerdown={swallowPointerDown}
    onclick={swallowClick}
  >
    {#each completion.matches as name, index (name)}
      {@const isSelected = index === clamped}
      {@const info = lookup(name)}
      <button
        type="button"
        class={["ic-fh-list-item", isSelected && "ic-fh-selected"]}
        {@attach (element) => {
          if (isSelected) {
            element.scrollIntoView?.({ block: "nearest", inline: "nearest" });
          }
        }}
        onmouseenter={() => onSelect(index)}
        onclick={() => onAccept(index)}
      >
        <span class="ic-fh-name"
          ><span class="ic-fh-name-match">{prefix}</span>{name.slice(
            prefix.length,
          )}</span
        >
        {#if isSelected && info}
          <span class="ic-fh-list-desc">{firstSentence(info.description)}</span>
        {/if}
      </button>
    {/each}
  </div>
{:else if detail}
  <!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
  <div class="ic-fh" onpointerdown={swallowPointerDown} onclick={swallowClick}>
    <div class="ic-fh-header">
      <div class="ic-fh-header-main">
        <div class="ic-fh-signature">
          <span class="ic-fh-fn-name">{detail.name.toUpperCase()}</span
          >{" ( "}{#each detail.info.args as arg, index (arg[0])}{#if index > 0}<span
                class="ic-fh-comma">, </span
              >{/if}<span
              class={[
                "ic-fh-arg",
                index === detail.activeIndex && "ic-fh-arg-active",
              ]}>{displayArgName(arg[0])}</span
            >{/each}{" )"}
        </div>
        {#if !collapsed}
          <div class="ic-fh-desc">
            {detail.info.description}
            {#if detail.url}
              <a
                class="ic-fh-link"
                href={detail.url}
                target="_blank"
                rel="noreferrer">Read more</a
              >
            {/if}
          </div>
        {/if}
      </div>
      <button
        type="button"
        class="ic-fh-collapse-btn btn-icon btn-icon-sm hover:preset-tonal"
        aria-label={collapsed ? "Expand" : "Collapse"}
        title={collapsed ? "Expand" : "Collapse"}
        onclick={toggleCollapsed}
      >
        <ChevronUp
          size={16}
          style={collapsed ? "transform: rotate(180deg)" : undefined}
        />
      </button>
    </div>

    {#if !collapsed && detail.info.examples.length > 0}
      <div class="ic-fh-body">
        <div class="ic-fh-examples-label">Examples</div>
        {#each detail.info.examples as example (example)}
          <div class="ic-fh-example">{example}</div>
        {/each}
      </div>
    {/if}
  </div>
{/if}

<style>
  /* Port of upstream FormulaHelper/formulaHelper.css: minimal styling for the
     popup, loosely following the IronCalc design mockup (orange accent,
     function list + signature/docs card). */

  .ic-fh {
    font-family: var(--typography-font-family);
    width: 320px;
    max-width: 90vw;
    background: var(--palette-common-white);
    border: 1px solid var(--palette-grey-300);
    border-radius: 6px;
    box-shadow: var(--shadow-md);
    font-size: var(--typography-font-size);
    color: var(--palette-common-black);
    overflow: hidden;
  }

  /* ---------- Function list (e.g. "=SU") ---------- */

  .ic-fh-list {
    max-height: 320px;
    overflow-y: auto;
    padding: 4px;
    scroll-padding-block: 4px;
  }

  .ic-fh-list-item {
    display: block;
    width: 100%;
    text-align: left;
    padding: 8px;
    border-radius: 4px;
    cursor: pointer;
    border: none;
    background: transparent;
    font: inherit;
    color: var(--palette-common-black);
    outline: none;
  }

  .ic-fh-list-item.ic-fh-selected {
    background: var(--palette-grey-50);
  }

  .ic-fh-name {
    font-weight: 400;
    color: var(--palette-common-black);
  }

  /* The portion of the name that matches what the user has typed so far. */
  .ic-fh-name-match {
    text-decoration: underline;
    text-underline-offset: 3px;
    line-height: 1.4;
  }

  .ic-fh-list-desc {
    display: block;
    color: var(--palette-grey-600);
    font-size: var(--typography-font-size);
    line-height: 1.4;
    margin-top: 4px;
  }

  /* ---------- Function detail (e.g. "=SUM(") ---------- */

  .ic-fh-header {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    padding: 12px;
  }

  .ic-fh-collapse-btn {
    margin: -4px -4px -4px 0;
    flex-shrink: 0;
  }

  .ic-fh-header-main {
    flex: 1 1 auto;
    min-width: 0;
  }

  .ic-fh-signature {
    font-size: var(--typography-font-size);
    line-height: 1.4;
    color: var(--palette-grey-600);
  }

  .ic-fh-fn-name {
    font-weight: 700;
    color: var(--palette-common-black);
  }

  .ic-fh-comma {
    color: var(--palette-grey-600);
  }

  .ic-fh-arg {
    color: var(--palette-grey-600);
  }

  .ic-fh-arg-active {
    background: color-mix(in srgb, var(--palette-primary-main) 20%, transparent);
    color: var(--palette-common-black);
    border-radius: 3px;
    padding: 1px 3px;
  }

  .ic-fh-desc {
    margin-top: 4px;
    font-size: var(--typography-font-size);
    color: var(--palette-grey-700);
    line-height: 1.4;
  }

  .ic-fh-body {
    padding: 12px;
    border-top: 1px solid var(--palette-grey-200);
  }

  .ic-fh-examples-label {
    color: var(--palette-grey-600);
    font-size: calc(var(--typography-font-size) - 1px);
    margin-bottom: 4px;
  }

  .ic-fh-example {
    font-family: var(--typography-font-family);
    color: var(--palette-common-black);
    line-height: 1.4;
  }

  .ic-fh-link {
    margin-left: 4px;
    color: var(--palette-primary-main);
    font-size: inherit;
    cursor: pointer;
    text-decoration: none;
    white-space: nowrap;
  }

  .ic-fh-link:hover {
    text-decoration: underline;
  }
</style>
