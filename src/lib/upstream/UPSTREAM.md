# Files carried over from IronCalc

Every file in this directory is copied from IronCalc's React widget,
`webapp/IronCalc/src/` in https://github.com/ironcalc/IronCalc, at commit
`9cfbdfce5efcdbedd57520ad9fd797b12e6bf0ba` (2026-10-23, matching npm
`@ironcalc/workbook` and `@ironcalc/wasm` 0.9.1). They keep upstream's
relative layout, so their imports resolve unchanged and none of them has been
edited. Do not edit them here: bump them from upstream and port the
consequences in the Svelte code.

Copyright 2023 EqualTo GmbH, 2023 - Present IronCalc contributors,
2026 - Present IronCalc GmbH. Licensed under MIT OR Apache-2.0.

| File here | Upstream path (under `webapp/IronCalc/`) | How |
| --- | --- | --- |
| `components/WorksheetCanvas/worksheetCanvas.ts` | `src/components/WorksheetCanvas/worksheetCanvas.ts` | unchanged |
| `components/WorksheetCanvas/cellLinks.ts` | `src/components/WorksheetCanvas/cellLinks.ts` | unchanged |
| `components/WorksheetCanvas/cfRenderer.ts` | `src/components/WorksheetCanvas/cfRenderer.ts` | unchanged |
| `components/WorksheetCanvas/constants.ts` | `src/components/WorksheetCanvas/constants.ts` | unchanged |
| `components/WorksheetCanvas/lucideIconPaths.ts` | `src/components/WorksheetCanvas/lucideIconPaths.ts` | unchanged |
| `components/WorksheetCanvas/outlineHandle.ts` | `src/components/WorksheetCanvas/outlineHandle.ts` | unchanged |
| `components/WorksheetCanvas/util.ts` | `src/components/WorksheetCanvas/util.ts` | unchanged |
| `components/workbookState.ts` | `src/components/workbookState.ts` | unchanged |
| `components/util.ts` | `src/components/util.ts` | unchanged |
| `components/types.ts` | `src/components/types.ts` | unchanged |
| `components/clipboard.ts` | `src/components/clipboard.ts` | unchanged |
| `components/LinkDialog/util.ts` | `src/components/LinkDialog/util.ts` | unchanged |
| `components/ColorPicker/util.ts` | `src/components/ColorPicker/util.ts` | unchanged |
| `components/Editor/util.ts` | `src/components/Editor/util.tsx`, lines 1-9, 23-29, 61-150 and 339-446 | excerpt, verbatim: everything but `getFormulaHTML` (which renders JSX), its private helpers and the React import; those are ported in `src/lib/components/Editor/formulaHTML.ts` |
| `components/FormulaHelper/formulaCompletion.ts` | `src/components/FormulaHelper/formulaCompletion.ts` | unchanged |
| `components/FormulaHelper/functions.json` | `src/components/FormulaHelper/functions.json` | unchanged |
| `theme/theme.ts` | `src/theme/theme.ts` | unchanged |
| `theme/themeVariables.ts` | `src/theme/themeVariables.ts` | unchanged |
| `theme/index.ts` | `src/theme/index.ts` | unchanged |
| `theme/theme.css` | `src/theme/theme.css` | unchanged |
| `locale/en_us.json` | `src/locale/en_us.json` | unchanged |

`scripts/upstream-diff.sh <IronCalc checkout>` compares this directory with
an upstream checkout, which is the first step of a bump. The excerpt's line
ranges are those of the pinned commit; a bump re-checks them.
