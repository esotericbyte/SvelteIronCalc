# ironcalc-svelte

A Svelte 5 port of [IronCalc](https://github.com/ironcalc/IronCalc)'s spreadsheet widget, the React package `@ironcalc/workbook`. It runs on IronCalc's own engine, `@ironcalc/wasm`, and reuses upstream's canvas renderer unchanged; the React components are rewritten as Svelte components with [Skeleton](https://www.skeleton.dev) and [Lucide](https://lucide.dev) icons.

The goal is feature parity with `@ironcalc/workbook` 0.9.1. The work goes in phases, and [docs/parity.md](docs/parity.md) is the roadmap: it maps every upstream file to its Svelte counterpart and says what is done and what comes next.

**Status: phase 4, the toolbar and formatting pickers.** Scrolling, cell/range/row/column selection with pointer and keyboard, frozen panes, merged cells, conditional formatting rendering, sheet tabs and the sheet list, cell links, copying the selection, theme variables (including dark), and loading and saving xlsx; editing: the cell and formula bar editors with formula highlighting, reference insertion by keys and by pointing, F4 cycling and the function helper, typing or F2 to edit, Delete, undo/redo, the bold/italic/underline shortcuts, cut and paste, the autofill handle and the format painter; and structure: the context menus of the cells and of the column and row headers (insert, delete, move, hide, freeze, set the width or height, cut, copy and paste), sheet management from the tab bar (add, rename, color, duplicate, hide, move, delete); and the toolbar: undo/redo, the format painter, clear formatting, number formats (currency, percentage, decimal places, the format menu and custom formats), the font size, bold/italic/underline/strikethrough, font and fill colors, borders with their color and line style, alignment and wrapping, merging, workbook themes, links (insert, edit and break, also from the link tooltip), grid lines and the PNG export of the visible selection. The right drawer (named ranges, cell styles, conditional formatting rules, the theme editor, regional settings) and the translations come in later phases. The package is not published to npm yet.

## 1. Use

```svelte
<script lang="ts">
  import { init, IronCalc, Model } from "ironcalc-svelte";
  import { initXlsx, modelFromXlsx, downloadXlsx } from "ironcalc-svelte/xlsx";

  let model: Model | null = $state(null);

  async function open(file: File) {
    await Promise.all([init(), initXlsx()]);
    model = modelFromXlsx(new Uint8Array(await file.arrayBuffer()), file.name);
  }
</script>

<input type="file" accept=".xlsx" onchange={(e) => open(e.currentTarget.files![0])} />
{#if model}
  <div style="height: 600px"><IronCalc {model} /></div>
  <button onclick={() => downloadXlsx(model!, "copy.xlsx")}>Download</button>
{/if}
```

`IronCalc` takes a `Model` from `@ironcalc/wasm` (`Model.fromBytes`, `new Model(...)`, or `modelFromXlsx`), an optional `themeVariables` (for example `darkThemeVariables`) and an optional `canEdit` (default `true`; `false` hides the toolbar and makes the widget read-only). Edits change the model in place, so saving it (`downloadXlsx`, `model.toBytes()`) saves them. It fills its parent, so give the parent a height. Keyboard input is handled only while the widget has focus; it takes focus when clicked.

Like upstream, the package also exports the UI primitives the widget is built from, as thin Svelte components over Skeleton: `Button`, `IconButton`, `Checkbox`, `Input`, `Menu`, `MenuItem`, `MenuItemWithSubmenu`, `MenuDivider`, `ToggleButton`, `Tooltip` and the `Confirm` dialog, and IronCalc's logos (`IronCalcIcon`, `IronCalcIconWhite`, `IronCalcLogo`). Where upstream takes React elements (icons, menu content, a menu's trigger) they take snippets.

The xlsx helpers live in the separate entry `ironcalc-svelte/xlsx` because they need `@ironcalc/wasm-xlsx`, upstream's larger engine build with xlsx support, which is an optional peer dependency. Without them, `Model.fromBytes` and `model.toBytes()` work with IronCalc's own format.

### 1.1 Styling

The widget's layout and colors come from upstream's CSS variables (`--palette-*`, see `src/lib/upstream/theme/theme.css`). Its menus use Skeleton components and Tailwind classes, so the host app needs Tailwind 4 and Skeleton, and must let Tailwind scan this package:

```css
@import "tailwindcss";
@import "@skeletonlabs/skeleton";
@import "@skeletonlabs/skeleton/themes/cerberus";
@source "../node_modules/ironcalc-svelte/dist";
@source "../node_modules/@skeletonlabs/skeleton-svelte/dist";
```

Upstream's sheet font is Inter; load it in the host app (the demo shows how) or the renderer falls back to sans-serif.

## 2. Develop

```sh
npm install
npm run dev      # the demo app: open and edit an .xlsx file or the generated sample
npm run check    # svelte-check
npm test         # vitest
npm run build    # demo build, then svelte-package and publint into dist/
```

`src/lib/` is the library; `src/routes/` is the demo app. Code carried over from upstream lives in `src/lib/upstream/` and must stay identical to upstream; `scripts/upstream-diff.sh <IronCalc checkout>` shows how it differs from a given upstream checkout.

## 3. License

MIT OR Apache-2.0, at your option, like IronCalc. This repository carries IronCalc code under its copyright; see [NOTICE](NOTICE).
