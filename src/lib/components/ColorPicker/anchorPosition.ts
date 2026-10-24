// Port of upstream webapp/IronCalc/src/components/ColorPicker/useAnchorPosition.ts:
// the positioning function is unchanged; the React hook becomes a Svelte
// attachment (`{@attach panelAnchoredTo(() => anchor, placement)}`) on the
// `position: fixed` panel.
import type { Attachment } from "svelte/attachments";

export type Placement = "bottom" | "top" | "right";

export function getPanelPosition(
  anchor: HTMLElement,
  panel: HTMLElement,
  placement: Placement,
): { top: number; left: number } {
  const anchorRect = anchor.getBoundingClientRect();
  const panelWidth = panel.offsetWidth;
  const panelHeight = panel.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const offset = 4; // Distance between anchor and panel
  const margin = 8; // Safety margin from viewport edges

  let left: number;
  let top: number;

  if (placement === "right") {
    // Aligned with the anchor's top edge, used by submenus (e.g. BorderPicker)
    left = anchorRect.right;
    top = anchorRect.top;
  } else {
    // Preferred side by default, falls back to the other side when it has more space
    const spaceBelow = viewportHeight - anchorRect.bottom - margin;
    const spaceAbove = anchorRect.top - margin;
    const openBelow =
      placement === "top"
        ? spaceAbove < panelHeight + offset && spaceBelow > spaceAbove
        : spaceBelow >= panelHeight + offset || spaceBelow >= spaceAbove;

    // Left-aligned with the anchor by default, right-aligned when it would overflow
    const leftAligned = anchorRect.left;
    const overflowsRight = leftAligned + panelWidth > viewportWidth - margin;

    left = overflowsRight ? anchorRect.right - panelWidth : leftAligned;
    top = openBelow
      ? anchorRect.bottom + offset
      : anchorRect.top - panelHeight - offset;
  }

  // Keep the panel within the viewport edges
  if (left + panelWidth > viewportWidth - margin) {
    left = viewportWidth - panelWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }
  if (top + panelHeight > viewportHeight - margin) {
    top = viewportHeight - panelHeight - margin;
  }
  if (top < margin) {
    top = margin;
  }

  return { top, left };
}

/** Positions the panel it is attached to next to the anchor element. */
export function panelAnchoredTo(
  anchor: () => HTMLElement | null | undefined,
  placement: Placement = "bottom",
): Attachment<HTMLElement> {
  return (panel) => {
    function updatePosition(): void {
      const anchorElement = anchor();
      if (!anchorElement) {
        return;
      }
      const { top, left } = getPanelPosition(anchorElement, panel, placement);
      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
    }

    updatePosition();

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  };
}
