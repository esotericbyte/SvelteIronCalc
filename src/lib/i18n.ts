// Port of upstream webapp/IronCalc/src/i18n.ts: the translation lookup over
// upstream's five locale files, in place of an i18next instance. `t` reads the
// language from reactive state, so a language change re-renders what it
// translated.
import deDe from "./upstream/locale/de_de.json";
import enUs from "./upstream/locale/en_us.json";
import esEs from "./upstream/locale/es_es.json";
import frFr from "./upstream/locale/fr_fr.json";
import itIt from "./upstream/locale/it_it.json";
import { i18nState } from "./i18nState.svelte";

type Messages = { [key: string]: string | Messages };

const resources: Record<string, Messages> = {
  "en-US": enUs,
  "en-GB": enUs,
  "es-ES": esEs,
  "fr-FR": frFr,
  "de-DE": deDe,
  "it-IT": itIt,
};

/** The type of `t`, for helpers that take it as upstream takes i18next's `TFunction`. */
export type TFunction = typeof t;

/** The current language, a code such as `en-US` (i18next's `i18n.language`). */
export function getLanguage(): string {
  return i18nState.language;
}

/**
 * Changes the language `t` translates into (i18next's `changeLanguage`). A
 * code is formatted as i18next does (`de-de` becomes `de-DE`); a language
 * without a locale file translates every key to itself, as upstream, which
 * has no fallback language.
 */
export function changeLanguage(language: string): void {
  i18nState.language = formatLanguageCode(language);
}

function formatLanguageCode(code: string): string {
  const parts = code.split("-");
  if (parts.length !== 2) {
    return code;
  }
  return `${parts[0].toLowerCase()}-${parts[1].toUpperCase()}`;
}

/**
 * Returns the string for a dotted upstream key in the current language, or
 * the key itself (or `values.defaultValue` when given, as i18next does).
 * `{{name}}` placeholders are replaced from `values`, as i18next does.
 */
export function t(
  key: string,
  values?: Record<string, string | number>,
): string {
  let node: string | Messages | undefined = resources[i18nState.language];
  for (const part of key.split(".")) {
    if (typeof node !== "object") {
      return fallback(key, values);
    }
    node = node[part];
  }
  if (typeof node !== "string") {
    return fallback(key, values);
  }
  if (!values) {
    return node;
  }
  return node.replace(/\{\{\s*(\w+)\s*\}\}/g, (placeholder, name: string) =>
    name in values ? `${values[name]}` : placeholder,
  );
}

function fallback(
  key: string,
  values?: Record<string, string | number>,
): string {
  return values?.defaultValue !== undefined ? `${values.defaultValue}` : key;
}
