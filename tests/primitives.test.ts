// The UI primitives the package exports (upstream's Button, IconButton,
// Menu, MenuItem, Checkbox, ToggleButton, Input, Tooltip and Confirm), and
// the Prompt the widget uses.
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";
import PrimitivesHarness from "./fixtures/PrimitivesHarness.svelte";
import { chooseMenuItem, menuItems, settle } from "./helpers";

function setUp() {
  const entries: string[] = [];
  render(PrimitivesHarness, { log: (entry: string) => entries.push(entry) });
  return entries;
}

describe("UI primitives", () => {
  it("opens a trigger menu and runs the chosen item", async () => {
    const entries = setUp();
    const trigger = screen.getByRole("button", { name: "Actions" });
    expect(trigger.getAttribute("aria-haspopup")).toBe("menu");
    await fireEvent.click(trigger);
    await settle();
    expect(menuItems()).toEqual(["First", "Disabled", "More"]);
    await chooseMenuItem("Disabled");
    expect(entries).toEqual([]);
    await chooseMenuItem("First");
    expect(entries).toEqual(["first"]);
    expect(menuItems()).toEqual([]);
  });

  it("runs an item of a submenu", async () => {
    const entries = setUp();
    await fireEvent.click(screen.getByRole("button", { name: "Actions" }));
    await settle();
    await chooseMenuItem("More");
    await chooseMenuItem("Nested");
    expect(entries).toEqual(["nested"]);
    expect(menuItems()).toEqual([]);
  });

  it("confirms, or cancels, a destructive action", async () => {
    const entries = setUp();
    await fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await settle();
    expect(screen.getByRole("dialog").textContent).toContain(
      "This cannot be undone.",
    );
    await fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await settle();
    expect(entries).toEqual(["closed"]);

    await fireEvent.click(screen.getByRole("button", { name: "Ask" }));
    await settle();
    await fireEvent.click(screen.getByRole("button", { name: "Do it" }));
    await settle();
    expect(entries).toEqual(["closed", "confirmed", "closed"]);
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("submits the prompt's value, starting from the default each time", async () => {
    const entries = setUp();
    await fireEvent.click(screen.getByRole("button", { name: "Name" }));
    await settle();
    const field = screen.getByRole("dialog").querySelector("input") as HTMLInputElement;
    expect(field.value).toBe("Draft");
    field.value = "Final";
    await fireEvent.input(field);
    // Enter moves to the submit button, as upstream
    await fireEvent.keyDown(field, { key: "Enter" });
    expect(document.activeElement?.textContent?.trim()).toBe("OK");
    await fireEvent.click(screen.getByRole("button", { name: "OK" }));
    await settle();
    expect(entries).toEqual(["submitted Final"]);

    await fireEvent.click(screen.getByRole("button", { name: "Name" }));
    await settle();
    const again = screen.getByRole("dialog").querySelector("input") as HTMLInputElement;
    expect(again.value).toBe("Draft");
    await fireEvent.keyDown(again, { key: "Escape" });
    await settle();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(entries).toEqual(["submitted Final"]);
  });

  it("toggles a checkbox and the toggle buttons", async () => {
    setUp();
    await fireEvent.click(screen.getByLabelText("Agree"));
    expect(screen.getByTestId("checked").textContent).toBe("true");

    const right = screen.getByRole("button", { name: "Right" });
    await fireEvent.click(right);
    expect(right.getAttribute("aria-pressed")).toBe("true");
    expect(screen.getByRole("button", { name: "Left" }).getAttribute("aria-pressed")).toBe("false");
    await fireEvent.click(screen.getByRole("button", { name: "Italic" }));
    await fireEvent.click(screen.getByRole("button", { name: "Bold" }));
    expect(screen.getByTestId("toggles").textContent).toBe("right italic");
  });

  it("steps a number input within its bounds", async () => {
    setUp();
    await fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(screen.getByTestId("amount").textContent).toBe("6");
    await fireEvent.click(screen.getByRole("button", { name: "Increase" }));
    expect(screen.getByTestId("amount").textContent).toBe("6");
    await fireEvent.click(screen.getByRole("button", { name: "Decrease" }), { shiftKey: true });
    expect(screen.getByTestId("amount").textContent).toBe("0");
  });

  it("wraps its child in a tooltip trigger", async () => {
    const entries = setUp();
    const star = screen.getByRole("button", { name: "Star" });
    expect(star.parentElement?.classList.contains("ic-tooltip-trigger")).toBe(true);
    await fireEvent.click(star);
    expect(entries).toEqual(["star"]);
  });
});
