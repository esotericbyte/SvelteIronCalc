<!--
  Port of upstream webapp/IronCalc/src/components/AdvancedColorPicker.tsx/AdvancedColorPicker.tsx:
  a panel below the anchor (above it when there is no room) with a
  saturation and hue picker, a hex field and a preview swatch, over a
  backdrop that cancels when clicked. Escape cancels and Tab cycles inside
  the panel, as upstream's useKeyDown. react-colorful's picker and hex input
  are replaced by HexColorPicker.svelte and a plain field.
-->
<script lang="ts">
  import Check from "@lucide/svelte/icons/check";
  import { Portal } from "@skeletonlabs/skeleton-svelte";
  import { t } from "../../i18n";
  import { getFocusableElements } from "../../upstream/components/util";
  import Button from "../Button/Button.svelte";
  import { getRootElement } from "../rootContext";
  import HexColorPicker from "./HexColorPicker.svelte";
  import { normalizeHex } from "./hsv";

  interface Props {
    color: string;
    onAccept: (color: string) => void;
    onCancel: () => void;
    anchorEl: () => HTMLElement | null;
    open: boolean;
  }

  let { color, onAccept, onCancel, anchorEl, open }: Props = $props();

  const root = getRootElement();
  const hexInputId = $props.id();
  // svelte-ignore state_referenced_locally
  let selectedColor = $state(color);
  // the hex field while it is typed in, which may not be a color yet
  let hexText = $state("");
  let panel: HTMLDivElement | null = $state(null);

  $effect.pre(() => {
    selectedColor = color;
  });

  $effect.pre(() => {
    hexText = selectedColor.replace(/^#/, "").toUpperCase();
  });

  $effect(() => {
    if (open && panel) {
      panel.querySelector<HTMLElement>("input, button")?.focus();
    }
  });

  // poor person's popover positioning logic (as upstream)
  function positioned(element: HTMLElement): () => void {
    function updatePosition(): void {
      const anchor = anchorEl();
      if (!anchor) {
        return;
      }
      const anchorRect = anchor.getBoundingClientRect();
      const panelWidth = element.offsetWidth;
      const panelHeight = element.offsetHeight;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      // space between anchor and popup
      const offset = 4;
      // minimum margin from screen edges
      const margin = 8;

      let left = anchorRect.left - offset;
      let top = anchorRect.bottom + offset;

      if (left + panelWidth > viewportWidth - margin) {
        left = viewportWidth - panelWidth - margin;
      }
      if (left < margin) {
        left = margin;
      }
      if (top + panelHeight > viewportHeight - margin) {
        top = anchorRect.top - panelHeight - offset;
      }
      if (top < margin) {
        top = margin;
      }
      element.style.top = `${top}px`;
      element.style.left = `${left}px`;
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }

  function onKeyDown(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      onCancel();
      return;
    }
    if (event.key !== "Tab") {
      return;
    }
    const focusable = getFocusableElements(panel);
    if (focusable.length === 0) {
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;
    if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    }
  }

  const isWhiteSwatch = $derived(selectedColor.toUpperCase() === "#FFFFFF");
</script>

{#if open}
  <Portal target={root() ?? undefined}>
    <div class="ic-menu-layer">
      <div class="ic-menu-backdrop" onclick={onCancel} aria-hidden="true"></div>
      <div
        bind:this={panel}
        class="ic-advanced-color-picker-panel"
        role="dialog"
        tabindex="-1"
        aria-modal="true"
        aria-label={t("color_picker.title")}
        onkeydown={onKeyDown}
        {@attach positioned}
      >
        <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
        <div
          class="ic-advanced-color-picker"
          onclick={(event) => {
            // Otherwise the sheet would grab the keyboard focus
            event.stopPropagation();
          }}
        >
          <HexColorPicker
            color={selectedColor}
            onChange={(newColor) => (selectedColor = newColor)}
          />

          <div class="ic-advanced-color-picker-divider"></div>

          <div class="ic-advanced-color-picker-input-row">
            <div class="ic-advanced-color-picker-hex-wrapper">
              <label class="ic-advanced-color-picker-hex-label" for={hexInputId}>Hex</label>
              <div class="ic-advanced-color-picker-hex-input-box">
                <div class="ic-advanced-color-picker-hash-label">#</div>
                <input
                  id={hexInputId}
                  class="ic-advanced-color-picker-hex-input"
                  bind:value={hexText}
                  maxlength={6}
                  spellcheck={false}
                  oninput={() => {
                    const hex = normalizeHex(hexText);
                    if (hex) {
                      selectedColor = hex;
                    }
                  }}
                  onblur={() => {
                    hexText = selectedColor.replace(/^#/, "").toUpperCase();
                  }}
                />
              </div>
            </div>
            <div
              class={[
                "ic-advanced-color-picker-swatch",
                isWhiteSwatch && "ic-advanced-color-picker-swatch--white",
              ]}
              style:background-color={selectedColor}
              aria-hidden="true"
            ></div>
          </div>

          <div class="ic-advanced-color-picker-divider"></div>

          <div class="ic-advanced-color-picker-buttons">
            <Button size="sm" variant="secondary" onclick={onCancel}>
              {t("color_picker.cancel")}
            </Button>
            <Button
              size="sm"
              onclick={() => {
                onAccept(selectedColor);
                onCancel();
              }}
            >
              {#snippet startIcon()}<Check />{/snippet}
              {t("color_picker.apply")}
            </Button>
          </div>
        </div>
      </div>
    </div>
  </Portal>
{/if}

<style>
  /* Port of upstream advanced-color-picker.css and the menu layer of index.css */
  :global(.ic-menu-layer) {
    position: fixed;
    inset: 0;
    z-index: 1300;
  }

  :global(.ic-menu-backdrop) {
    position: fixed;
    inset: 0;
  }

  :global(.ic-advanced-color-picker-panel) {
    position: fixed;
    border: 1px solid var(--palette-surface-elevated-border);
    border-radius: 12px;
    padding: 0;
    overflow: hidden;
    background: var(--palette-surface-elevated);
    box-shadow: var(--shadow-md);
    outline: none;
  }

  :global(.ic-advanced-color-picker) {
    background: transparent;
    width: 240px;
    max-width: 100%;
    padding: 0;
    display: flex;
    flex-direction: column;
    font-family: var(--typography-font-family);
  }

  :global(.ic-advanced-color-picker-divider) {
    width: 100%;
    height: 0;
    border-top: 1px solid var(--palette-grey-200);
  }

  :global(.ic-advanced-color-picker-input-row) {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 8px;
    gap: 8px;
  }

  :global(.ic-advanced-color-picker-hex-wrapper) {
    display: flex;
    flex-grow: 1;
    gap: 8px;
  }

  :global(.ic-advanced-color-picker-hex-label) {
    margin: auto 0;
    display: inline-flex;
    font-size: var(--typography-font-size);
    color: var(--palette-grey-900);
    font-family: var(--typography-font-family);
  }

  :global(.ic-advanced-color-picker-hex-input-box) {
    display: inline-flex;
    flex-grow: 1;
    width: 100%;
    height: 28px;
    border: 1px solid var(--palette-grey-300);
    border-radius: 5px;
  }

  :global(.ic-advanced-color-picker-hex-input-box:hover) {
    border: 1px solid var(--palette-grey-600);
  }

  :global(.ic-advanced-color-picker-hex-input-box:focus-within) {
    outline: 2px solid var(--palette-primary-main);
    outline-offset: 1px;
  }

  :global(.ic-advanced-color-picker-hash-label) {
    margin: auto 0 auto 10px;
    font-size: var(--typography-font-size);
    color: var(--palette-grey-900);
    font-family: var(--typography-font-family);
  }

  :global(.ic-advanced-color-picker-hex-input) {
    width: 100%;
    min-width: 0;
    border: none;
    background: transparent;
    color: var(--palette-common-black);
    outline: none;
    padding-right: 10px;
    border-radius: 5px;
    font-family: var(--typography-font-family);
    font-size: var(--typography-font-size);
    text-transform: uppercase;
    text-align: right;
  }

  :global(.ic-advanced-color-picker-swatch) {
    display: inline-flex;
    min-width: 28px;
    height: 28px;
    border-radius: 5px;
    border: 1px solid
      color-mix(in srgb, var(--palette-common-black) 8%, transparent);
  }

  :global(.ic-advanced-color-picker-swatch--white) {
    border-color: var(--palette-grey-300);
  }

  :global(.ic-advanced-color-picker-buttons) {
    display: flex;
    justify-content: space-between;
    margin: 8px;
    gap: 8px;
  }
</style>
