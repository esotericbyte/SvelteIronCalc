// Minimal translation lookup over upstream's English locale file.
// Full i18n (language switching, the other upstream locales) is a later phase,
// see docs/parity.md.
import enUs from "./upstream/locale/en_us.json";

type Messages = { [key: string]: string | Messages };

const messages: Messages = enUs;

/** The type of `t`, for helpers that take it as upstream takes i18next's `TFunction`. */
export type TFunction = typeof t;

/**
 * Returns the English string for a dotted upstream key, or the key itself
 * (or `values.defaultValue` when given, as i18next does). `{{name}}`
 * placeholders are replaced from `values`, as i18next does.
 */
export function t(
  key: string,
  values?: Record<string, string | number>,
): string {
  let node: string | Messages | undefined = messages;
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
