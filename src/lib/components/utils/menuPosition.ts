// Port of upstream webapp/IronCalc/src/components/utils/useMenuPosition.ts:
// the positioning function is unchanged; the React hook becomes a Svelte
// attachment (`{@attach anchoredTo(() => anchor)}`) on the popup element.
import type { Attachment } from "svelte/attachments";

export function getMenuPosition(
  trigger: HTMLElement,
  menu: HTMLElement,
): { top: number; left: number } {
  const triggerRect = trigger.getBoundingClientRect();
  const menuWidth = menu.offsetWidth;
  const menuHeight = menu.offsetHeight;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  const offset = 4; // Distance between trigger and menu
  const margin = 8; // Safety margin from viewport edges

  // Below by default, falls back to above when there's more space there
  const spaceBelow = viewportHeight - triggerRect.bottom - margin;
  const spaceAbove = triggerRect.top - margin;
  const openBelow =
    spaceBelow >= menuHeight + offset || spaceBelow >= spaceAbove;

  // Left-aligned with the trigger by default, right-aligned when it would overflow
  const leftAligned = triggerRect.left;
  const overflowsRight = leftAligned + menuWidth > viewportWidth - margin;

  let left = overflowsRight ? triggerRect.right - menuWidth : leftAligned;
  let top = openBelow
    ? triggerRect.bottom + offset
    : triggerRect.top - menuHeight - offset;

  // Keep the menu within the viewport edges
  if (left + menuWidth > viewportWidth - margin) {
    left = viewportWidth - menuWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }
  if (top + menuHeight > viewportHeight - margin) {
    top = viewportHeight - menuHeight - margin;
  }
  if (top < margin) {
    top = margin;
  }

  return { top, left };
}

/**
 * Positions the element it is attached to (a `position: fixed` popup: menu,
 * formula helper…) next to an anchor element, flipping above /
 * right-aligning and clamping so it stays in the viewport.
 */
export function anchoredTo(
  anchor: () => HTMLElement | null | undefined,
): Attachment<HTMLElement> {
  return (menu) => {
    const trigger = anchor();
    if (!trigger) {
      return;
    }

    function updatePosition(): void {
      if (!trigger) {
        return;
      }
      const { top, left } = getMenuPosition(trigger, menu);
      menu.style.top = `${top}px`;
      menu.style.left = `${left}px`;
    }

    updatePosition();

    // The anchor and the popup can both change size while open (e.g. the
    // editor textarea grows while typing, the formula helper switches cards
    // or collapses), so watch both in addition to viewport resize/scroll.
    const observer = new ResizeObserver(updatePosition);
    observer.observe(trigger);
    observer.observe(menu);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  };
}
