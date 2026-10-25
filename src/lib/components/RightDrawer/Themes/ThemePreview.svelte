<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/Themes/ThemePreview.tsx:
  a small swatch of a theme, "Aa" in its text color on its background next
  to a pie of its six accent colors.
-->
<script lang="ts" module>
  import type { ThemeData } from "./themeData";

  function polarToCartesian(
    cx: number,
    cy: number,
    r: number,
    angleDeg: number,
  ): [number, number] {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
  }

  function sectorPath(
    cx: number,
    cy: number,
    r: number,
    startDeg: number,
    endDeg: number,
  ): string {
    const [sx, sy] = polarToCartesian(cx, cy, r, startDeg);
    const [ex, ey] = polarToCartesian(cx, cy, r, endDeg);
    const large = endDeg - startDeg > 180 ? 1 : 0;
    return `M${cx},${cy} L${sx},${sy} A${r},${r},0,${large},1,${ex},${ey}Z`;
  }
</script>

<script lang="ts">
  interface Props {
    theme: Pick<ThemeData, "bgColor" | "textColor" | "accentColors">;
    class: string;
  }

  let { theme, class: className }: Props = $props();
</script>

<div
  class={className}
  style:background-color={theme.bgColor}
  style:color={theme.textColor}
  style:--theme-bg={theme.bgColor}
>
  <div class="ic-theme-preview-inner">
    <span>Aa</span>
    <svg viewBox="0 0 28 28" class="ic-theme-preview-pie" aria-hidden="true">
      {#each theme.accentColors as color, i (i)}
        <path d={sectorPath(14, 14, 13, i * 60, (i + 1) * 60)} fill={color} />
      {/each}
    </svg>
  </div>
</div>

<style>
  /* Port of the preview rules of upstream Themes/themes.css */
  .ic-theme-preview-inner {
    display: flex;
    align-items: center;
    align-self: stretch;
    width: calc(100% - 8px);
    box-sizing: border-box;
    margin: 4px;
    padding-left: 4px;
    gap: 4px;
    background:
      linear-gradient(
        to bottom,
        transparent calc(30% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(30% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(30% + 0.5px),
        transparent calc(30% + 0.5px),
        transparent calc(70% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(70% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(70% + 0.5px),
        transparent calc(70% + 0.5px)
      ),
      linear-gradient(
        to right,
        transparent calc(33% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(33% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(33% + 0.5px),
        transparent calc(33% + 0.5px),
        transparent calc(67% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(67% - 0.5px),
        color-mix(in srgb, currentColor 10%, transparent) calc(67% + 0.5px),
        transparent calc(67% + 0.5px)
      );
    outline: 1px solid color-mix(in srgb, currentColor 10%, transparent);
  }

  .ic-theme-preview-pie {
    min-width: 22px;
    outline: 1px solid var(--theme-bg);
    min-height: 22px;
    border-radius: 50%;
    outline-offset: -1px;
  }
</style>
