// xlsx import and export.
//
// The engine package `@ironcalc/wasm` has no xlsx support; upstream ships it
// in the separate `@ironcalc/wasm-xlsx` build of the same crate. The widget
// works with `@ironcalc/wasm` models, so this module converts through the
// engine's own byte format: both builds come from the same release and read
// each other's `toBytes()` output. Import it as `ironcalc-svelte/xlsx` so the
// widget alone does not pull in the larger xlsx build.
import { Model } from "@ironcalc/wasm";
import initXlsxWasm, { Model as XlsxModel } from "@ironcalc/wasm-xlsx";

export interface XlsxOptions {
  locale?: string;
  timezone?: string;
  language?: string;
}

/** Initializes the `@ironcalc/wasm-xlsx` module; call once before the functions below. */
export const initXlsx: typeof initXlsxWasm = (moduleOrPath) =>
  initXlsxWasm(moduleOrPath);

/** Loads the bytes of an .xlsx file into a model the widget can show. */
export function modelFromXlsx(
  bytes: Uint8Array,
  name: string,
  options: XlsxOptions = {},
): Model {
  const { locale = "en", timezone = "UTC", language = "en" } = options;
  const xlsxModel = XlsxModel.fromXlsx(bytes, name, locale, timezone, language);
  try {
    return Model.fromBytes(xlsxModel.toBytes(), language);
  } finally {
    xlsxModel.free();
  }
}

/** Returns the bytes of an .xlsx file holding the current state of the model. */
export function modelToXlsx(model: Model): Uint8Array {
  const xlsxModel = XlsxModel.fromBytes(model.toBytes(), model.getLanguage());
  try {
    return xlsxModel.toXlsx();
  } finally {
    xlsxModel.free();
  }
}

/** Saves the model as an .xlsx file through a browser download. */
export function downloadXlsx(model: Model, fileName = "workbook.xlsx"): void {
  const bytes = modelToXlsx(model);
  const blob = new Blob([bytes as BlobPart], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName.endsWith(".xlsx") ? fileName : `${fileName}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}
