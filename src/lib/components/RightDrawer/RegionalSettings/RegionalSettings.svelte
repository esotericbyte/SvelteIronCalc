<!--
  Port of upstream webapp/IronCalc/src/components/RightDrawer/RegionalSettings/RegionalSettings.tsx:
  the workbook's locale (with examples of its number and date formats and
  its argument delimiter) and timezone. Saving applies them and closes the
  drawer; the language is kept as it is, as upstream.
-->
<script lang="ts">
  import { getAllTimezones, getSupportedLocales } from "@ironcalc/wasm";
  import Check from "@lucide/svelte/icons/check";
  import { t } from "../../../i18n";
  import Button from "../../Button/Button.svelte";
  import Select from "../../Select/Select.svelte";
  import DrawerHeader from "../DrawerHeader.svelte";
  import { getLocaleDisplayName, localeFormatExamples } from "./regionalSettings";

  interface Props {
    onClose: () => void;
    initialLocale: string;
    initialTimezone: string;
    initialLanguage: string;
    onSave: (locale: string, timezone: string, language: string) => void;
  }

  let { onClose, initialLocale, initialTimezone, initialLanguage, onSave }: Props =
    $props();

  const locales = getSupportedLocales();
  const timezones = getAllTimezones();

  // svelte-ignore state_referenced_locally
  let selectedLocale = $state(initialLocale);
  // svelte-ignore state_referenced_locally
  let selectedTimezone = $state(initialTimezone);
  // svelte-ignore state_referenced_locally
  let selectedLanguage = $state(initialLanguage);

  $effect.pre(() => {
    selectedLocale = initialLocale;
    selectedTimezone = initialTimezone;
    selectedLanguage = initialLanguage;
  });

  const example = $derived(localeFormatExamples[selectedLocale]);
  const delimiter = $derived.by(() => {
    const delimiterType = example?.delimiterType ?? "comma";
    const delimiterChar = example?.delimiterChar ?? ",";
    const delimiterLabel = t(`regional_settings.locale.delimiter_${delimiterType}`);
    return `${delimiterLabel} (${delimiterChar})`;
  });

  function handleSave(): void {
    onSave(selectedLocale, selectedTimezone, selectedLanguage);
    onClose();
  }
</script>

<div class="ic-regional-settings-container">
  <DrawerHeader title={t("regional_settings.title")} {onClose} />

  <div class="ic-regional-settings-content">
    <div class="ic-regional-settings-section">
      <div class="ic-regional-settings-section-title">
        {t("regional_settings.locale.title")}
      </div>
      <div class="ic-regional-settings-field-wrapper">
        <Select
          label={t("regional_settings.locale.locale_label")}
          value={selectedLocale}
          onChange={(value) => (selectedLocale = value)}
          options={locales.map((locale) => ({
            value: locale,
            label: getLocaleDisplayName(locale),
            triggerLabel: getLocaleDisplayName(locale),
          }))}
        />
        <div class="ic-regional-settings-helper-box">
          <div class="ic-regional-settings-row">
            {t("regional_settings.locale.locale_example1")}
            <span class="ic-regional-settings-row-value">
              {example?.number ?? "1,234.56"}
            </span>
          </div>
          <div class="ic-regional-settings-row">
            {t("regional_settings.locale.locale_example2")}
            <span class="ic-regional-settings-row-value">
              {example?.dateTime ?? "10/17/2026 09:21:06 PM"}
            </span>
          </div>
          <div class="ic-regional-settings-row">
            {t("regional_settings.locale.locale_example3")}
            <span class="ic-regional-settings-row-value">{delimiter}</span>
          </div>
        </div>
      </div>
    </div>
    <div class="ic-regional-settings-section">
      <div class="ic-regional-settings-section-title">
        {t("regional_settings.timezone.title")}
      </div>
      <div class="ic-regional-settings-field-wrapper">
        <Select
          label={t("regional_settings.timezone.timezone_label")}
          helperText={t("regional_settings.timezone.timezone_helper")}
          value={selectedTimezone}
          onChange={(value) => (selectedTimezone = value)}
          options={timezones.map((timezone) => ({
            value: timezone,
            label: timezone,
            triggerLabel: timezone,
          }))}
        />
      </div>
    </div>
  </div>

  <div class="ic-regional-settings-footer">
    <Button onclick={handleSave}>
      {#snippet startIcon()}<Check />{/snippet}
      {t("num_fmt.save")}
    </Button>
  </div>
</div>

<style>
  /* Port of upstream RegionalSettings/regional-settings.css; the header is
     DrawerHeader's */
  .ic-regional-settings-container {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  .ic-regional-settings-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    font-size: 12px;
    overflow: auto;
  }

  .ic-regional-settings-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 16px 12px;
    border-bottom: 1px solid var(--palette-grey-300);
  }

  .ic-regional-settings-section:last-child {
    border-bottom: none;
  }

  .ic-regional-settings-section-title {
    font-size: 14px;
    font-weight: 600;
    font-family: var(--typography-font-family);
    margin: 0;
    color: var(--palette-common-black);
  }

  .ic-regional-settings-helper-box {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    justify-content: center;
    gap: 2px;
    box-sizing: border-box;
    border: 1px solid var(--palette-grey-300);
    font-family: var(--typography-font-family);
    width: 100%;
    margin-top: 8px;
    background-color: var(--palette-grey-100);
    border-radius: 4px;
    padding: 8px;
  }

  .ic-regional-settings-row {
    display: flex;
    flex-direction: row;
    gap: 4px;
    width: 100%;
    justify-content: space-between;
    color: var(--palette-grey-700);
  }

  .ic-regional-settings-row-value {
    font-size: 12px;
    font-family: var(--typography-font-family);
    font-weight: normal;
    color: var(--palette-grey-500);
  }

  .ic-regional-settings-field-wrapper {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .ic-regional-settings-footer {
    color: var(--palette-grey-700);
    display: flex;
    align-items: center;
    border-top: 1px solid var(--palette-grey-300);
    font-family: var(--typography-font-family);
    justify-content: flex-end;
    padding: 8px;
    gap: 8px;
  }
</style>
