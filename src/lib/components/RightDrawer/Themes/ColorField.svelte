<!--
  Port of the ColorField of upstream
  webapp/IronCalc/src/components/RightDrawer/Themes/EditTheme.tsx: a theme
  color as a swatch opening the color picker and a hex field.
-->
<script lang="ts">
  import type { IronCalcTheme } from "@ironcalc/wasm";
  import { t } from "../../../i18n";
  import { resolveColorToHex } from "../../../upstream/components/ColorPicker/util";
  import ColorPicker from "../../ColorPicker/ColorPicker.svelte";
  import Input from "../../Input/Input.svelte";
  import SwatchButton from "../SwatchButton.svelte";

  interface Props {
    label: string;
    value: string;
    onChange: (color: string) => void;
    onKeyDown: (event: KeyboardEvent) => void;
    currentTheme: IronCalcTheme;
  }

  let { label, value, onChange, onKeyDown, currentTheme }: Props = $props();

  let open = $state(false);
  let swatch: HTMLButtonElement | null = $state(null);
</script>

<div class="ic-edit-theme-field-wrapper">
  <span class="ic-edit-theme-label">{label}</span>
  <div class="ic-edit-theme-color-row">
    <SwatchButton bind:ref={swatch} color={value} aria-label={label} onclick={() => (open = true)} />
    <Input
      type="text"
      {value}
      oninput={(event) => onChange(event.currentTarget.value)}
      onkeydown={onKeyDown}
    />
    <ColorPicker
      color={value}
      defaultColor={value}
      title={t("color_picker.default")}
      onChange={(color) => {
        onChange(resolveColorToHex(color, currentTheme));
        open = false;
      }}
      onClose={() => (open = false)}
      anchorEl={() => swatch}
      {open}
      theme={currentTheme}
    />
  </div>
</div>

<style>
  .ic-edit-theme-field-wrapper {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .ic-edit-theme-label {
    font-size: var(--typography-font-size);
    font-family: var(--typography-font-family);
    font-weight: 500;
    color: var(--palette-common-black);
  }

  .ic-edit-theme-color-row {
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .ic-edit-theme-color-row > :global(.ic-input) {
    flex: 1;
    min-width: 0;
  }
</style>
