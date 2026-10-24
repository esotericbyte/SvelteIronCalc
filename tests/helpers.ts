// Shared helpers of the widget tests: mounting the widget on the sample
// workbook and driving its menus and dialogs as a user would.
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { IronCalc } from "../src/lib";
import { buildSampleWorkbook } from "../src/routes/sampleWorkbook";

/** Lets zag's state machines and Svelte's effects settle. */
export async function settle(): Promise<void> {
  await tick();
  await new Promise((resolve) => setTimeout(resolve, 20));
  await tick();
}

export function setUpWidget(props: { canEdit?: boolean } = {}) {
  const model = buildSampleWorkbook();
  const { container } = render(IronCalc, { model, ...props });
  // jsdom lays nothing out: give the canvas a size so the right-click can
  // tell the headers from the cells
  const canvas = container.querySelector("canvas") as HTMLCanvasElement;
  canvas.getBoundingClientRect = () =>
    ({
      x: 0,
      y: 0,
      left: 0,
      top: 0,
      width: 800,
      height: 600,
      right: 800,
      bottom: 600,
      toJSON() {},
    }) as DOMRect;
  const sheet = container.querySelector(
    ".ic-worksheet-sheet-container",
  ) as HTMLElement;
  const workbook = container.querySelector(
    ".ic-workbook-container",
  ) as HTMLElement;
  return { model, container, sheet, workbook };
}

function shownMenuItems(): HTMLElement[] {
  return [
    ...screen.queryAllByRole("menuitem"),
    ...screen.queryAllByRole("menuitemradio"),
  ];
}

/** The labels of the menu items shown. */
export function menuItems(): string[] {
  return shownMenuItems().map((item) => item.textContent?.trim() ?? "");
}

/**
 * Chooses a menu item by its label. The pointer goes down on it first, as
 * in a browser (zag selects the item the pointer is on).
 */
export async function chooseMenuItem(label: string | RegExp): Promise<void> {
  const item = shownMenuItems().find((element) => {
      const text = element.textContent?.trim() ?? "";
    return typeof label === "string" ? text === label : label.test(text);
  });
  if (!item) {
    throw new Error(`no menu item ${label} in ${menuItems().join(", ")}`);
  }
  await fireEvent.pointerDown(item, { pointerType: "touch" });
  await fireEvent.click(item);
  await settle();
}

/** Right-clicks the worksheet at a point of the canvas. */
export async function rightClick(
  sheet: HTMLElement,
  x: number,
  y: number,
): Promise<void> {
  await fireEvent.contextMenu(sheet, { clientX: x, clientY: y });
  await settle();
}

/** Closes the open menu with Escape. */
export async function closeMenu(): Promise<void> {
  const menu = [...document.querySelectorAll<HTMLElement>("[role='menu']")].find(
    (element) => !element.hidden,
  );
  if (menu) {
    await fireEvent.keyDown(menu, { key: "Escape" });
    await settle();
  }
}
