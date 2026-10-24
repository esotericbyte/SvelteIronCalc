// Minimal translation lookup over upstream's English locale file.
// Full i18n (language switching, the other upstream locales) is a later phase,
// see docs/parity.md.
import enUs from "./upstream/locale/en_us.json";

type Messages = { [key: string]: string | Messages };

const messages: Messages = enUs;

/** Returns the English string for a dotted upstream key, or the key itself. */
export function t(key: string): string {
  let node: string | Messages | undefined = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object") {
      return key;
    }
    node = node[part];
  }
  return typeof node === "string" ? node : key;
}
