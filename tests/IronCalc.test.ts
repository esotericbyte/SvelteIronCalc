import { fireEvent, render, screen } from "@testing-library/svelte";
import { tick } from "svelte";
import { describe, expect, it } from "vitest";
import { IronCalc } from "../src/lib";
import { buildSampleWorkbook } from "../src/routes/sampleWorkbook";

function formulaBar() {
  return {
    address: screen.getByTestId("ic-formula-bar-address").textContent?.trim(),
    value: screen.getByTestId("ic-formula-bar-value").textContent?.trim(),
  };
}

describe("IronCalc widget", () => {
  it("shows the selected cell in the formula bar", () => {
    render(IronCalc, { model: buildSampleWorkbook() });
    expect(formulaBar()).toEqual({ address: "A1", value: "Item" });
  });

  it("moves the selection with keys sent to the widget only", async () => {
    const { container } = render(IronCalc, { model: buildSampleWorkbook() });
    const workbook = container.querySelector(
      ".ic-workbook-container",
    ) as HTMLElement;

    // a key pressed elsewhere on the page is not the widget's
    await fireEvent.keyDown(document.body, { key: "ArrowDown" });
    expect(formulaBar().address).toBe("A1");

    await fireEvent.keyDown(workbook, { key: "ArrowDown" });
    await fireEvent.keyDown(workbook, { key: "ArrowRight" });
    await tick();
    expect(formulaBar()).toEqual({ address: "B2", value: "120" });
  });

  it("switches sheets from the tabs", async () => {
    render(IronCalc, { model: buildSampleWorkbook() });
    const tabs = screen.getAllByRole("tab");
    // the hidden sheet has no tab
    expect(tabs.map((tab) => tab.textContent?.trim())).toEqual([
      "Summary",
      "Details",
    ]);
    await fireEvent.click(tabs[1]);
    await tick();
    expect(formulaBar().value).toBe("Plain text");
    expect(screen.getAllByRole("tab")[1].getAttribute("aria-selected")).toBe(
      "true",
    );
  });
});
