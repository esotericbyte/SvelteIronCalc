<!--
  Stand-in for react-colorful's HexColorPicker, which upstream's
  AdvancedColorPicker uses: a saturation / brightness area over a hue bar,
  each a slider driven by the pointer or the arrow keys (Shift for bigger
  steps). `color` is a "#rrggbb" hex, reported through `onChange`.
-->
<script lang="ts">
  import { untrack } from "svelte";
  import { type Hsv, hexToHsv, hsvToHex, normalizeHex } from "./hsv";

  interface Props {
    color: string;
    onChange: (color: string) => void;
  }

  let { color, onChange }: Props = $props();

  // The HSV state survives hex round trips (a grey has no hue of its own)
  let hsv: Hsv = $state(untrack(() => hexToHsv(color)));

  $effect.pre(() => {
    const incoming = normalizeHex(color);
    if (incoming && incoming !== untrack(() => hsvToHex(hsv))) {
      hsv = hexToHsv(incoming);
    }
  });

  function update(next: Partial<Hsv>): void {
    hsv = { ...hsv, ...next };
    onChange(hsvToHex(hsv));
  }

  const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));

  function drag(
    element: HTMLElement,
    move: (x: number, y: number) => void,
  ): (event: PointerEvent) => void {
    return (event) => {
      event.preventDefault();
      element.focus();
      const apply = (pointer: PointerEvent) => {
        const rect = element.getBoundingClientRect();
        move(
          clamp((pointer.clientX - rect.left) / (rect.width || 1), 1),
          clamp((pointer.clientY - rect.top) / (rect.height || 1), 1),
        );
      };
      apply(event);
      const onMove = (pointer: PointerEvent) => apply(pointer);
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    };
  }

  let saturationElement: HTMLDivElement | null = $state(null);
  let hueElement: HTMLDivElement | null = $state(null);

  function onSaturationKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 10 : 1;
    const moves: Record<string, Partial<Hsv>> = {
      ArrowLeft: { s: clamp(hsv.s - step, 100) },
      ArrowRight: { s: clamp(hsv.s + step, 100) },
      ArrowUp: { v: clamp(hsv.v + step, 100) },
      ArrowDown: { v: clamp(hsv.v - step, 100) },
    };
    if (event.key in moves) {
      event.preventDefault();
      update(moves[event.key]);
    }
  }

  function onHueKeyDown(event: KeyboardEvent): void {
    const step = event.shiftKey ? 10 : 1;
    if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      event.preventDefault();
      update({ h: clamp(hsv.h - step, 359.99) });
    } else if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      event.preventDefault();
      update({ h: clamp(hsv.h + step, 359.99) });
    }
  }
</script>

<div class="ic-hex-color-picker">
  <div
    bind:this={saturationElement}
    class="ic-hex-color-picker__saturation"
    style:background-color={`hsl(${hsv.h} 100% 50%)`}
    role="slider"
    tabindex="0"
    aria-label="Color"
    aria-valuetext={`Saturation ${Math.round(hsv.s)}%, Brightness ${Math.round(hsv.v)}%`}
    aria-valuenow={Math.round(hsv.s)}
    onpointerdown={(event) =>
      saturationElement &&
      drag(saturationElement, (x, y) => update({ s: x * 100, v: (1 - y) * 100 }))(event)}
    onkeydown={onSaturationKeyDown}
  >
    <div
      class="ic-hex-color-picker__pointer"
      style:left={`${hsv.s}%`}
      style:top={`${100 - hsv.v}%`}
      style:background-color={hsvToHex(hsv)}
    ></div>
  </div>
  <div
    bind:this={hueElement}
    class="ic-hex-color-picker__hue"
    role="slider"
    tabindex="0"
    aria-label="Hue"
    aria-valuemin={0}
    aria-valuemax={360}
    aria-valuenow={Math.round(hsv.h)}
    onpointerdown={(event) =>
      hueElement && drag(hueElement, (x) => update({ h: Math.min(x * 360, 359.99) }))(event)}
    onkeydown={onHueKeyDown}
  >
    <div
      class="ic-hex-color-picker__pointer ic-hex-color-picker__pointer--hue"
      style:left={`${(hsv.h / 360) * 100}%`}
      style:background-color={`hsl(${hsv.h} 100% 50%)`}
    ></div>
  </div>
</div>

<style>
  .ic-hex-color-picker {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 160px;
    user-select: none;
  }

  .ic-hex-color-picker__saturation {
    position: relative;
    flex-grow: 1;
    border-radius: 8px 8px 0 0;
    background-image:
      linear-gradient(to top, #000, rgba(0, 0, 0, 0)),
      linear-gradient(to right, #fff, rgba(255, 255, 255, 0));
    cursor: crosshair;
  }

  .ic-hex-color-picker__hue {
    position: relative;
    height: 8px;
    margin: 8px;
    border-radius: 5px;
    background: linear-gradient(
      to right,
      #f00 0%,
      #ff0 17%,
      #0f0 33%,
      #0ff 50%,
      #00f 67%,
      #f0f 83%,
      #f00 100%
    );
    cursor: pointer;
  }

  .ic-hex-color-picker__pointer {
    position: absolute;
    box-sizing: border-box;
    width: 14px;
    height: 14px;
    transform: translate(-50%, -50%);
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
    pointer-events: none;
  }

  .ic-hex-color-picker__pointer--hue {
    top: 50%;
    width: 16px;
    height: 16px;
  }

  .ic-hex-color-picker__saturation:focus-visible,
  .ic-hex-color-picker__hue:focus-visible {
    outline: 2px solid var(--palette-primary-main);
    outline-offset: 2px;
  }
</style>
