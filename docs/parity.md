# Parity with `@ironcalc/workbook`

This is the roadmap of the port. It maps every file of upstream's React widget to its Svelte counterpart, gives each a status and the phase it belongs to, and proposes the phases after the first. Later phases follow it and update it as they land.

## Contents

1. [Reference](#1-reference)
2. [Status legend](#2-status-legend)
3. [Feature parity](#3-feature-parity)
4. [Phases](#4-phases)
5. [File map](#5-file-map)

## 1. Reference

The reference is IronCalc at commit `9cfbdfce5efcdbedd57520ad9fd797b12e6bf0ba` (2026-10-23), whose `webapp/IronCalc/` is the React widget published as `@ironcalc/workbook` 0.9.1, built on the engine `@ironcalc/wasm` 0.9.1. Its `src/` holds 189 files and 40,977 lines; 28,566 of them are code and styles, the rest being Storybook stories, the function list (`functions.json`), the five locale files and icons.

The plain-TypeScript renderer and the runtime state are carried over unchanged into `src/lib/upstream/` (see its `UPSTREAM.md`), so that bumping upstream is a diff of that directory. Every React component is rewritten as a Svelte 5 component, using Skeleton for UI chrome and Lucide (`@lucide/svelte`) for icons where upstream uses `lucide-react`.

`@ironcalc/wasm` has no xlsx support; upstream ships it in the separate `@ironcalc/wasm-xlsx` build of the same crate. The widget works on `@ironcalc/wasm` models, and the optional entry `ironcalc-svelte/xlsx` converts between xlsx bytes and such a model through the engine's byte format (`fromXlsx`/`toXlsx` on the xlsx build, `fromBytes`/`toBytes` on both).

## 2. Status legend

1. **carried**: upstream file copied unchanged into `src/lib/upstream/`.
2. **ported**: rewritten in Svelte or plain TypeScript with the same behavior.
3. **partial**: the read-only part is ported; the rest is planned for the phase given after the slash.
4. **planned**: not ported yet; the phase column says when. Since phase 6 no row is partial or planned.
5. **not ported**: deliberately left out (Storybook stories, re-export files, upstream documentation).

## 3. Feature parity

| Feature | Upstream | Status | Phase |
| --- | --- | --- | --- |
| Canvas rendering of cells, styles, borders, number formats | `WorksheetCanvas/worksheetCanvas.ts` | carried | 1 |
| Conditional formatting rendering (data bars, icon sets, color scales) | `WorksheetCanvas/cfRenderer.ts` | carried | 1 |
| Scrolling (whole rows and columns, model-synced scroller) | `Worksheet/Worksheet.tsx` | ported | 1 |
| Frozen rows and columns | `worksheetCanvas.ts` | carried | 1 |
| Merged cells | `worksheetCanvas.ts`, `components/util.ts` | carried | 1 |
| Cell, range, row, column and whole-sheet selection with the pointer | `Worksheet/usePointer.ts` | ported | 1 |
| Keyboard navigation (arrows, Tab, Enter, Home/End, PageUp/Down, Ctrl+arrows, Shift+arrows, Ctrl/Shift+Space, Alt+Up/Down) | `Workbook/useKeyboardNavigation.ts` | ported | 1 |
| Keys handled only while the widget has focus | `Workbook/Workbook.tsx` | ported (upstream also refocuses on every render; this port takes focus on a click inside the widget, and back when an edit ends while the focus is inside the widget or nowhere) | 1 / 2 |
| Sheet tabs and the sheet list menu (hidden sheets listed) | `SheetTabBar/` | ported | 1 |
| Read-only formula bar (address, formula or value, array formulas in braces) | `FormulaBar/FormulaBar.tsx`, `Workbook.tsx` | ported | 1 |
| Cell links: hover tooltip, follow, copy; Ctrl+click follows | `Worksheet/LinkTooltip.tsx`, `WorksheetCanvas/cellLinks.ts` | ported / carried | 1 |
| Column width and row height by dragging header edges | `worksheetCanvas.ts` | carried (upstream allows it read-only too) | 1 |
| Copy the selection (text and IronCalc JSON) | `Workbook.tsx` | ported | 1 |
| Read-only mode (`canEdit`, default true) | `IronCalc.tsx`, `Workbook.tsx` | ported | 2 |
| Theme variables, dark theme | `theme/` | carried | 1 |
| Load from xlsx, save as xlsx | app-level in upstream | `ironcalc-svelte/xlsx` | 1 |
| Cell editor and formula bar editor, formula highlighting, reference insertion by keys and by pointing (also on other sheets), F4 cycling, Alt+Enter, Ctrl+Shift+Enter array formulas | `Editor/`, `Worksheet/usePointer.ts`, `SheetTabBar/SheetTab.tsx` | ported | 2 |
| Function autocomplete and help | `FormulaHelper/` | ported | 2 |
| Typing to edit, F2, double click, Delete, undo/redo, bold/italic/underline shortcuts | `useKeyboardNavigation.ts`, `Workbook.tsx`, `Worksheet.tsx` | ported | 2 |
| Paste and cut, autofill handle, copy styles (format painter) | `Workbook.tsx`, `outlineHandle.ts` | ported (the format painter is started by the toolbar's copy styles button since phase 4, and by the `copyStyles()` method of `Workbook`) | 2 / 4 |
| Context menus: insert, delete, move, hide and freeze rows and columns; set width and height; cut, copy and paste | `Worksheet/ContextMenus/`, `Worksheet.tsx`, `Workbook.tsx` | ported | 3 |
| Sheet management: add, rename, color, duplicate, hide, move, delete | `SheetTabBar/`, `Workbook.tsx` | ported (a rejected change shows an Alert where upstream calls `window.alert`) | 3 |
| Color picker and advanced color picker | `ColorPicker/`, `AdvancedColorPicker.tsx/` | ported (pulled forward from phase 4 for the sheet tab colors, and used by the toolbar's font, fill and border colors since phase 4; the advanced picker is a Svelte saturation and hue picker in place of react-colorful) | 3 / 4 |
| Alert, confirm and prompt dialogs | `Modal/` | ported (the alert, used by editing errors, came with phase 2) | 2 / 3 |
| UI primitives exported for consumers (Button, IconButton, Checkbox, Input, Menu, MenuItem, MenuItemWithSubmenu, MenuDivider, Confirm, ToggleButton, Tooltip) | `index.ts`, `Button/`, `Checkbox/`, `Input/`, `Menu/`, `Modal/`, `ToggleButton/`, `Tooltip/` | ported (thin Svelte components over Skeleton; React elements become snippets) | 3 |
| Toolbar: undo/redo, font, size, colors, alignment, wrap, borders, merge, number formats, grid lines, clear formatting, PNG export | `Toolbar/`, `BorderPicker/`, `FormatMenu/`, `Workbook.tsx` | ported (the conditional formatting and cell styles buttons open the right drawer since phase 5; the border picker handles only its own keys) | 4 / 5 |
| Links: insert and edit dialog, edit and break from the link tooltip | `LinkDialog/`, `Select/`, `Worksheet/LinkTooltip.tsx` | ported | 4 |
| Workbook themes menu | `ThemeMenu/` | ported ("Manage themes" opens the right drawer since phase 5) | 4 / 5 |
| Icon picker (icon sets of conditional formatting rules) | `IconPicker/` | ported (used by the drawer's icon set rules since phase 5) | 4 / 5 |
| Right drawer: opened from the toolbar, the address box and the sheet tab bar, resized by dragging or with the keys | `RightDrawer/RightDrawer.tsx`, `Workbook.tsx` | ported (the width is measured from the workbook's right edge and the handle captures the pointer, where upstream measures from the window's edge and styles `document.body` while dragging) | 5 |
| Named ranges (drawer and address-box menu) | `RightDrawer/NamedRanges/`, `FormulaBar/FormulaBarMenu.tsx` | ported (the address-box menu is a Menu primitive with the WAI-ARIA menu keys upstream's FIXME asks for) | 5 |
| Named styles | `RightDrawer/NamedStyles/` | ported | 5 |
| Conditional formatting rules editor | `RightDrawer/ConditionalFormatting/` | ported | 5 |
| Theme editor | `RightDrawer/Themes/` | ported | 5 |
| Regional settings (locale, timezone) | `RightDrawer/RegionalSettings/`, `SheetTabBar/SheetTabBar.tsx` | ported (as upstream, the drawer sets the locale and timezone and keeps the workbook's language) | 5 |
| Switch primitive, exported | `Switch/`, `index.ts` | ported (Skeleton `Switch`) | 5 |
| Translations (de, en, es, fr, it) and `setLanguage` | `locale/`, `i18n.ts`, `IronCalc.tsx`, `index.ts` | ported (the locale files are carried; the lookup is a small reactive function in place of i18next, so nothing is set up in `init`; as upstream, the language is shared by every widget on the page and a language without a locale file shows the keys) | 6 |
| Locale lint (same keys in every locale, no unused or missing key) | `scripts/lint-i18n.js`, `package.json` | ported (`npm run lint:i18n`, run by `npm run check` as upstream's `check` runs it) | 6 |

## 4. Phases

### 4.1 Phase 1: read-only sheet (landed)

The package scaffold, the carried renderer, and a read-only `IronCalc` widget: canvas, scrolling, selection, frozen panes, merged cells, sheet tabs, a read-only formula bar, link tooltips, copy, theme variables, and xlsx load and save helpers. The demo app opens a user-chosen .xlsx file.

### 4.2 Phase 2: editing and the cell editor (landed)

Port `Editor/` (the shared cell and formula-bar editor, its key handling and formula highlighting), the rest of `Editor/util.tsx` (carried where it is plain TypeScript, with `getFormulaHTML` rewritten for Svelte), `FormulaHelper/` with `functions.json` and `formulaCompletion.ts`, and the editing branches of `usePointer.ts` (pointing at cells to insert references). Wire the edit keys, undo/redo, Delete, paste and cut, the autofill handle and copy styles in `Workbook`, and add the `canEdit` prop (default true, like upstream). Port upstream's unit tests that cover these helpers (`getFormulaHTML`, `isInReferenceMode`, `applyListCompletion`, `snapFillExtent`).

As landed: the plain-TypeScript parts are carried (`formulaCompletion.ts`, `functions.json`, everything of `Editor/util.tsx` but `getFormulaHTML`), `getFormulaHTML` returns plain segments that `Editor.svelte` renders instead of JSX, and the alert dialog was pulled forward from phase 3 because the editing errors (formula, paste, delete, autofill) need it. The four tests, plus upstream's `docsUrl` test of the same module, live in `tests/upstream/` and differ from upstream only in import paths, the engine set-up and, for `getFormulaHTML`, the helpers that read a segment instead of a React element. The demo app edits the chosen workbook and downloads it as xlsx, and has a read-only switch.

### 4.3 Phase 3: structure, menus and dialogs (landed)

The worksheet context menus (cell, column header, row header), the column width and row height prompts, the sheet tab menu, renaming, coloring and deleting sheets, the add-sheet button, and the alert, confirm and prompt dialogs. The shared primitives they need (`Button`, `IconButton`, `Menu`, `MenuItem`, `Tooltip`, `Input`, `Checkbox`, `Textarea`) map to Skeleton components and classes rather than being re-implemented; the public exports upstream offers for them are added as thin Svelte components where consumers rely on them.

As landed: the menus are Skeleton (zag) menus, which bring the keyboard handling, positioning and outside-press dismissal upstream writes by hand; a context menu is a menu controlled at the pointer, and a submenu is a nested menu. The dialogs share `ModalDialog.svelte`, a Skeleton dialog that the phase 2 alert now uses too. Coloring a sheet needs the color picker, so `ColorPicker/` and the advanced picker were pulled forward from phase 4, with upstream's `ColorPicker/util.ts` carried unchanged and react-colorful replaced by a small Svelte picker. The exported primitives are `Button`, `IconButton`, `Checkbox`, `Input`, `Menu`, `MenuItem`, `MenuItemWithSubmenu`, `MenuDivider`, `Confirm`, `ToggleButton` and `Tooltip` (`Textarea` and `Prompt` are ported but, as upstream, not exported); where upstream takes React elements they take snippets. The translation lookup gained i18next's `{{name}}` interpolation for the menu labels. Widget tests cover the three context menus, the size prompts, the sheet tab menu, renaming, the color pickers and the primitives; the demo asks with the exported `Confirm` before replacing the open workbook with the sample.

### 4.4 Phase 4: toolbar and formatting pickers (landed)

The toolbar and everything it opens: the color pickers (ported with phase 3, reused here), the border picker, the number format menu, the icon picker, the theme menu, merge options, PNG export, and the link dialog. Upstream's custom SVG icons become Svelte icon components where Lucide has no match.

As landed: `Toolbar.svelte` has every button of upstream's toolbar, and `Workbook.svelte` the handlers behind them (range styles, number formats, font sizes, borders, merging with its error dialog, clear formatting, grid lines, themes, the PNG export of the visible selection) and the link dialog, which the link tooltip's new edit and break-link actions open too; the merge state, merging, borders and link saving are plain functions in `workbookModel.ts`. The toolbar shows only while editing is allowed, and the read-only widget collapses its height, as upstream. Its menus (number formats, merging, themes) are the phase 3 Menu primitives opened by a trigger; the color pickers are those of phase 3; the border picker, the icon picker and the select are ported panels. Three deliberate differences: the conditional formatting and cell styles buttons and the theme menu's "Manage themes" open the right drawer, so without a drawer (phase 5) they are disabled; the border picker takes the focus and handles only its own keys, where upstream listens to (and blocks) every key on the document while it is open; and the select keeps its list inside itself rather than portaling it, so it works inside a Skeleton dialog's focus trap. Upstream's `formatUtil.ts` is carried, and so is `RightDrawer/Themes/themeUtils.ts`, which the theme menu needs, ahead of the drawer. The icons Lucide has no match for are Svelte components in `src/lib/components/icons/` with upstream's SVG unchanged, and the package exports the three logos as upstream does. Upstream's `linkDialogUtil` test is in `tests/upstream/`; widget tests cover the toolbar's buttons, the font size field, the menus, the pickers, the merge error, the link dialog's three tabs and the link tooltip. The demo app shows the toolbar (hidden by its read-only switch) and the exported `IronCalcIcon`.

### 4.5 Phase 5: the right drawer (landed)

The drawer shell and its sections: named ranges (with the formula bar address menu), named styles, conditional formatting rules, the theme editor and regional settings.

As landed: `RightDrawer.svelte` shows the section `Workbook.svelte` asks for, and the workbook narrows the sheet by the drawer's width while it is open. The toolbar's conditional formatting and cell styles buttons (pressed while their section shows), the theme menu's "Manage themes", the address box's menu and the locale button at the right of the sheet tabs open it; the address box is now upstream's ghost button with the named-ranges menu, on the Menu primitive. The sections follow upstream screen by screen: the named ranges list (search, scope filter, select, edit, delete) and editor (debounced engine validation, scope by sheet, "use selection"); the cell style tiles (the workbook's own, then the built-in ones by category), their manage list and editor (name, number format with a custom one, font, fill, alignment and border, each included by a Switch); the conditional formatting list (search, sheet or selection filter, the reorder slide, edit, duplicate, delete) and the rule editor with its classic, color scale, data bars and icon sets tabs; the themes list and editor with the single custom theme; and the regional settings. The header every section repeats upstream is one `DrawerHeader.svelte`, and the color swatch next to the editors' fields one `SwatchButton.svelte`. The plain-TypeScript parts are ported rather than carried, because upstream keeps them in or next to its React components: `cfRuleMapping.ts` and `ruleDescription.ts` are unchanged but for their imports (the rule data types sit in small modules beside them, and `t` is the widget's lookup, which gained i18next's `defaultValue`), `named-styles-utils.ts` returns CSS strings instead of React style objects, and the presets of the four rule editors are plain modules. Two deliberate differences: the drawer's resize handle measures the width from the workbook's right edge and captures the pointer, where upstream measures from the window's right edge and sets the cursor and `user-select` on `document.body`; and the address-box menu has the menu keys of the Menu primitive, where upstream's popover only closes on Escape and presses outside. Clicking a list item gives the focus back to the sheet, as upstream's focus handling does; clicking a label (a Switch's) now leaves the focus where it is. The `Switch` primitive is ported on Skeleton's and exported, as upstream. Upstream has no tests for the drawer; `tests/drawer.test.ts` drives each section through the widget and `tests/cfRuleMapping.test.ts` round-trips every kind of rule through the engine. The demo's sample workbook gained a named range and a conditional formatting rule, and its read-only toggle is the exported Switch.

### 4.6 Phase 6: internationalization (landed)

The five upstream locales, a Svelte-friendly translation store replacing the English lookup, the `setLanguage` handle of the widget, and a port of upstream's locale lint.

As landed: the four other locale files are carried unchanged beside `en_us.json`, and `src/lib/i18n.ts` maps the same six language codes as upstream's `i18n.ts` (`en-US`, `en-GB`, `es-ES`, `fr-FR`, `de-DE`, `it-IT`) to them. The language is a `$state` in `i18nState.svelte.ts` that `t` reads, so every template and `$derived` that translates re-renders when it changes, with no store to subscribe to and no change to the components that call `t`. `changeLanguage` formats a code as i18next does (`de-de` becomes `de-DE`), and a language without a locale file translates every key to itself, as upstream's instance, which has no fallback language. `IronCalc.svelte` exports `setLanguage`, upstream's imperative handle, with upstream's body: when the language differs it changes the translation and sets the model's language to the code's first part (which translates formula function names), then redraws; the `IronCalcHandle` type is exported. Upstream's `init` also awaits `i18n.init()`; the lookup here needs no set-up, so `init` still only starts the engine. Two things follow upstream on purpose: the translation language is shared by every widget on the page, as upstream's single i18next instance, and so is the guard that skips `setLanguage` when the language is already the one asked for (the model then keeps its own language); and the dialogs' close buttons keep the English `closeLabel` default of upstream's `Alert`, `Confirm` and `Prompt`. Upstream's `scripts/lint-i18n.js` is ported with its checks unchanged, reading the carried locale files and scanning the `.ts` and `.svelte` files of `src/lib`; it passes with the same 402 keys across 5 locales. `tests/i18n.test.ts` covers the lookup in each language, `setLanguage` on the widget and the model, and sweeps the widget, the regional settings, the conditional formatting and cell style sections and their editors in German for any English string left. The demo app has a language select that calls `setLanguage`, and gives a workbook it opens afterwards the chosen language.

## 5. File map

Paths are relative to upstream's `webapp/IronCalc/` and to this repository's root. Line counts are upstream's.

| Upstream file | Lines | Svelte counterpart | Status | Phase | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/IronCalc.tsx` | 76 | `src/lib/components/IronCalc.svelte` | ported | 1 / 2 / 6 | the widget's own element is the `.ic-root` (upstream defaults to `document.body`); `canEdit` came with phase 2, the `setLanguage` handle with phase 6 as an exported method of the component, reached with `bind:this`, and the `IronCalcHandle` type |
| `src/components/AdvancedColorPicker.tsx/AdvancedColorPicker.tsx` | 233 | `src/lib/components/AdvancedColorPicker/AdvancedColorPicker.svelte`, `HexColorPicker.svelte`, `hsv.ts` | ported | 3 | pulled forward from phase 4 with the color picker; react-colorful's `HexColorPicker` and `HexColorInput` become `HexColorPicker.svelte` (saturation area and hue bar, pointer and arrow keys) and a plain hex field; upstream's recent-colors list, which nothing reads, is left out |
| `src/components/AdvancedColorPicker.tsx/advanced-color-picker.css` | 135 | src/lib/components/AdvancedColorPicker/AdvancedColorPicker.svelte (`<style>`) | ported | 3 | with the menu layer of `index.css`; the react-colorful overrides are the styles of `HexColorPicker.svelte` |
| `src/components/AdvancedColorPicker.tsx/useKeyDown.ts` | 54 | src/lib/components/AdvancedColorPicker/AdvancedColorPicker.svelte (`onKeyDown`) | ported | 3 | same keys (Escape, Tab cycling) |
| `src/components/BorderPicker/BorderPicker.tsx` | 361 | `src/lib/components/BorderPicker/BorderPicker.svelte` | ported | 4 | portaled into the `.ic-root`; it takes the focus when it opens and handles only its own keys (Escape closes the color picker, the style menu, then the panel), where upstream listens to and blocks every key on the document; the style menu also opens on a click, for the keyboard |
| `src/components/BorderPicker/LineStylePicker.tsx` | 46 | `src/lib/components/BorderPicker/LineStylePicker.svelte` | ported | 4 | the buttons are labelled with the style's name; the line previews are global styles since phase 5, as the cell style editor shows them too |
| `src/components/BorderPicker/border-picker.css` | 75 | src/lib/components/BorderPicker/BorderPicker.svelte (`<style>`) | ported | 4 |  |
| `src/components/BorderPicker/line-style-picker.css` | 88 | src/lib/components/BorderPicker/LineStylePicker.svelte (`<style>`) | ported | 4 |  |
| `src/components/Button/Button.stories.tsx` | 177 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Button/Button.tsx` | 75 | `src/lib/components/Button/Button.svelte` | ported | 3 | variants and sizes map to Skeleton `btn` classes and presets (`buttonClasses.ts`); the icons are snippets; `ref` is bindable |
| `src/components/Button/IconButton.stories.tsx` | 198 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Button/IconButton.tsx` | 60 | `src/lib/components/Button/IconButton.svelte` | ported | 3 | a Skeleton `btn-icon`; the icon is a snippet |
| `src/components/Button/button.css` | 156 | `src/lib/components/Button/buttonClasses.ts` | ported | 3 | replaced by Skeleton classes and presets |
| `src/components/Checkbox/Checkbox.stories.tsx` | 80 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Checkbox/Checkbox.tsx` | 69 | `src/lib/components/Checkbox/Checkbox.svelte` | ported | 3 | Skeleton `checkbox` class |
| `src/components/Checkbox/checkbox.css` | 76 | Skeleton `checkbox` class | ported | 3 | replaced by the Skeleton class |
| `src/components/ColorPicker/ColorPicker.stories.tsx` | 105 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/ColorPicker/ColorPicker.tsx` | 316 | `src/lib/components/ColorPicker/ColorPicker.svelte` | ported | 3 | pulled forward from phase 4: sheet tab colors need it; the toolbar's color pickers reuse it in phase 4. `anchorEl` is a getter instead of a ref |
| `src/components/ColorPicker/color-picker.css` | 172 | src/lib/components/ColorPicker/ColorPicker.svelte (`<style>`) | ported | 3 |  |
| `src/components/ColorPicker/useAnchorPosition.ts` | 104 | `src/lib/components/ColorPicker/anchorPosition.ts` | ported | 3 | the hook becomes a Svelte attachment; the positioning is unchanged |
| `src/components/ColorPicker/useKeyDown.ts` | 159 | `src/lib/components/ColorPicker/colorPickerKeyDown.ts` | ported | 3 | the hook becomes a handler factory; the key map is unchanged |
| `src/components/ColorPicker/util.ts` | 128 | `src/lib/upstream/components/ColorPicker/util.ts` | carried | 3 | unchanged |
| `src/components/Editor/Editor.stories.tsx` | 108 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Editor/Editor.tsx` | 444 | `src/lib/components/Editor/Editor.svelte` | ported | 2 | the caret is tracked on keyup, mouseup and select (upstream relies on React's onSelect, which also fires on caret moves); the worksheet also asks the editor to fit its box right before positioning it, as React's child-first effects do upstream |
| `src/components/Editor/editor.css` | 36 | src/lib/components/Editor/Editor.svelte (`<style>`) | ported | 2 | upstream's inline styles are classes there too |
| `src/components/Editor/useKeyDown.ts` | 717 | `src/lib/components/Editor/editorKeyDown.ts` | ported | 2 | the hook becomes a handler factory; the key map is unchanged |
| `src/components/Editor/util.tsx` | 448 | `src/lib/upstream/components/Editor/util.ts`, `src/lib/components/Editor/formulaHTML.ts` | carried / ported | 1 / 2 | everything but `getFormulaHTML` is carried verbatim; `getFormulaHTML` and its private helpers are ported, returning segments instead of JSX |
| `src/components/FormatMenu/FormatMenu.tsx` | 177 | `src/lib/components/FormatMenu/FormatMenu.svelte` | ported | 4 | on the Menu primitive with a trigger snippet; the workbook takes the focus back when a format is applied, where upstream refocuses the element focused before the menu opened |
| `src/components/FormatMenu/FormatPicker.tsx` | 30 | `src/lib/components/FormatMenu/FormatPicker.svelte` | ported | 4 | on `Prompt.svelte` |
| `src/components/FormatMenu/format-menu.css` | 13 | src/lib/components/Toolbar/Toolbar.svelte (`<style>`), `buttonClasses.ts` | ported | 4 | the open trigger's background is the ghost button's `aria-expanded` preset |
| `src/components/FormatMenu/formatUtil.ts` | 42 | `src/lib/upstream/components/FormatMenu/formatUtil.ts` | carried | 4 | unchanged |
| `src/components/FormulaBar/FormulaBar.tsx` | 118 | `src/lib/components/FormulaBar/FormulaBar.svelte` | ported | 1 / 5 | address and formula editor (phase 1), the address box as a ghost button opening the named-ranges menu (phase 5); its open state is the button's `aria-expanded` preset |
| `src/components/FormulaBar/FormulaBarMenu.tsx` | 198 | `src/lib/components/FormulaBar/FormulaBarMenu.svelte` | ported | 5 | on the Menu primitive with a trigger snippet, so it has the menu keys (arrows, typeahead) upstream's FIXME asks for, where upstream's popover only closes on Escape and presses outside |
| `src/components/FormulaBar/formula-bar-menu.css` | 105 | src/lib/components/FormulaBar/FormulaBarMenu.svelte (`<style>`), Menu primitive | ported | 5 | the popover and items are the Menu primitive's; the icon and the formula keep upstream's styles |
| `src/components/FormulaBar/formula-bar.css` | 101 | src/lib/components/FormulaBar/FormulaBar.svelte (`<style>`) | ported | 1 |  |
| `src/components/FormulaHelper/FormulaHelper.stories.tsx` | 137 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/FormulaHelper/FormulaHelper.tsx` | 240 | `src/lib/components/FormulaHelper/FormulaHelper.svelte` | ported | 2 | the collapse button is a Skeleton `btn-icon` with Lucide's `ChevronUp` |
| `src/components/FormulaHelper/formulaCompletion.ts` | 176 | `src/lib/upstream/components/FormulaHelper/formulaCompletion.ts` | carried | 2 | unchanged |
| `src/components/FormulaHelper/formulaHelper.css` | 143 | src/lib/components/FormulaHelper/FormulaHelper.svelte (`<style>`) | ported | 2 |  |
| `src/components/FormulaHelper/functions.json` | 7371 | `src/lib/upstream/components/FormulaHelper/functions.json` | carried | 2 | unchanged |
| `src/components/IconPicker/IconPicker.stories.tsx` | 156 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/IconPicker/IconPicker.tsx` | 160 | `src/lib/components/IconPicker/IconPicker.svelte`, `iconSpec.ts` | ported | 4 | the icon list and `iconSpecFor` are plain TypeScript in `iconSpec.ts`; the grid buttons report the selected icon as pressed; the icon set rules use it since phase 5 |
| `src/components/IconPicker/icon-picker.css` | 48 | src/lib/components/IconPicker/IconPicker.svelte (`<style>`) | ported | 4 | the grid gets a z-index so it shows above the drawer |
| `src/components/Input/Input.stories.tsx` | 200 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Input/Input.tsx` | 215 | `src/lib/components/Input/Input.svelte` | ported | 3 | Skeleton `label`, `input` and `input-group` classes; `value` and `ref` are bindable instead of `onChange` and a forwarded ref; the number input's stepper is kept |
| `src/components/Input/input.css` | 223 | Skeleton `input` and `input-group` classes | ported | 3 | replaced by the Skeleton classes |
| `src/components/LinkDialog/LinkDialog.tsx` | 375 | `src/lib/components/LinkDialog/LinkDialog.svelte` | ported | 4 | on `ModalDialog.svelte` (Escape, the Tab trap and Ctrl/Cmd+Enter); the main field of the tab shown takes the focus, as upstream's autoFocus |
| `src/components/LinkDialog/link-dialog.css` | 19 | src/lib/components/LinkDialog/LinkDialog.svelte (`<style>`) | ported | 4 |  |
| `src/components/LinkDialog/util.ts` | 120 | `src/lib/upstream/components/LinkDialog/util.ts` | carried | 1 | unchanged |
| `src/components/Menu/Menu.stories.tsx` | 377 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Menu/Menu.tsx` | 176 | `src/lib/components/Menu/Menu.svelte`, `menuContext.ts` | ported | 3 | a Skeleton `Menu`, controlled at a point (`positioning.getAnchorRect`) or opened by a trigger snippet that spreads the trigger attributes; items report their clicks through a per-menu handler registry, as zag reports a selection by value |
| `src/components/Menu/MenuDivider.tsx` | 5 | `src/lib/components/Menu/MenuDivider.svelte` | ported | 3 | Skeleton `Menu.Separator` |
| `src/components/Menu/MenuItem.tsx` | 240 | `src/lib/components/Menu/MenuItem.svelte`, `MenuItemWithSubmenu.svelte` | ported | 3 | Skeleton `Menu.Item`; the submenu is a nested Skeleton `Menu` (zag handles the hover intent and the keys) |
| `src/components/Menu/menu.css` | 104 | src/lib/components/Menu/Menu.svelte, MenuItem.svelte, MenuDivider.svelte (`<style>`) | ported | 3 | the hover and focus states key on zag's `data-highlighted` |
| `src/components/Menu/useAnchorPosition.ts` | 72 | Skeleton `Menu` positioning | ported | 3 | replaced by Skeleton's positioner, which also flips to stay in the viewport |
| `src/components/Menu/useMenuKeyDown.ts` | 72 | Skeleton `Menu` keyboard handling | ported | 3 | replaced by Skeleton's menu keys (arrows, Home/End, typeahead, Escape, ArrowLeft/Right for submenus) |
| `src/components/Modal/Alert.tsx` | 76 | `src/lib/components/Modal/Alert.svelte` | ported | 2 / 3 | pulled forward to phase 2 for the editing errors; built on `ModalDialog.svelte` since phase 3 |
| `src/components/Modal/Confirm.tsx` | 96 | `src/lib/components/Modal/Confirm.svelte` | ported | 3 | on `ModalDialog.svelte`; exported, as upstream |
| `src/components/Modal/Modal.stories.tsx` | 96 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Modal/ModalDialog.tsx` | 54 | `src/lib/components/Modal/ModalDialog.svelte` | ported | 3 | a Skeleton `Dialog` portaled into the `.ic-root`; it also holds the header (title, close button) and the footer the three dialogs share |
| `src/components/Modal/Prompt.tsx` | 124 | `src/lib/components/Modal/Prompt.svelte` | ported | 3 | on `ModalDialog.svelte`; Enter in the field moves to the submit button and Escape closes, as upstream |
| `src/components/Modal/index.ts` | 3 |  | not ported | - | re-export only |
| `src/components/Modal/modal-dialog.css` | 73 | src/lib/components/Modal/ModalDialog.svelte (Skeleton `card` classes) | ported | 3 | replaced by Skeleton classes |
| `src/components/Modal/useModalFocus.ts` | 31 | Skeleton `Dialog` | ported | 3 | replaced by the Skeleton dialog's initial focus and focus restoring |
| `src/components/Modal/useModalKeyDown.ts` | 50 | Skeleton `Dialog`, src/lib/components/Modal/ModalDialog.svelte | ported | 3 | Escape and the Tab trap come from the Skeleton dialog; Ctrl/Cmd+Enter confirms in `ModalDialog.svelte` |
| `src/components/README.md` | 11 |  | not ported | - | upstream documentation |
| `src/components/RightDrawer/ConditionalFormatting/ClassicRule.tsx` | 371 | `src/lib/components/RightDrawer/ConditionalFormatting/ClassicRule.svelte`, `ApplyToField.svelte`, `UseSelectionButton.svelte` | ported | 5 | the "Apply to" section and the "use selection" button the four editors repeat upstream are components |
| `src/components/RightDrawer/ConditionalFormatting/ColorScaleRule.tsx` | 417 | `src/lib/components/RightDrawer/ConditionalFormatting/ColorScaleRule.svelte`, `StopRow.svelte`, `colorScale.ts` | ported | 5 | the presets, stop types and gradients are plain TypeScript in `colorScale.ts`; the presets are labelled with their id |
| `src/components/RightDrawer/ConditionalFormatting/ConditionalFormatting.tsx` | 639 | `src/lib/components/RightDrawer/ConditionalFormatting/ConditionalFormatting.svelte`, `ruleData.ts` | ported | 5 | the reorder slide commits with Svelte's `flushSync` where upstream uses React's; the animation is matched by name prefix, as Svelte scopes keyframes |
| `src/components/RightDrawer/ConditionalFormatting/DataBarsRule.tsx` | 493 | `src/lib/components/RightDrawer/ConditionalFormatting/DataBarsRule.svelte`, `DataBarMiniChart.svelte`, `dataBars.ts` | ported | 5 | the data and colors are plain TypeScript in `dataBars.ts` |
| `src/components/RightDrawer/ConditionalFormatting/EditRule.tsx` | 269 | `src/lib/components/RightDrawer/ConditionalFormatting/EditRule.svelte`, `ruleData.ts` | ported | 5 | `RuleData` is in `ruleData.ts` |
| `src/components/RightDrawer/ConditionalFormatting/FormatStylePicker.tsx` | 217 | `src/lib/components/RightDrawer/ConditionalFormatting/FormatStylePicker.svelte`, `formatStyle.ts` | ported | 5 | `FormatStyle` and the presets are in `formatStyle.ts` |
| `src/components/RightDrawer/ConditionalFormatting/IconSetsRule.tsx` | 901 | `src/lib/components/RightDrawer/ConditionalFormatting/IconSetsRule.svelte`, `iconSets.ts` | ported | 5 | the presets (Lucide Svelte icons, an icon's extra style as a CSS string), thresholds and data types are plain TypeScript in `iconSets.ts` |
| `src/components/RightDrawer/ConditionalFormatting/cfRuleMapping.ts` | 803 | `src/lib/components/RightDrawer/ConditionalFormatting/cfRuleMapping.ts` | ported | 5 | unchanged but for the type imports, which upstream takes from its React components; not carried for that reason |
| `src/components/RightDrawer/ConditionalFormatting/conditional-formatting.css` | 278 | src/lib/components/RightDrawer/ConditionalFormatting/ConditionalFormatting.svelte (`<style>`), DrawerHeader.svelte | ported | 5 |  |
| `src/components/RightDrawer/ConditionalFormatting/edit-rule.css` | 338 | src/lib/components/RightDrawer/ConditionalFormatting/EditRule.svelte (`<style>`, shared by the four editors), DataBarsRule.svelte, IconSetsRule.svelte, SwatchButton.svelte | ported | 5 |  |
| `src/components/RightDrawer/ConditionalFormatting/format-style-picker.css` | 88 | src/lib/components/RightDrawer/ConditionalFormatting/FormatStylePicker.svelte, EditRule.svelte (`<style>`) | ported | 5 | the presets' rules, which the other editors share, are EditRule's |
| `src/components/RightDrawer/ConditionalFormatting/ruleDescription.ts` | 111 | `src/lib/components/RightDrawer/ConditionalFormatting/ruleDescription.ts` | ported | 5 | unchanged but for `t`, the widget's lookup instead of i18next's `TFunction` |
| `src/components/RightDrawer/NamedRanges/EditNamedRange.tsx` | 277 | `src/lib/components/RightDrawer/NamedRanges/EditNamedRange.svelte` | ported | 5 | the scope options are the Select's strings, with a snippet for the workbook scope |
| `src/components/RightDrawer/NamedRanges/NamedRanges.tsx` | 389 | `src/lib/components/RightDrawer/NamedRanges/NamedRanges.svelte` | ported | 5 |  |
| `src/components/RightDrawer/NamedRanges/edit-name-range.css` | 101 | src/lib/components/RightDrawer/NamedRanges/EditNamedRange.svelte (`<style>`) | ported | 5 |  |
| `src/components/RightDrawer/NamedRanges/named-ranges.css` | 218 | src/lib/components/RightDrawer/NamedRanges/NamedRanges.svelte (`<style>`), DrawerHeader.svelte | ported | 5 |  |
| `src/components/RightDrawer/NamedStyles/EditNamedStyle.tsx` | 868 | `src/lib/components/RightDrawer/NamedStyles/EditNamedStyle.svelte` | ported | 5 | the line style menu is the Menu primitive with a trigger snippet; the line previews are the border picker's, made global |
| `src/components/RightDrawer/NamedStyles/ManageCustomStyles.tsx` | 71 | `src/lib/components/RightDrawer/NamedStyles/ManageCustomStyles.svelte` | ported | 5 |  |
| `src/components/RightDrawer/NamedStyles/NamedStylesPanel.tsx` | 399 | `src/lib/components/RightDrawer/NamedStyles/NamedStylesPanel.svelte` | ported | 5 |  |
| `src/components/RightDrawer/NamedStyles/edit-named-style.css` | 162 | src/lib/components/RightDrawer/NamedStyles/EditNamedStyle.svelte (`<style>`), SwatchButton.svelte | ported | 5 |  |
| `src/components/RightDrawer/NamedStyles/named-styles-utils.ts` | 150 | `src/lib/components/RightDrawer/NamedStyles/namedStylesUtils.ts` | ported | 5 | the styles are inline CSS strings with the same properties and values, where upstream returns React's `CSSProperties` |
| `src/components/RightDrawer/NamedStyles/named-styles.css` | 247 | src/lib/components/RightDrawer/NamedStyles/NamedStylesPanel.svelte, ManageCustomStyles.svelte (`<style>`), DrawerHeader.svelte | ported | 5 |  |
| `src/components/RightDrawer/RegionalSettings/RegionalSettings.tsx` | 198 | `src/lib/components/RightDrawer/RegionalSettings/RegionalSettings.svelte`, `regionalSettings.ts` | ported | 5 | the locale names and format examples are plain TypeScript in `regionalSettings.ts`, which the sheet tab bar reads too |
| `src/components/RightDrawer/RegionalSettings/regional-settings.css` | 105 | src/lib/components/RightDrawer/RegionalSettings/RegionalSettings.svelte (`<style>`), DrawerHeader.svelte | ported | 5 |  |
| `src/components/RightDrawer/RightDrawer.tsx` | 251 | `src/lib/components/RightDrawer/RightDrawer.svelte`, `DrawerHeader.svelte`, `SwatchButton.svelte` | ported | 5 | rendered by the workbook only while open; the width is measured from the workbook's right edge and the handle captures the pointer, where upstream measures from the window's right edge and sets the cursor and `user-select` on `document.body`; the header the sections repeat upstream is `DrawerHeader.svelte` |
| `src/components/RightDrawer/Themes/EditTheme.tsx` | 230 | `src/lib/components/RightDrawer/Themes/EditTheme.svelte`, `ColorField.svelte`, `themeData.ts` | ported | 5 | `ThemeData` is in `themeData.ts` |
| `src/components/RightDrawer/Themes/ThemePreview.tsx` | 62 | `src/lib/components/RightDrawer/Themes/ThemePreview.svelte` | ported | 5 |  |
| `src/components/RightDrawer/Themes/edit-theme.css` | 107 | src/lib/components/RightDrawer/Themes/EditTheme.svelte, ColorField.svelte (`<style>`), SwatchButton.svelte | ported | 5 |  |
| `src/components/RightDrawer/Themes/themeUtils.ts` | 23 | `src/lib/upstream/components/RightDrawer/Themes/themeUtils.ts` | carried | 4 | unchanged; pulled forward from phase 5 for the theme menu |
| `src/components/RightDrawer/Themes/themes.css` | 146 | src/lib/components/RightDrawer/Themes/Themes.svelte, ThemePreview.svelte (`<style>`), DrawerHeader.svelte | ported | 5 |  |
| `src/components/RightDrawer/Themes/themes.tsx` | 199 | `src/lib/components/RightDrawer/Themes/Themes.svelte`, `themeData.ts` | ported | 5 | `themeToThemeData` is in `themeData.ts` |
| `src/components/RightDrawer/rightdrawer.css` | 70 | src/lib/components/RightDrawer/RightDrawer.svelte (`<style>`) | ported | 5 |  |
| `src/components/Select/Select.stories.tsx` | 337 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Select/Select.tsx` | 404 | `src/lib/components/Select/Select.svelte` | ported | 4 | Skeleton has no select (its Combobox is a text field), so upstream's combobox button and listbox are ported; the list stays inside the select (still `position: fixed`) instead of being portaled into the `.ic-root`, so it works inside a Skeleton dialog's focus trap; labels are strings or snippets; not exported, as upstream |
| `src/components/Select/dropdown-menu.css` | 63 | src/lib/components/Select/Select.svelte (`<style>`) | ported | 4 |  |
| `src/components/Select/select.css` | 155 | src/lib/components/Select/Select.svelte (`<style>`) | ported | 4 |  |
| `src/components/SheetTabBar/SheetDeleteModal.tsx` | 33 | `src/lib/components/SheetTabBar/SheetDeleteModal.svelte` | ported | 3 |  |
| `src/components/SheetTabBar/SheetListMenu.tsx` | 68 | src/lib/components/SheetTabBar/SheetTabBar.svelte (`Menu`, `MenuItem`) | ported | 1 / 3 | rebuilt on the Menu primitives in phase 3; when the list opens Skeleton highlights its first sheet, where upstream focuses the selected one |
| `src/components/SheetTabBar/SheetTab.tsx` | 294 | `src/lib/components/SheetTabBar/SheetTab.svelte` | ported | 1 / 3 | selecting and pointing at another sheet (phase 1); renaming in place, the tab menu, the color picker and the delete dialog (phase 3). Closing the menu gives the focus back to its button unless the chosen entry opened the color picker or the delete dialog |
| `src/components/SheetTabBar/SheetTabBar.tsx` | 142 | `src/lib/components/SheetTabBar/SheetTabBar.svelte` | ported | 1 / 3 / 5 | tabs and sheet list (phase 1), the add-sheet button (phase 3) and the regional settings button showing the locale and language (phase 5) |
| `src/components/SheetTabBar/SheetTabMenu.tsx` | 68 | `src/lib/components/SheetTabBar/SheetTabMenu.svelte` | ported | 3 |  |
| `src/components/SheetTabBar/index.ts` | 1 |  | not ported | - | re-export only |
| `src/components/SheetTabBar/sheet-list-menu.css` | 14 | src/lib/components/SheetTabBar/SheetTabBar.svelte (`<style>`) | ported | 1 / 3 |  |
| `src/components/SheetTabBar/sheet-tab-bar.css` | 98 | src/lib/components/SheetTabBar/SheetTabBar.svelte (`<style>`) | ported | 1 / 5 | the regional settings button's styles came with phase 5 |
| `src/components/SheetTabBar/sheet-tab.css` | 108 | src/lib/components/SheetTabBar/SheetTab.svelte (`<style>`) | ported | 1 / 3 | the rename field and menu button styles came with phase 3 |
| `src/components/SheetTabBar/types.ts` | 6 | `src/lib/components/SheetTabBar/types.ts` | ported | 1 | copied unchanged |
| `src/components/Switch/Switch.stories.tsx` | 82 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Switch/Switch.tsx` | 73 | `src/lib/components/Switch/Switch.svelte` | ported | 5 | on Skeleton's `Switch`, the hidden checkbox keeping `role="switch"`; the label is a string or a snippet; exported, as upstream |
| `src/components/Switch/switch.css` | 78 | src/lib/components/Switch/Switch.svelte (`<style>`), Skeleton `Switch` | ported | 5 | the label's weight and dimming are kept; the track and thumb are Skeleton's |
| `src/components/Textarea/Textarea.stories.tsx` | 113 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Textarea/Textarea.tsx` | 103 | `src/lib/components/Textarea/Textarea.svelte` | ported | 3 | Skeleton `label` and `textarea` classes; `value` is bindable; not exported, as upstream |
| `src/components/Textarea/textarea.css` | 128 | Skeleton `textarea` class | ported | 3 | replaced by the Skeleton class |
| `src/components/ThemeMenu/ThemeMenu.tsx` | 76 | `src/lib/components/ThemeMenu/ThemeMenu.svelte` | ported | 4 / 5 | "Manage themes" is disabled without its handler; the workbook gives it one since phase 5 |
| `src/components/ThemeMenu/theme-menu.css` | 20 | src/lib/components/ThemeMenu/ThemeMenu.svelte (`<style>`) | ported | 4 |  |
| `src/components/ToggleButton/ToggleButton.stories.tsx` | 216 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/ToggleButton/ToggleButton.tsx` | 111 | `src/lib/components/ToggleButton/ToggleButton.svelte` | ported | 3 | ghost Buttons in a Skeleton `btn-group`; labels and icons are strings or snippets |
| `src/components/ToggleButton/toggle-button.css` | 64 | Skeleton `btn-group` and presets | ported | 3 | replaced by Skeleton classes |
| `src/components/Toolbar/Toolbar.tsx` | 782 | `src/lib/components/Toolbar/Toolbar.svelte` | ported | 4 / 5 | the drawer buttons (conditional formatting, cell styles) are disabled without their handlers, which the workbook gives since phase 5; the scroll arrows also update when the toolbar is resized; the font size handler is told whether the field keeps the focus (arrow keys) so the workbook does not take it |
| `src/components/Toolbar/toolbar.css` | 127 | src/lib/components/Toolbar/Toolbar.svelte (`<style>`) | ported | 4 | upstream's inline styles of the menu buttons are a class there |
| `src/components/Tooltip/Tooltip.stories.tsx` | 143 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Tooltip/Tooltip.tsx` | 67 | `src/lib/components/Tooltip/Tooltip.svelte` | ported | 3 | Skeleton `Tooltip` over a wrapping span, as upstream |
| `src/components/Tooltip/tooltip.css` | 32 | src/lib/components/Tooltip/Tooltip.svelte (`<style>`) | ported | 3 |  |
| `src/components/Tooltip/useTooltipPosition.ts` | 64 | Skeleton `Tooltip` positioning | ported | 3 | replaced by Skeleton's positioner (above, flipping below) |
| `src/components/Workbook/Workbook.stories.tsx` | 83 | src/routes/+page.svelte (demo) | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Workbook/Workbook.tsx` | 1233 | src/lib/components/Workbook/Workbook.svelte, workbookModel.ts | ported | 1-5 | formula bar, sheet tabs, navigation and edit keys, undo/redo, Delete, the font shortcuts, copy, cut, paste and copy styles (phases 1 and 2), the sheet management handlers and the context menu's cut, copy and paste (phase 3), the toolbar handlers, merging, PNG export and the link dialog (phase 4), the drawer wiring and its handlers (named styles, themes, regional settings; phase 5). Clicking a label inside the widget leaves the focus where it is, where upstream takes it back to the sheet. After a toolbar change the focus goes back to the sheet unless a picker, a dialog or the font size field has it, where upstream refocuses it on every render. A rejected sheet change (a name already taken, ...) shows the engine's error in an Alert where upstream calls `window.alert`; a denied clipboard is titled "Cannot paste" where upstream reuses "Failed to delete cells"; the context menu's Paste reads the clipboard into the paste handler directly instead of dispatching a synthetic paste event |
| `src/components/Workbook/useKeyboardNavigation.ts` | 291 | `src/lib/components/Workbook/keyboardNavigation.ts` | ported | 1 | same key map; the edit keys follow `canEdit` |
| `src/components/Workbook/workbook.css` | 23 | src/lib/components/Workbook/Workbook.svelte (`<style>`) | ported | 1 |  |
| `src/components/Worksheet/ContextMenus/Cell.tsx` | 103 | `src/lib/components/Worksheet/ContextMenus/CellContextMenu.svelte` | ported | 3 |  |
| `src/components/Worksheet/ContextMenus/ColumnHeader.tsx` | 145 | `src/lib/components/Worksheet/ContextMenus/ColumnHeaderContextMenu.svelte` | ported | 3 |  |
| `src/components/Worksheet/ContextMenus/RowHeader.tsx` | 124 | `src/lib/components/Worksheet/ContextMenus/RowHeaderContextMenu.svelte` | ported | 3 |  |
| `src/components/Worksheet/LinkTooltip.tsx` | 144 | `src/lib/components/Worksheet/LinkTooltip.svelte` | ported | 1 / 4 | follow and copy (phase 1), edit and break link (phase 4) |
| `src/components/Worksheet/Worksheet.tsx` | 988 | `src/lib/components/Worksheet/Worksheet.svelte` | ported | 1-4 | canvas, scrolling, selection, resize handles, link tooltip, cell editor, double click to edit, pasting copied styles and the autofill error dialog (phases 1 and 2), the context menus, their error dialog and the column width and row height prompts (phase 3), the link tooltip's edit and delete wiring (phase 4). After a menu or dialog closes the focus goes back to the workbook, where upstream refocuses it on every render |
| `src/components/Worksheet/usePointer.ts` | 390 | `src/lib/components/Worksheet/pointer.ts` | ported | 1 / 2 | the hook becomes a handler factory |
| `src/components/Worksheet/worksheet.css` | 258 | src/lib/components/Worksheet/Worksheet.svelte, LinkTooltip.svelte (`<style>`) | ported | 1 |  |
| `src/components/WorksheetCanvas/cellLinks.ts` | 253 | `src/lib/upstream/components/WorksheetCanvas/cellLinks.ts` | carried | 1 | unchanged |
| `src/components/WorksheetCanvas/cfRenderer.ts` | 264 | `src/lib/upstream/components/WorksheetCanvas/cfRenderer.ts` | carried | 1 | unchanged |
| `src/components/WorksheetCanvas/constants.ts` | 7 | `src/lib/upstream/components/WorksheetCanvas/constants.ts` | carried | 1 | unchanged |
| `src/components/WorksheetCanvas/lucideIconPaths.ts` | 129 | `src/lib/upstream/components/WorksheetCanvas/lucideIconPaths.ts` | carried | 1 | unchanged |
| `src/components/WorksheetCanvas/outlineHandle.ts` | 328 | `src/lib/upstream/components/WorksheetCanvas/outlineHandle.ts` | carried | 1 | unchanged |
| `src/components/WorksheetCanvas/util.ts` | 127 | `src/lib/upstream/components/WorksheetCanvas/util.ts` | carried | 1 | unchanged |
| `src/components/WorksheetCanvas/worksheetCanvas.ts` | 2506 | `src/lib/upstream/components/WorksheetCanvas/worksheetCanvas.ts` | carried | 1 | unchanged |
| `src/components/clipboard.ts` | 2 | `src/lib/upstream/components/clipboard.ts` | carried | 1 | unchanged |
| `src/components/constants.tsx` | 3 |  | not ported | - | nothing upstream imports it; the layout heights are the CSS variables of IronCalc.svelte |
| `src/components/createAnchoredPortal.ts` | 13 | `src/lib/components/rootContext.ts` | ported | 2 | Skeleton `Portal` into the widget's `.ic-root` (the formula helper, the alert) |
| `src/components/types.ts` | 11 | `src/lib/upstream/components/types.ts` | carried | 1 | unchanged |
| `src/components/util.ts` | 322 | `src/lib/upstream/components/util.ts` | carried | 1 | unchanged |
| `src/components/utils/useMenuPosition.ts` | 107 | `src/lib/components/utils/menuPosition.ts` | ported | 2 | the hook becomes a Svelte attachment; the positioning is unchanged |
| `src/components/workbookState.ts` | 199 | `src/lib/upstream/components/workbookState.ts` | carried | 1 | unchanged |
| `src/i18n.ts` | 25 | `src/lib/i18n.ts`, `i18nState.svelte.ts` | ported | 1 / 6 | a lookup over the carried locale files in place of an i18next instance: English only in phase 1, `{{name}}` interpolation since phase 3, i18next's `defaultValue` since phase 5, and since phase 6 the six language codes of upstream with `changeLanguage` and `getLanguage`, the language being reactive state that `t` reads |
| `src/icons/arrow-middle-from-line.svg` | 14 | `src/lib/components/icons/ArrowMiddleFromLine.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-bottom.svg` | 6 | `src/lib/components/icons/BorderBottomIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-center-h.svg` | 4 | `src/lib/components/icons/BorderCenterHIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-center-v.svg` | 4 | `src/lib/components/icons/BorderCenterVIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-inner.svg` | 5 | `src/lib/components/icons/BorderInnerIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-left.svg` | 6 | `src/lib/components/icons/BorderLeftIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-none.svg` | 5 | `src/lib/components/icons/BorderNoneIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-outer.svg` | 5 | `src/lib/components/icons/BorderOuterIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-right.svg` | 6 | `src/lib/components/icons/BorderRightIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/border-top.svg` | 6 | `src/lib/components/icons/BorderTopIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes |
| `src/icons/delete-column.svg` | 10 | `src/lib/components/icons/DeleteColumnIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; nothing upstream uses it |
| `src/icons/delete-row.svg` | 8 | `src/lib/components/icons/DeleteRowIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; nothing upstream uses it |
| `src/icons/fx.svg` | 3 | `src/lib/components/icons/Fx.svelte` | ported | 1 | Lucide has no fx glyph |
| `src/icons/index.ts` | 43 | `src/lib/components/icons/index.ts` | ported | 4 | the same names, as Svelte components |
| `src/icons/insert-column-left.svg` | 7 | `src/lib/components/icons/InsertColumnLeftIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; nothing upstream uses it |
| `src/icons/insert-column-right.svg` | 7 | `src/lib/components/icons/InsertColumnRightIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; nothing upstream uses it |
| `src/icons/insert-row-above.svg` | 7 | `src/lib/components/icons/InsertRowAboveIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; nothing upstream uses it |
| `src/icons/insert-row-below.svg` | 7 | `src/lib/components/icons/InsertRowBelow.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; nothing upstream uses it |
| `src/icons/ironcalc_icon.svg` | 7 | `src/lib/components/icons/IronCalcIcon.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; exported, as upstream |
| `src/icons/ironcalc_icon_white.svg` | 7 | `src/lib/components/icons/IronCalcIconWhite.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; exported, as upstream |
| `src/icons/orange+black.svg` | 8 | `src/lib/components/icons/IronCalcLogo.svelte` | ported | 4 | the SVG unchanged, with `aria-hidden` and the caller's attributes; exported, as upstream |
| `src/index.css` | 18 | src/lib/components/IronCalc.svelte (`<style>`) | ported | 1 |  |
| `src/index.ts` | 45 | `src/lib/index.ts` | ported | 1 / 3 / 4 / 5 / 6 | exports the widget, `init`, `Model`, the theme helpers, (phase 3) the UI primitives upstream exports: `Button`, `IconButton`, `Checkbox`, `Input`, `Menu`, `MenuItem`, `MenuItemWithSubmenu`, `MenuDivider`, `Confirm`, `ToggleButton`, `Tooltip` and their property types, (phase 4) the logos `IronCalcIcon`, `IronCalcIconWhite` and `IronCalcLogo`, (phase 5) `Switch` and `SwitchProperties`, and (phase 6) the `IronCalcHandle` type; `init` starts only the engine, as the translation lookup needs no set-up where upstream's awaits `i18n.init()`. It also exports `Workbook`, `WorkbookState` and the theme setters upstream keeps internal |
| `src/locale/de_de.json` | 460 | `src/lib/upstream/locale/de_de.json` | carried | 6 | unchanged |
| `src/locale/en_us.json` | 460 | `src/lib/upstream/locale/en_us.json` | carried | 1 | unchanged; the reference locale of the lint |
| `src/locale/es_es.json` | 460 | `src/lib/upstream/locale/es_es.json` | carried | 6 | unchanged |
| `src/locale/fr_fr.json` | 460 | `src/lib/upstream/locale/fr_fr.json` | carried | 6 | unchanged |
| `src/locale/it_it.json` | 460 | `src/lib/upstream/locale/it_it.json` | carried | 6 | unchanged |
| `src/theme/README.md` | 6 |  | not ported | - | upstream documentation |
| `src/theme/index.ts` | 7 | `src/lib/upstream/theme/index.ts` | carried | 1 | unchanged |
| `src/theme/theme.css` | 97 | `src/lib/upstream/theme/theme.css` | carried | 1 | unchanged |
| `src/theme/theme.ts` | 181 | `src/lib/upstream/theme/theme.ts` | carried | 1 | unchanged |
| `src/theme/themeVariables.ts` | 77 | `src/lib/upstream/theme/themeVariables.ts` | carried | 1 | unchanged |
| `src/vite-env.d.ts` | 2 | `src/app.d.ts` | ported | 1 |  |
