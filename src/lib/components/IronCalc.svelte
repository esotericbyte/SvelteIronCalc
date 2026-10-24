<!--
  Port of upstream webapp/IronCalc/src/IronCalc.tsx: the widget root.

  Upstream puts the `ic-root` class (where the theme variables live) on
  `document.body` unless given a container; here the widget's own element is
  the root, so nothing outside the widget is touched.
-->
<script lang="ts">
  import type { Model } from "@ironcalc/wasm";
  import { untrack } from "svelte";
  import "../upstream/theme/theme.css";
  import {
    type PartialIronCalcThemeVariables,
    setThemeVariables,
    unsetThemeVariables,
  } from "../upstream/theme";
  import { WorkbookState } from "../upstream/components/workbookState";
  import Workbook from "./Workbook/Workbook.svelte";

  interface Props {
    /** The model to show, from `@ironcalc/wasm` (`Model.fromBytes`, or `modelFromXlsx` in `ironcalc-svelte/xlsx`). */
    model: Model;
    /** Overrides of the theme's CSS variables, e.g. `darkThemeVariables`. */
    themeVariables?: PartialIronCalcThemeVariables;
  }

  let { model, themeVariables }: Props = $props();

  let rootElement: HTMLDivElement | null = $state(null);
  let workbook: Workbook | null = $state(null);

  // A new model gets fresh runtime state, as upstream does on every mount
  const workbookState = $derived.by(() => {
    void model;
    return new WorkbookState();
  });

  $effect(() => {
    const root = rootElement;
    const variables = themeVariables;
    if (root && variables) {
      setThemeVariables(variables, root);
    }
    // the canvas reads the theme from CSS when it renders
    const target = workbook;
    untrack(() => target?.redraw());
    if (root && variables) {
      return () => unsetThemeVariables(root);
    }
  });

  /** Re-reads the model; call after changing it from outside the widget. */
  export function redraw(): void {
    workbook?.redraw();
  }
</script>

<div class="ic-root ic-widget" bind:this={rootElement}>
  {#key model}
    <Workbook bind:this={workbook} {model} {workbookState} />
  {/key}
</div>

<style>
  .ic-widget {
    --formula-bar-height: 40px;
    --navigation-height: 40px;
    --toolbar-height: 40px;
    width: 100%;
    height: 100%;
  }
</style>
