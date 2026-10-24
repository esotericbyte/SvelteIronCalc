import { describe, expect, it, vi } from "vitest";
import { createKeyDownHandler } from "../src/lib/components/Workbook/keyboardNavigation";

function setup(canEdit = false) {
  const root = document.createElement("div");
  const inner = document.createElement("input");
  root.append(inner);
  const options = {
    canEdit,
    root: () => root,
    onCellsDeleted: vi.fn(),
    onExpandAreaSelectedKeyboard: vi.fn(),
    onEditKeyPressStart: vi.fn(),
    onCellEditStart: vi.fn(),
    onBold: vi.fn(),
    onItalic: vi.fn(),
    onUnderline: vi.fn(),
    onNavigationToEdge: vi.fn(),
    onPageDown: vi.fn(),
    onPageUp: vi.fn(),
    onArrowDown: vi.fn(),
    onArrowUp: vi.fn(),
    onArrowLeft: vi.fn(),
    onArrowRight: vi.fn(),
    onKeyHome: vi.fn(),
    onKeyEnd: vi.fn(),
    onUndo: vi.fn(),
    onRedo: vi.fn(),
    onNextSheet: vi.fn(),
    onPreviousSheet: vi.fn(),
    onEscape: vi.fn(),
    onSelectColumn: vi.fn(),
    onSelectRow: vi.fn(),
  };
  const handler = createKeyDownHandler(options);
  root.addEventListener("keydown", handler);
  return { root, inner, options };
}

function press(target: Element, key: string, init: KeyboardEventInit = {}) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...init,
  });
  target.dispatchEvent(event);
  return event;
}

describe("keyboard navigation", () => {
  it("navigates on keys sent to the workbook", () => {
    const { root, options } = setup();
    press(root, "ArrowDown");
    press(root, "Enter");
    press(root, "Tab");
    press(root, "ArrowRight", { shiftKey: true });
    press(root, "ArrowDown", { altKey: true });
    expect(options.onArrowDown).toHaveBeenCalledTimes(2);
    expect(options.onArrowRight).toHaveBeenCalledTimes(1);
    expect(options.onExpandAreaSelectedKeyboard).toHaveBeenCalledWith(
      "ArrowRight",
    );
    expect(options.onNextSheet).toHaveBeenCalledTimes(1);
  });

  it("leaves keys of elements inside the workbook alone", () => {
    const { inner, options } = setup();
    const event = press(inner, "ArrowDown");
    expect(options.onArrowDown).not.toHaveBeenCalled();
    expect(event.defaultPrevented).toBe(false);
  });

  it("ignores editing keys when read-only", () => {
    const { root, options } = setup(false);
    press(root, "a");
    press(root, "F2");
    press(root, "Delete");
    press(root, "z", { ctrlKey: true });
    press(root, "z", { ctrlKey: true, shiftKey: true });
    press(root, "b", { ctrlKey: true });
    expect(options.onEditKeyPressStart).not.toHaveBeenCalled();
    expect(options.onCellEditStart).not.toHaveBeenCalled();
    expect(options.onCellsDeleted).not.toHaveBeenCalled();
    expect(options.onUndo).not.toHaveBeenCalled();
    expect(options.onRedo).not.toHaveBeenCalled();
    expect(options.onBold).not.toHaveBeenCalled();
  });

  it("does not stop clipboard shortcuts", () => {
    const { root } = setup();
    const event = press(root, "c", { ctrlKey: true });
    expect(event.defaultPrevented).toBe(false);
  });
});
