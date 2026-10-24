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
4. **planned**: not ported yet; the phase column says when.
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
| Paste and cut, autofill handle, copy styles (format painter) | `Workbook.tsx`, `outlineHandle.ts` | ported (the format painter is the `copyStyles()` method of `Workbook` until the toolbar button lands in phase 4; pasting from the context menu comes with it in phase 3) | 2 |
| Context menus: insert, delete, move, hide and freeze rows and columns; set width and height | `Worksheet/ContextMenus/`, `Worksheet.tsx` | planned | 3 |
| Sheet management: add, rename, color, duplicate, hide, move, delete | `SheetTabBar/` | planned | 3 |
| Alert, confirm and prompt dialogs | `Modal/` | partial (the alert, used by editing errors, came with phase 2) | 2 / 3 |
| Toolbar: undo/redo, font, size, colors, alignment, wrap, borders, merge, number formats, grid lines, clear formatting, PNG export | `Toolbar/`, pickers | planned | 4 |
| Links: insert and edit dialog | `LinkDialog/` | planned | 4 |
| Workbook themes menu | `ThemeMenu/` | planned | 4 |
| Named ranges (drawer and address-box menu) | `RightDrawer/NamedRanges/`, `FormulaBar/FormulaBarMenu.tsx` | planned | 5 |
| Named styles | `RightDrawer/NamedStyles/` | planned | 5 |
| Conditional formatting rules editor | `RightDrawer/ConditionalFormatting/` | planned | 5 |
| Theme editor | `RightDrawer/Themes/` | planned | 5 |
| Regional settings (locale, timezone, language) | `RightDrawer/RegionalSettings/` | planned | 5 |
| Translations (de, en, es, fr, it) and `setLanguage` | `locale/`, `i18n.ts`, `IronCalc.tsx` | planned | 6 |

## 4. Phases

### 4.1 Phase 1: read-only sheet (landed)

The package scaffold, the carried renderer, and a read-only `IronCalc` widget: canvas, scrolling, selection, frozen panes, merged cells, sheet tabs, a read-only formula bar, link tooltips, copy, theme variables, and xlsx load and save helpers. The demo app opens a user-chosen .xlsx file.

### 4.2 Phase 2: editing and the cell editor (landed)

Port `Editor/` (the shared cell and formula-bar editor, its key handling and formula highlighting), the rest of `Editor/util.tsx` (carried where it is plain TypeScript, with `getFormulaHTML` rewritten for Svelte), `FormulaHelper/` with `functions.json` and `formulaCompletion.ts`, and the editing branches of `usePointer.ts` (pointing at cells to insert references). Wire the edit keys, undo/redo, Delete, paste and cut, the autofill handle and copy styles in `Workbook`, and add the `canEdit` prop (default true, like upstream). Port upstream's unit tests that cover these helpers (`getFormulaHTML`, `isInReferenceMode`, `applyListCompletion`, `snapFillExtent`).

As landed: the plain-TypeScript parts are carried (`formulaCompletion.ts`, `functions.json`, everything of `Editor/util.tsx` but `getFormulaHTML`), `getFormulaHTML` returns plain segments that `Editor.svelte` renders instead of JSX, and the alert dialog was pulled forward from phase 3 because the editing errors (formula, paste, delete, autofill) need it. The four tests, plus upstream's `docsUrl` test of the same module, live in `tests/upstream/` and differ from upstream only in import paths, the engine set-up and, for `getFormulaHTML`, the helpers that read a segment instead of a React element. The demo app edits the chosen workbook and downloads it as xlsx, and has a read-only switch.

### 4.3 Phase 3: structure, menus and dialogs

The worksheet context menus (cell, column header, row header), the column width and row height prompts, the sheet tab menu, renaming, coloring and deleting sheets, the add-sheet button, and the alert, confirm and prompt dialogs. The shared primitives they need (`Button`, `IconButton`, `Menu`, `MenuItem`, `Tooltip`, `Input`, `Checkbox`, `Textarea`) map to Skeleton components and classes rather than being re-implemented; the public exports upstream offers for them are added as thin Svelte components where consumers rely on them.

### 4.4 Phase 4: toolbar and formatting pickers

The toolbar and everything it opens: the color picker and advanced color picker, the border picker, the number format menu, the icon picker, the theme menu, merge options, PNG export, and the link dialog. Upstream's custom SVG icons become Svelte icon components where Lucide has no match.

### 4.5 Phase 5: the right drawer

The drawer shell and its sections: named ranges (with the formula bar address menu), named styles, conditional formatting rules, the theme editor and regional settings.

### 4.6 Phase 6: internationalization

The five upstream locales, a Svelte-friendly translation store replacing the English lookup, the `setLanguage` handle of the widget, and a port of upstream's locale lint.

## 5. File map

Paths are relative to upstream's `webapp/IronCalc/` and to this repository's root. Line counts are upstream's.

| Upstream file | Lines | Svelte counterpart | Status | Phase | Notes |
| --- | --- | --- | --- | --- | --- |
| `src/IronCalc.tsx` | 76 | `src/lib/components/IronCalc.svelte` | ported | 1 / 2 | the widget's own element is the `.ic-root` (upstream defaults to `document.body`); `canEdit` came with phase 2, the `setLanguage` handle comes with phase 6 |
| `src/components/AdvancedColorPicker.tsx/AdvancedColorPicker.tsx` | 233 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/AdvancedColorPicker.tsx/advanced-color-picker.css` | 135 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/AdvancedColorPicker.tsx/useKeyDown.ts` | 54 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/BorderPicker/BorderPicker.tsx` | 361 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/BorderPicker/LineStylePicker.tsx` | 46 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/BorderPicker/border-picker.css` | 75 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/BorderPicker/line-style-picker.css` | 88 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/Button/Button.stories.tsx` | 177 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Button/Button.tsx` | 75 |  | planned | 3 | Skeleton `btn` classes / `SegmentedControl` |
| `src/components/Button/IconButton.stories.tsx` | 198 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Button/IconButton.tsx` | 60 |  | planned | 3 | Skeleton `btn` classes / `SegmentedControl` |
| `src/components/Button/button.css` | 156 |  | planned | 3 | Skeleton `btn` classes / `SegmentedControl` |
| `src/components/Checkbox/Checkbox.stories.tsx` | 80 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Checkbox/Checkbox.tsx` | 69 |  | planned | 3 | Skeleton form classes |
| `src/components/Checkbox/checkbox.css` | 76 |  | planned | 3 | Skeleton form classes |
| `src/components/ColorPicker/ColorPicker.stories.tsx` | 105 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/ColorPicker/ColorPicker.tsx` | 316 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/ColorPicker/color-picker.css` | 172 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/ColorPicker/useAnchorPosition.ts` | 104 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/ColorPicker/useKeyDown.ts` | 159 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/ColorPicker/util.ts` | 128 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/Editor/Editor.stories.tsx` | 108 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Editor/Editor.tsx` | 444 | `src/lib/components/Editor/Editor.svelte` | ported | 2 | the caret is tracked on keyup, mouseup and select (upstream relies on React's onSelect, which also fires on caret moves); the worksheet also asks the editor to fit its box right before positioning it, as React's child-first effects do upstream |
| `src/components/Editor/editor.css` | 36 | src/lib/components/Editor/Editor.svelte (`<style>`) | ported | 2 | upstream's inline styles are classes there too |
| `src/components/Editor/useKeyDown.ts` | 717 | `src/lib/components/Editor/editorKeyDown.ts` | ported | 2 | the hook becomes a handler factory; the key map is unchanged |
| `src/components/Editor/util.tsx` | 448 | `src/lib/upstream/components/Editor/util.ts`, `src/lib/components/Editor/formulaHTML.ts` | carried / ported | 1 / 2 | everything but `getFormulaHTML` is carried verbatim; `getFormulaHTML` and its private helpers are ported, returning segments instead of JSX |
| `src/components/FormatMenu/FormatMenu.tsx` | 177 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/FormatMenu/FormatPicker.tsx` | 30 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/FormatMenu/format-menu.css` | 13 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/FormatMenu/formatUtil.ts` | 42 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/FormulaBar/FormulaBar.tsx` | 118 | `src/lib/components/FormulaBar/FormulaBar.svelte` | partial | 1 / 5 | address and formula editor ported; the address box is a plain label until the named-ranges menu (phase 5) |
| `src/components/FormulaBar/FormulaBarMenu.tsx` | 198 |  | planned | 5 | named-ranges menu behind the address box |
| `src/components/FormulaBar/formula-bar-menu.css` | 105 |  | planned | 5 | named-ranges menu behind the address box |
| `src/components/FormulaBar/formula-bar.css` | 101 | src/lib/components/FormulaBar/FormulaBar.svelte (`<style>`) | ported | 1 |  |
| `src/components/FormulaHelper/FormulaHelper.stories.tsx` | 137 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/FormulaHelper/FormulaHelper.tsx` | 240 | `src/lib/components/FormulaHelper/FormulaHelper.svelte` | ported | 2 | the collapse button is a Skeleton `btn-icon` with Lucide's `ChevronUp` |
| `src/components/FormulaHelper/formulaCompletion.ts` | 176 | `src/lib/upstream/components/FormulaHelper/formulaCompletion.ts` | carried | 2 | unchanged |
| `src/components/FormulaHelper/formulaHelper.css` | 143 | src/lib/components/FormulaHelper/FormulaHelper.svelte (`<style>`) | ported | 2 |  |
| `src/components/FormulaHelper/functions.json` | 7371 | `src/lib/upstream/components/FormulaHelper/functions.json` | carried | 2 | unchanged |
| `src/components/IconPicker/IconPicker.stories.tsx` | 156 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/IconPicker/IconPicker.tsx` | 160 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/IconPicker/icon-picker.css` | 48 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/Input/Input.stories.tsx` | 200 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Input/Input.tsx` | 215 |  | planned | 3 | Skeleton form classes |
| `src/components/Input/input.css` | 223 |  | planned | 3 | Skeleton form classes |
| `src/components/LinkDialog/LinkDialog.tsx` | 375 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/LinkDialog/link-dialog.css` | 19 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/LinkDialog/util.ts` | 120 | `src/lib/upstream/components/LinkDialog/util.ts` | carried | 1 | unchanged |
| `src/components/Menu/Menu.stories.tsx` | 377 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Menu/Menu.tsx` | 176 |  | planned | 3 | Skeleton `Menu` |
| `src/components/Menu/MenuDivider.tsx` | 5 |  | planned | 3 | Skeleton `Menu` |
| `src/components/Menu/MenuItem.tsx` | 240 |  | planned | 3 | Skeleton `Menu` |
| `src/components/Menu/menu.css` | 104 |  | planned | 3 | Skeleton `Menu` |
| `src/components/Menu/useAnchorPosition.ts` | 72 |  | planned | 3 | Skeleton `Menu` |
| `src/components/Menu/useMenuKeyDown.ts` | 72 |  | planned | 3 | Skeleton `Menu` |
| `src/components/Modal/Alert.tsx` | 76 | `src/lib/components/Modal/Alert.svelte` | ported | 2 | a Skeleton `Dialog`, which brings the focus trap, Escape and focus restoring of `ModalDialog`, `useModalFocus` and `useModalKeyDown`; pulled forward from phase 3 for the editing errors |
| `src/components/Modal/Confirm.tsx` | 96 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/Modal/Modal.stories.tsx` | 96 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Modal/ModalDialog.tsx` | 54 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/Modal/Prompt.tsx` | 124 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/Modal/index.ts` | 3 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/Modal/modal-dialog.css` | 73 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/Modal/useModalFocus.ts` | 31 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/Modal/useModalKeyDown.ts` | 50 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/README.md` | 11 |  | not ported | - | upstream documentation |
| `src/components/RightDrawer/ConditionalFormatting/ClassicRule.tsx` | 371 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/ColorScaleRule.tsx` | 417 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/ConditionalFormatting.tsx` | 639 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/DataBarsRule.tsx` | 493 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/EditRule.tsx` | 269 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/FormatStylePicker.tsx` | 217 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/IconSetsRule.tsx` | 901 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/cfRuleMapping.ts` | 803 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/conditional-formatting.css` | 278 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/edit-rule.css` | 338 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/format-style-picker.css` | 88 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/ConditionalFormatting/ruleDescription.ts` | 111 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedRanges/EditNamedRange.tsx` | 277 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedRanges/NamedRanges.tsx` | 389 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedRanges/edit-name-range.css` | 101 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedRanges/named-ranges.css` | 218 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedStyles/EditNamedStyle.tsx` | 868 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedStyles/ManageCustomStyles.tsx` | 71 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedStyles/NamedStylesPanel.tsx` | 399 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedStyles/edit-named-style.css` | 162 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedStyles/named-styles-utils.ts` | 150 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/NamedStyles/named-styles.css` | 247 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/RegionalSettings/RegionalSettings.tsx` | 198 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/RegionalSettings/regional-settings.css` | 105 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/RightDrawer.tsx` | 251 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/Themes/EditTheme.tsx` | 230 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/Themes/ThemePreview.tsx` | 62 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/Themes/edit-theme.css` | 107 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/Themes/themeUtils.ts` | 23 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/Themes/themes.css` | 146 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/Themes/themes.tsx` | 199 |  | planned | 5 | right drawer |
| `src/components/RightDrawer/rightdrawer.css` | 70 |  | planned | 5 | right drawer |
| `src/components/Select/Select.stories.tsx` | 337 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Select/Select.tsx` | 404 |  | planned | 4 | Skeleton `Combobox` / native select |
| `src/components/Select/dropdown-menu.css` | 63 |  | planned | 4 | Skeleton `Combobox` / native select |
| `src/components/Select/select.css` | 155 |  | planned | 4 | Skeleton `Combobox` / native select |
| `src/components/SheetTabBar/SheetDeleteModal.tsx` | 33 |  | planned | 3 | Skeleton `Dialog` |
| `src/components/SheetTabBar/SheetListMenu.tsx` | 68 | src/lib/components/SheetTabBar/SheetTabBar.svelte (Skeleton `Menu`) | ported | 1 |  |
| `src/components/SheetTabBar/SheetTab.tsx` | 294 | `src/lib/components/SheetTabBar/SheetTab.svelte` | partial | 1 / 3 | selecting, and keeping the editor focused while pointing at another sheet, ported; rename, tab menu and color picker in phase 3 |
| `src/components/SheetTabBar/SheetTabBar.tsx` | 142 | `src/lib/components/SheetTabBar/SheetTabBar.svelte` | partial | 1 / 3 | tabs and sheet list ported; add-sheet button in phase 3, regional settings button in phase 5 |
| `src/components/SheetTabBar/SheetTabMenu.tsx` | 68 |  | planned | 3 | Skeleton `Menu` |
| `src/components/SheetTabBar/index.ts` | 1 |  | not ported | - | re-export only |
| `src/components/SheetTabBar/sheet-list-menu.css` | 14 | src/lib/components/SheetTabBar/SheetTabBar.svelte (`<style>`) | ported | 1 |  |
| `src/components/SheetTabBar/sheet-tab-bar.css` | 98 | src/lib/components/SheetTabBar/SheetTabBar.svelte (`<style>`) | ported | 1 |  |
| `src/components/SheetTabBar/sheet-tab.css` | 108 | src/lib/components/SheetTabBar/SheetTab.svelte (`<style>`) | partial | 1 / 3 | rename-input styles come with renaming |
| `src/components/SheetTabBar/types.ts` | 6 | `src/lib/components/SheetTabBar/types.ts` | ported | 1 | copied unchanged |
| `src/components/Switch/Switch.stories.tsx` | 82 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Switch/Switch.tsx` | 73 |  | planned | 5 | Skeleton `Switch` |
| `src/components/Switch/switch.css` | 78 |  | planned | 5 | Skeleton `Switch` |
| `src/components/Textarea/Textarea.stories.tsx` | 113 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Textarea/Textarea.tsx` | 103 |  | planned | 3 | Skeleton form classes |
| `src/components/Textarea/textarea.css` | 128 |  | planned | 3 | Skeleton form classes |
| `src/components/ThemeMenu/ThemeMenu.tsx` | 76 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/ThemeMenu/theme-menu.css` | 20 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/ToggleButton/ToggleButton.stories.tsx` | 216 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/ToggleButton/ToggleButton.tsx` | 111 |  | planned | 3 | Skeleton `btn` classes / `SegmentedControl` |
| `src/components/ToggleButton/toggle-button.css` | 64 |  | planned | 3 | Skeleton `btn` classes / `SegmentedControl` |
| `src/components/Toolbar/Toolbar.tsx` | 782 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/Toolbar/toolbar.css` | 127 |  | planned | 4 | toolbar and formatting pickers |
| `src/components/Tooltip/Tooltip.stories.tsx` | 143 |  | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Tooltip/Tooltip.tsx` | 67 |  | planned | 3 | Skeleton `Tooltip` |
| `src/components/Tooltip/tooltip.css` | 32 |  | planned | 3 | Skeleton `Tooltip` |
| `src/components/Tooltip/useTooltipPosition.ts` | 64 |  | planned | 3 | Skeleton `Tooltip` |
| `src/components/Workbook/Workbook.stories.tsx` | 83 | src/routes/+page.svelte (demo) | not ported | - | Storybook story; the demo app plays this role |
| `src/components/Workbook/Workbook.tsx` | 1233 | src/lib/components/Workbook/Workbook.svelte, workbookModel.ts | partial | 1 / 2-5 | formula bar, sheet tabs, navigation and edit keys, undo/redo, Delete, the font shortcuts, copy, cut, paste and copy styles ported; the context menu's clipboard paste (phase 3), the toolbar handlers, merging, PNG export and the link dialog (phase 4) and the drawer wiring (phase 5) planned |
| `src/components/Workbook/useKeyboardNavigation.ts` | 291 | `src/lib/components/Workbook/keyboardNavigation.ts` | ported | 1 | same key map; the edit keys follow `canEdit` |
| `src/components/Workbook/workbook.css` | 23 | src/lib/components/Workbook/Workbook.svelte (`<style>`) | ported | 1 |  |
| `src/components/Worksheet/ContextMenus/Cell.tsx` | 103 |  | planned | 3 | Skeleton `Menu` (context trigger) |
| `src/components/Worksheet/ContextMenus/ColumnHeader.tsx` | 145 |  | planned | 3 | Skeleton `Menu` (context trigger) |
| `src/components/Worksheet/ContextMenus/RowHeader.tsx` | 124 |  | planned | 3 | Skeleton `Menu` (context trigger) |
| `src/components/Worksheet/LinkTooltip.tsx` | 144 | `src/lib/components/Worksheet/LinkTooltip.svelte` | partial | 1 / 4 | follow and copy ported; edit and break-link actions come with the link dialog |
| `src/components/Worksheet/Worksheet.tsx` | 988 | `src/lib/components/Worksheet/Worksheet.svelte` | partial | 1 / 3 | canvas, scrolling, selection, resize handles, link tooltip, cell editor, double click to edit, pasting copied styles and the autofill error dialog ported; context menus and the size dialogs planned (phase 3) |
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
| `src/i18n.ts` | 25 | `src/lib/i18n.ts` | partial | 1 / 6 | English lookup over the carried `en_us.json`; language switching in phase 6 |
| `src/icons/arrow-middle-from-line.svg` | 14 |  | planned | 4 | icon component |
| `src/icons/border-bottom.svg` | 6 |  | planned | 4 | icon component |
| `src/icons/border-center-h.svg` | 4 |  | planned | 4 | icon component |
| `src/icons/border-center-v.svg` | 4 |  | planned | 4 | icon component |
| `src/icons/border-inner.svg` | 5 |  | planned | 4 | icon component |
| `src/icons/border-left.svg` | 6 |  | planned | 4 | icon component |
| `src/icons/border-none.svg` | 5 |  | planned | 4 | icon component |
| `src/icons/border-outer.svg` | 5 |  | planned | 4 | icon component |
| `src/icons/border-right.svg` | 6 |  | planned | 4 | icon component |
| `src/icons/border-top.svg` | 6 |  | planned | 4 | icon component |
| `src/icons/delete-column.svg` | 10 |  | planned | 4 | icon component |
| `src/icons/delete-row.svg` | 8 |  | planned | 4 | icon component |
| `src/icons/fx.svg` | 3 | `src/lib/components/icons/Fx.svelte` | ported | 1 | Lucide has no fx glyph |
| `src/icons/index.ts` | 43 |  | planned | 4 | custom icons (borders, insert/delete row and column, logos) as Svelte components where Lucide has no match |
| `src/icons/insert-column-left.svg` | 7 |  | planned | 4 | icon component |
| `src/icons/insert-column-right.svg` | 7 |  | planned | 4 | icon component |
| `src/icons/insert-row-above.svg` | 7 |  | planned | 4 | icon component |
| `src/icons/insert-row-below.svg` | 7 |  | planned | 4 | icon component |
| `src/icons/ironcalc_icon.svg` | 7 |  | planned | 4 | icon component |
| `src/icons/ironcalc_icon_white.svg` | 7 |  | planned | 4 | icon component |
| `src/icons/orange+black.svg` | 8 |  | planned | 4 | icon component |
| `src/index.css` | 18 | src/lib/components/IronCalc.svelte (`<style>`) | ported | 1 |  |
| `src/index.ts` | 45 | `src/lib/index.ts` | partial | 1 / 4 | exports the widget, `init`, `Model` and theme helpers; the UI primitives upstream exports (Button, Menu, ...) follow when ported |
| `src/locale/de_de.json` | 460 |  | planned | 6 | i18n |
| `src/locale/en_us.json` | 460 | `src/lib/upstream/locale/en_us.json` | carried | 1 | unchanged; English strings for phase 1 |
| `src/locale/es_es.json` | 460 |  | planned | 6 | i18n |
| `src/locale/fr_fr.json` | 460 |  | planned | 6 | i18n |
| `src/locale/it_it.json` | 460 |  | planned | 6 | i18n |
| `src/theme/README.md` | 6 |  | not ported | - | upstream documentation |
| `src/theme/index.ts` | 7 | `src/lib/upstream/theme/index.ts` | carried | 1 | unchanged |
| `src/theme/theme.css` | 97 | `src/lib/upstream/theme/theme.css` | carried | 1 | unchanged |
| `src/theme/theme.ts` | 181 | `src/lib/upstream/theme/theme.ts` | carried | 1 | unchanged |
| `src/theme/themeVariables.ts` | 77 | `src/lib/upstream/theme/themeVariables.ts` | carried | 1 | unchanged |
| `src/vite-env.d.ts` | 2 | `src/app.d.ts` | ported | 1 |  |
