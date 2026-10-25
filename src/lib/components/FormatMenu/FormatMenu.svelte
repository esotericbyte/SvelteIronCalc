<!--
  Port of upstream webapp/IronCalc/src/components/FormatMenu/FormatMenu.tsx:
  the toolbar's number format menu (auto, number, percentage, the three
  currencies, the short and long dates of the locale, custom), the current
  format checked. "Custom" opens FormatPicker, a prompt for the format code.
  The menu opens below `trigger`, which spreads the attributes it gets on its
  button. Upstream gives the focus back to the element that had it before the
  menu opened; here the workbook takes it back when the format is applied.
-->
<script lang="ts">
  import type { FmtSettings } from "@ironcalc/wasm";
  import type { Snippet } from "svelte";
  import { t } from "../../i18n";
  import { NumberFormats } from "../../upstream/components/FormatMenu/formatUtil";
  import Menu from "../Menu/Menu.svelte";
  import MenuDivider from "../Menu/MenuDivider.svelte";
  import MenuItem from "../Menu/MenuItem.svelte";
  import FormatPicker from "./FormatPicker.svelte";

  interface Props {
    trigger: Snippet<[Record<string, unknown>]>;
    numFmt: string;
    onChange: (numberFmt: string) => void;
    formatOptions: FmtSettings;
  }

  let { trigger, numFmt, onChange, formatOptions }: Props = $props();

  let isPickerOpen = $state(false);

  const isAutoFormat = $derived(numFmt === NumberFormats.AUTO);
  const isNumberFormat = $derived(numFmt === formatOptions.number_fmt);
  const isPercentageFormat = $derived(numFmt === NumberFormats.PERCENTAGE);
  const isCurrencyEurosFormat = $derived(numFmt === NumberFormats.CURRENCY_EUR);
  const isCurrencyUsdFormat = $derived(numFmt === NumberFormats.CURRENCY_USD);
  const isCurrencyGbpFormat = $derived(numFmt === NumberFormats.CURRENCY_GBP);
  const isShortDateFormat = $derived(numFmt === formatOptions.short_date);
  const isLongDateFormat = $derived(numFmt === formatOptions.long_date);
  const isCustomFormat = $derived(
    !(
      isAutoFormat ||
      isNumberFormat ||
      isPercentageFormat ||
      isCurrencyEurosFormat ||
      isCurrencyUsdFormat ||
      isCurrencyGbpFormat ||
      isShortDateFormat ||
      isLongDateFormat
    ),
  );
</script>

<Menu {trigger}>
  <MenuItem checked={isAutoFormat} onClick={() => onChange(NumberFormats.AUTO)}>
    {t("toolbar.format_menu.auto")}
  </MenuItem>

  <MenuDivider />

  <MenuItem
    checked={isNumberFormat}
    onClick={() => onChange(formatOptions.number_fmt)}
    secondaryText={formatOptions.number_example}
  >
    {t("toolbar.format_menu.number")}
  </MenuItem>
  <MenuItem
    checked={isPercentageFormat}
    onClick={() => onChange(NumberFormats.PERCENTAGE)}
    secondaryText={t("toolbar.format_menu.percentage_example")}
  >
    {t("toolbar.format_menu.percentage")}
  </MenuItem>

  <MenuDivider />

  <MenuItem
    checked={isCurrencyEurosFormat}
    onClick={() => onChange(NumberFormats.CURRENCY_EUR)}
    secondaryText={t("toolbar.format_menu.currency_eur_example")}
  >
    {t("toolbar.format_menu.currency_eur")}
  </MenuItem>
  <MenuItem
    checked={isCurrencyUsdFormat}
    onClick={() => onChange(NumberFormats.CURRENCY_USD)}
    secondaryText={t("toolbar.format_menu.currency_usd_example")}
  >
    {t("toolbar.format_menu.currency_usd")}
  </MenuItem>
  <MenuItem
    checked={isCurrencyGbpFormat}
    onClick={() => onChange(NumberFormats.CURRENCY_GBP)}
    secondaryText={t("toolbar.format_menu.currency_gbp_example")}
  >
    {t("toolbar.format_menu.currency_gbp")}
  </MenuItem>

  <MenuDivider />

  <MenuItem
    checked={isShortDateFormat}
    onClick={() => onChange(formatOptions.short_date)}
    secondaryText={formatOptions.short_date_example}
  >
    {t("toolbar.format_menu.date_short")}
  </MenuItem>
  <MenuItem
    checked={isLongDateFormat}
    onClick={() => onChange(formatOptions.long_date)}
    secondaryText={formatOptions.long_date_example}
  >
    {t("toolbar.format_menu.date_long")}
  </MenuItem>

  <MenuDivider />

  <MenuItem checked={isCustomFormat} onClick={() => (isPickerOpen = true)}>
    {t("toolbar.format_menu.custom")}
  </MenuItem>
</Menu>

<FormatPicker
  {numFmt}
  {onChange}
  open={isPickerOpen}
  onClose={() => (isPickerOpen = false)}
/>
