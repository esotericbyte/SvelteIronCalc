// The widget's `.ic-root` element, where the theme variables live. Popups
// (dialogs, the formula helper) portal into it, like upstream's
// createAnchoredPortal, so they keep the widget's theme.
import { getContext, setContext } from "svelte";

const key = Symbol("ironcalc-root");

/** Called by the widget root with a getter for its element. */
export function setRootElement(getRoot: () => HTMLElement | null): void {
  setContext(key, getRoot);
}

/** The `.ic-root` element, or null outside the widget (e.g. a bare Workbook). */
export function getRootElement(): () => HTMLElement | null {
  return getContext<(() => HTMLElement | null) | undefined>(key) ?? (() => null);
}
