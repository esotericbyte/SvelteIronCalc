// The editing wiring of the widget: starting and ending edits from the keys
// and the formula bar, the edit shortcuts, the clipboard and read-only mode.
import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import { IronCalc, type Model } from "../src/lib";
import { buildSampleWorkbook } from "../src/routes/sampleWorkbook";

function setUp(props: { canEdit?: boolean } = {}) {
  const model = buildSampleWorkbook();
  const { container } = render(IronCalc, { model, ...props });
  const workbook = container.querySelector(
    ".ic-workbook-container",
  ) as HTMLElement;
  const cellEditor = () =>
    container.querySelector(
      ".ic-worksheet-editor-wrapper textarea",
    ) as HTMLTextAreaElement;
  const formulaBarEditor = () =>
    container.querySelector(
      "[data-testid='ic-formula-bar-value'] textarea",
    ) as HTMLTextAreaElement;
  return { model, container, workbook, cellEditor, formulaBarEditor };
}

function formulaBarValue(): string | undefined {
  return screen.getByTestId("ic-formula-bar-value").textContent?.trim();
}

/** Types `text` into an editor textarea, as the browser would. */
async function type(textarea: HTMLTextAreaElement, text: string) {
  textarea.value = text;
  textarea.setSelectionRange(text.length, text.length);
  await fireEvent.input(textarea);
  await tick();
}

/** A paste event carrying the given clipboard data (jsdom has no ClipboardEvent). */
function pasteEvent(data: Record<string, string>): Event {
  const event = new Event("paste", { bubbles: true, cancelable: true });
  Object.defineProperty(event, "clipboardData", {
    value: {
      items: Object.keys(data),
      getData: (type: string) => data[type] ?? "",
    },
  });
  return event;
}

function cell(model: Model, row: number, column: number): string {
  return model.getCellContent(0, row, column);
}

describe("editing a cell", () => {
  it("starts editing on a typed key and commits with Enter", async () => {
    const { model, workbook, cellEditor } = setUp();
    model.setSelectedCell(20, 3);
    await fireEvent.keyDown(workbook, { key: "4" });
    await tick();
    expect(cellEditor().value).toBe("4");
    // the formula bar follows the cell editor
    expect(formulaBarValue()).toBe("4");

    await type(cellEditor(), "42");
    expect(formulaBarValue()).toBe("42");
    await fireEvent.keyDown(cellEditor(), { key: "Enter" });
    await tick();
    expect(cell(model, 20, 3)).toBe("42");
    expect(model.getSelectedView()).toMatchObject({ row: 21, column: 3 });
  });

  it("edits the current content with F2 and cancels with Escape", async () => {
    const { model, workbook, cellEditor } = setUp();
    model.setSelectedCell(2, 1);
    await fireEvent.keyDown(workbook, { key: "F2" });
    await tick();
    expect(cellEditor().value).toBe("Apples");

    await type(cellEditor(), "Apricots");
    await fireEvent.keyDown(cellEditor(), { key: "Escape" });
    await tick();
    expect(cell(model, 2, 1)).toBe("Apples");
    expect(formulaBarValue()).toBe("Apples");
  });

  it("commits with Tab and moves right", async () => {
    const { model, workbook, cellEditor } = setUp();
    model.setSelectedCell(20, 3);
    await fireEvent.keyDown(workbook, { key: "x" });
    await tick();
    await fireEvent.keyDown(cellEditor(), { key: "Tab" });
    await tick();
    expect(cell(model, 20, 3)).toBe("x");
    expect(model.getSelectedView()).toMatchObject({ row: 20, column: 4 });
  });

  it("inserts a reference with the arrow keys while typing a formula", async () => {
    const { model, workbook, cellEditor } = setUp();
    model.setSelectedCell(20, 3);
    await fireEvent.keyDown(workbook, { key: "=" });
    await tick();
    // accept mode: the arrow picks the cell above as a reference
    await fireEvent.keyDown(cellEditor(), { key: "ArrowUp" });
    await tick();
    expect(formulaBarValue()).toBe("=C19");
    await fireEvent.keyDown(cellEditor(), { key: "Enter" });
    await tick();
    expect(cell(model, 20, 3)).toBe("=C19");
  });

  it("highlights the references of the formula being edited", async () => {
    const { model, workbook, container, cellEditor } = setUp();
    model.setSelectedCell(20, 3);
    await fireEvent.keyDown(workbook, { key: "=" });
    await tick();
    await type(cellEditor(), "=A1+B2");
    const colored = [
      ...container.querySelectorAll<HTMLSpanElement>(
        ".ic-worksheet-editor-wrapper span[style]",
      ),
    ].map((span) => span.textContent);
    expect(colored).toEqual(["A1", "B2"]);
  });

  it("shows the formula helper while typing a function name", async () => {
    const { model, workbook, container, cellEditor } = setUp();
    model.setSelectedCell(20, 3);
    await fireEvent.keyDown(workbook, { key: "=" });
    await tick();
    await type(cellEditor(), "=SU");
    const names = [
      ...container.querySelectorAll(".ic-fh-list-item .ic-fh-name"),
    ]
      .map((name) => name.textContent)
      .slice(0, 2);
    expect(names).toEqual(["SUBSTITUTE", "SUBTOTAL"]);

    // Enter accepts the highlighted function instead of committing
    await fireEvent.keyDown(cellEditor(), { key: "Enter" });
    await tick();
    expect(cellEditor().value).toBe("=SUBSTITUTE(");
    expect(container.querySelector(".ic-fh-signature")?.textContent).toContain(
      "SUBSTITUTE",
    );
  });

  it("edits from the formula bar", async () => {
    const { model, formulaBarEditor } = setUp();
    model.setSelectedCell(2, 6);
    await fireEvent.pointerDown(screen.getByTestId("ic-formula-bar-value"));
    await type(formulaBarEditor(), "=SUM(B2:C2)");
    await fireEvent.keyDown(formulaBarEditor(), { key: "Enter" });
    await tick();
    expect(cell(model, 2, 6)).toBe("=SUM(B2:C2)");
    expect(model.getFormattedCellValue(0, 2, 6)).toBe("255");
  });
});

describe("edit shortcuts", () => {
  it("clears the selection with Delete and undoes and redoes it", async () => {
    const { model, workbook } = setUp();
    model.setSelectedCell(2, 2);
    model.setSelectedRange(2, 2, 3, 3);
    await fireEvent.keyDown(workbook, { key: "Delete" });
    expect([cell(model, 2, 2), cell(model, 3, 3)]).toEqual(["", ""]);

    await fireEvent.keyDown(workbook, { key: "z", ctrlKey: true });
    expect([cell(model, 2, 2), cell(model, 3, 3)]).toEqual(["120", "95"]);
    await fireEvent.keyDown(workbook, { key: "y", ctrlKey: true });
    expect(cell(model, 2, 2)).toBe("");
    await fireEvent.keyDown(workbook, { key: "z", ctrlKey: true });
    await fireEvent.keyDown(workbook, {
      key: "z",
      ctrlKey: true,
      shiftKey: true,
    });
    expect(cell(model, 2, 2)).toBe("");
  });

  it("toggles bold, italic and underline", async () => {
    const { model, workbook } = setUp();
    model.setSelectedCell(2, 1);
    const font = () => model.getCellStyle(0, 2, 1).style.font;
    await fireEvent.keyDown(workbook, { key: "b", ctrlKey: true });
    await fireEvent.keyDown(workbook, { key: "i", ctrlKey: true });
    await fireEvent.keyDown(workbook, { key: "u", ctrlKey: true });
    expect([font().b, font().i, font().u]).toEqual([true, true, true]);
    // the header row is bold already: Ctrl+B takes it off
    model.setSelectedCell(1, 2);
    await fireEvent.keyDown(workbook, { key: "b", ctrlKey: true });
    expect(model.getCellStyle(0, 1, 2).style.font.b).toBeFalsy();
  });

  it("starts an edit with Backspace on an emptied cell", async () => {
    const { model, workbook, cellEditor } = setUp();
    model.setSelectedCell(2, 1);
    await fireEvent.keyDown(workbook, { key: "Backspace" });
    await tick();
    expect(cellEditor().value).toBe("");
    await fireEvent.keyDown(cellEditor(), { key: "Enter" });
    expect(cell(model, 2, 1)).toBe("");
  });
});

describe("clipboard", () => {
  it("pastes plain text into the selection", async () => {
    const { model, workbook } = setUp();
    model.setSelectedCell(30, 4);
    const event = pasteEvent({ "text/plain": "1\t2\n3\t4" });
    workbook.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect([
      cell(model, 30, 4),
      cell(model, 30, 5),
      cell(model, 31, 4),
      cell(model, 31, 5),
    ]).toEqual(["1", "2", "3", "4"]);
  });

  it("cuts and pastes cells with their formulas", async () => {
    const { model, workbook } = setUp();
    model.setSelectedCell(2, 6);
    const data: Record<string, string> = {};
    const cut = new Event("cut", { bubbles: true, cancelable: true });
    Object.defineProperty(cut, "clipboardData", {
      value: { setData: (type: string, value: string) => (data[type] = value) },
    });
    workbook.dispatchEvent(cut);
    expect(cut.defaultPrevented).toBe(true);
    expect(JSON.parse(data["application/json"]).type).toBe("cut");

    model.setSelectedCell(2, 8);
    workbook.dispatchEvent(pasteEvent(data));
    expect(cell(model, 2, 8)).toBe("=SUM(B2:E2)");
    // a cut moves the cell
    expect(cell(model, 2, 6)).toBe("");
  });

  it("explains a paste the engine rejects", async () => {
    const { model, workbook } = setUp();
    // the merged title is B7:D8; pasting two rows over C6 covers part of it
    model.setSelectedCell(6, 3);
    workbook.dispatchEvent(pasteEvent({ "text/plain": "a\nb" }));
    await tick();
    const dialog = await screen.findByRole("dialog");
    expect(dialog.textContent).toContain("Cannot paste");
  });
});

describe("read-only", () => {
  it("does not start edits or change the model", async () => {
    const { model, workbook, container } = setUp({ canEdit: false });
    await fireEvent.keyDown(workbook, { key: "x" });
    await fireEvent.keyDown(workbook, { key: "Delete" });
    await fireEvent.keyDown(workbook, { key: "b", ctrlKey: true });
    await tick();
    expect(cell(model, 1, 1)).toBe("Item");
    expect(model.getCellStyle(0, 1, 1).style.font.b).toBe(true);
    const editor = container.querySelector(
      ".ic-worksheet-editor-wrapper textarea",
    ) as HTMLTextAreaElement;
    expect(editor.disabled).toBe(true);

    const event = pasteEvent({ "text/plain": "changed" });
    workbook.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(cell(model, 1, 1)).toBe("Item");
  });
});
