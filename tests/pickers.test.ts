// The pickers that are not reached from the sample's toolbar alone: the
// link tooltip's actions and the icon picker of the conditional formatting
// rules.
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";
import IconPicker from "../src/lib/components/IconPicker/IconPicker.svelte";
import { iconSpecFor } from "../src/lib/components/IconPicker/iconSpec";
import LinkTooltip from "../src/lib/components/Worksheet/LinkTooltip.svelte";
import { settle } from "./helpers";

function hoverCell(dynamic: boolean) {
  return {
    row: 10,
    column: 1,
    x: 40,
    y: 300,
    width: 100,
    height: 24,
    link: {
      type: "External" as const,
      target: "https://www.ironcalc.com",
      row: 10,
      column: 1,
      dynamic,
    },
  };
}

describe("link tooltip", () => {
  it("edits and breaks a link", async () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onHide = vi.fn();
    render(LinkTooltip, {
      cell: hoverCell(false),
      onFollow: () => {},
      onEdit,
      onDelete,
      onHide,
      onPointerEnter: () => {},
      onPointerLeave: () => {},
    });
    expect(screen.getByRole("button", { name: "ironcalc.com" })).toBeTruthy();
    await fireEvent.click(screen.getByRole("button", { name: "Edit link" }));
    expect(onEdit).toHaveBeenCalledWith(10, 1);
    await fireEvent.click(screen.getByRole("button", { name: "Break link" }));
    expect(onDelete).toHaveBeenCalledWith(10, 1);
    expect(onHide).toHaveBeenCalledTimes(2);
  });

  it("offers only following and copying for read-only and formula links", () => {
    const handlers = {
      onFollow: () => {},
      onHide: () => {},
      onPointerEnter: () => {},
      onPointerLeave: () => {},
    };
    const readOnly = render(LinkTooltip, { cell: hoverCell(false), ...handlers });
    expect(readOnly.queryByRole("button", { name: "Edit link" })).toBeNull();
    readOnly.unmount();
    render(LinkTooltip, {
      cell: hoverCell(true),
      onEdit: () => {},
      onDelete: () => {},
      ...handlers,
    });
    expect(screen.queryByRole("button", { name: "Edit link" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Break link" })).toBeNull();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeTruthy();
  });
});

describe("icon picker", () => {
  it("shows the icon and picks another from the grid", async () => {
    const onChange = vi.fn();
    render(IconPicker, { value: "Star", color: "#FF0000", onChange });
    const trigger = screen.getByRole("button", { name: "Pick icon" });
    await fireEvent.click(trigger);
    await settle();
    expect(screen.getAllByRole("button", { pressed: true }).map((b) => b.getAttribute("aria-label"))).toEqual([
      "Star",
    ]);
    expect(screen.getAllByRole("button")).toHaveLength(20);
    await fireEvent.click(screen.getByRole("button", { name: "Heart" }));
    await settle();
    expect(onChange).toHaveBeenCalledWith("Heart");
    expect(screen.queryByRole("button", { name: "Heart" })).toBeNull();
  });

  it("closes on a press outside", async () => {
    render(IconPicker, { value: "Check", color: "#000000", onChange: () => {} });
    await fireEvent.click(screen.getByRole("button", { name: "Pick icon" }));
    await settle();
    expect(screen.getByRole("button", { name: "Heart" })).toBeTruthy();
    await fireEvent.mouseDown(document.body);
    await settle();
    expect(screen.queryByRole("button", { name: "Heart" })).toBeNull();
  });

  it("falls back to a cross for an unknown icon name", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(iconSpecFor("Nope").filled).toBe(false);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});
