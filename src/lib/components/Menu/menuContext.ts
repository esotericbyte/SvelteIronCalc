// Skeleton's (zag's) menu reports a selected item by its value to the menu
// it belongs to; upstream's MenuItem takes an onClick instead. Each Menu
// keeps the handlers of its items here, keyed by the item's value.
import { getContext, setContext } from "svelte";

type Handler = () => void;

export interface MenuHandlers {
  /** Registers the click handler of an item; returns the unregister function. */
  register(value: string, handler: () => Handler | undefined): () => void;
  /** Runs the handler of the selected item. */
  select(value: string): void;
}

const key = Symbol("ironcalc-menu");

export function createMenuHandlers(): MenuHandlers {
  const handlers = new Map<string, () => Handler | undefined>();
  const menuHandlers: MenuHandlers = {
    register(value, handler) {
      handlers.set(value, handler);
      return () => {
        handlers.delete(value);
      };
    },
    select(value) {
      handlers.get(value)?.()?.();
    },
  };
  setContext(key, menuHandlers);
  return menuHandlers;
}

export function getMenuHandlers(): MenuHandlers | undefined {
  return getContext<MenuHandlers | undefined>(key);
}
