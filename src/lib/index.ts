// Public entry of ironcalc-svelte. See docs/parity.md for what is ported so far.
import initWasm, { Model } from "@ironcalc/wasm";
import IronCalc from "./components/IronCalc.svelte";
import Workbook from "./components/Workbook/Workbook.svelte";

export {
  darkThemeVariables,
  defaultThemeVariables,
  setThemeVariables,
  unsetThemeVariables,
} from "./upstream/theme";
export type { PartialIronCalcThemeVariables } from "./upstream/theme";
export { WorkbookState } from "./upstream/components/workbookState";
export { IronCalc, Model, Workbook };

/** Initializes the `@ironcalc/wasm` engine; await it before creating a model. */
export const init: typeof initWasm = (moduleOrPath) => initWasm(moduleOrPath);
