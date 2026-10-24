// Port of getFormulaHTML from upstream webapp/IronCalc/src/components/Editor/util.tsx.
//
// Upstream returns JSX spans; here the same spans are plain data that the
// editor renders (see Editor.svelte), so the logic stays testable without a
// renderer. Every other function of util.tsx is carried unchanged in
// src/lib/upstream/components/Editor/util.ts; the private helpers below are
// the ones only getFormulaHTML uses, copied verbatim.
import {
  type CellArrayStructure,
  getTokens,
  type Model,
  type TokenType,
} from "@ironcalc/wasm";
import {
  getColor,
  isInReferenceMode,
  tokenIsRangeType,
  tokenIsReferenceType,
} from "../../upstream/components/Editor/util";
import type { ActiveRange } from "../../upstream/components/workbookState";

/**
 * One span of the highlighted formula: a run of formula text (with the color
 * of the reference it shows, if any), or the reference-insertion hint.
 */
export type FormulaSegment =
  { kind: "text"; text: string; color?: string } | { kind: "hint" };

function sliceString(
  text: string,
  startScalar: number,
  endScalar: number,
): string {
  const scalarValues = Array.from(text);
  const sliced = scalarValues.slice(startScalar, endScalar);
  return sliced.join("");
}

function isDynamicAnchor(
  structure: CellArrayStructure,
): structure is { DynamicAnchor: [number, number] } {
  return typeof structure === "object" && "DynamicAnchor" in structure;
}

// A token that begins an operand: a value, a name/function, a reference/range,
// or an opening delimiter of a grouped expression or array. When such a token
// sits right after the caret there is already an operand there, so the caret is
// not in an empty slot and the reference-insertion hint must not be shown (e.g.
// `=|SUM(...)`, where the function name follows the caret).
function tokenStartsOperand(token: TokenType): boolean {
  if (typeof token === "object") {
    return (
      "Ident" in token ||
      "Number" in token ||
      "String" in token ||
      "Boolean" in token ||
      "Reference" in token ||
      "Range" in token
    );
  }
  return token === "LeftParenthesis" || token === "LeftBrace";
}

// The argument separator tokens (`,` in English locales, `;` otherwise).
function tokenIsArgumentSeparator(token: TokenType): boolean {
  return token === "Comma" || token === "Semicolon";
}

// A placeholder shown when the caret sits at a position where a reference could
// be inserted (e.g. `=SUM(|`). It carries no formula text; it only hints to the
// user that arrow keys / clicking a cell will insert a reference here. The
// editor renders it with the `ic-insert-range-hint` class, a styling hook
// designers can restyle later.
const referenceHint: FormulaSegment = { kind: "hint" };

function getFormulaHTML(
  model: Model,
  text: string,
  cursor?: number,
): { html: FormulaSegment[]; activeRanges: ActiveRange[] } {
  let html: FormulaSegment[] = [];
  const activeRanges: ActiveRange[] = [];
  let colorCount = 0;
  if (text.startsWith("=")) {
    const formula = text.slice(1);
    const tokens = getTokens(formula);
    const tokenCount = tokens.length;
    const usedColors: Record<string, string> = {};
    const sheet = model.getSelectedSheet();
    const sheetList = model.getWorksheetsProperties().map((s) => s.name);

    // The reference-insertion hint is shown when the caret is in "reference
    // mode" (the grammar would accept a reference here) and no reference already
    // sits immediately after the caret. We resolve where in the rendered spans
    // it belongs by finding the first token starting at/after the caret.
    const inReferenceMode =
      cursor !== undefined && isInReferenceMode(model, text, cursor);
    // Caret as a scalar offset into `formula` (drop the leading `=`).
    const scalarCursor =
      cursor === undefined ? -1 : Array.from(text.slice(0, cursor)).length - 1;
    let hintHandled = false;

    for (let index = 0; index < tokenCount; index += 1) {
      const { token, start, end } = tokens[index];
      const isReference = tokenIsReferenceType(token);
      const isRange = tokenIsRangeType(token);

      // The hint belongs right before the first token that begins at/after the
      // caret. Suppress it when the caret is not actually in an empty operand
      // slot:
      //   * the following token already starts an operand (`=|SUM(...)`,
      //     `=A1+|B2`) — the reference/value is there, nothing to insert;
      //   * the caret sits in an empty trailing argument, i.e. right after a
      //     separator and immediately before `)` (`=SUM(A1,|)`). Note this is
      //     distinct from `=SUM(|)`, whose previous token is `(`, not a
      //     separator, and which does mark an insertable first argument.
      if (inReferenceMode && !hintHandled && start >= scalarCursor) {
        const previousToken = index > 0 ? tokens[index - 1].token : undefined;
        const emptyTrailingArgument =
          token === "RightParenthesis" &&
          previousToken !== undefined &&
          tokenIsArgumentSeparator(previousToken);
        if (!tokenStartsOperand(token) && !emptyTrailingArgument) {
          html.push(referenceHint);
        }
        hintHandled = true;
      }

      // is next token the spill operator? If so, we want to include it in the reference
      if (
        isReference &&
        tokens[index + 1] &&
        tokens[index + 1].token === "Spill"
      ) {
        const { sheet: refSheet, row, column } = token.Reference;
        const sheetIndex = refSheet ? sheetList.indexOf(refSheet) : sheet;
        const structure = model.getCellArrayStructure(sheetIndex, row, column);
        if (isDynamicAnchor(structure)) {
          const [width, height] = structure.DynamicAnchor;
          const rowEnd = row + height - 1;
          const columnEnd = column + width - 1;
          const key = `${sheetIndex}-${row}-${column}:${rowEnd}-${columnEnd}`;
          let color = usedColors[key];
          if (!color) {
            color = getColor(colorCount);
            usedColors[key] = color;
            colorCount += 1;
          }

          // we need the whole reference A27# (so from the beginning of the reference to the end of the spill operator)
          html.push({
            kind: "text",
            text: sliceString(formula, start, tokens[index + 1].end),
            color,
          });

          activeRanges.push({
            sheet: sheetIndex,
            rowStart: row,
            columnStart: column,
            rowEnd,
            columnEnd,
            color,
          });
        } else {
          // If the reference is not a dynamic anchor, we treat as text
          html.push({
            kind: "text",
            text: sliceString(formula, start, tokens[index + 1].end),
          });
        }
        // Skip the next token since we already processed it
        index += 1;
      } else if (isReference) {
        const { sheet: refSheet, row, column } = token.Reference;
        const sheetIndex = refSheet ? sheetList.indexOf(refSheet) : sheet;
        const key = `${sheetIndex}-${row}-${column}`;
        let color = usedColors[key];
        if (!color) {
          color = getColor(colorCount);
          usedColors[key] = color;
          colorCount += 1;
        }
        html.push({
          kind: "text",
          text: sliceString(formula, start, end),
          color,
        });
        activeRanges.push({
          sheet: sheetIndex,
          rowStart: row,
          columnStart: column,
          rowEnd: row,
          columnEnd: column,
          color,
        });
      } else if (isRange) {
        let {
          sheet: refSheet,
          left: { row: rowStart, column: columnStart },
          right: { row: rowEnd, column: columnEnd },
        } = token.Range;
        const sheetIndex = refSheet ? sheetList.indexOf(refSheet) : sheet;

        const key = `${sheetIndex}-${rowStart}-${columnStart}:${rowEnd}-${columnEnd}`;
        let color = usedColors[key];
        if (!color) {
          color = getColor(colorCount);
          usedColors[key] = color;
          colorCount += 1;
        }

        if (rowStart > rowEnd) {
          [rowStart, rowEnd] = [rowEnd, rowStart];
        }
        if (columnStart > columnEnd) {
          [columnStart, columnEnd] = [columnEnd, columnStart];
        }
        html.push({
          kind: "text",
          text: sliceString(formula, start, end),
          color,
        });

        activeRanges.push({
          sheet: sheetIndex,
          rowStart,
          columnStart,
          rowEnd,
          columnEnd,
          color,
        });
      } else {
        html.push({ kind: "text", text: sliceString(formula, start, end) });
      }
    }
    // The caret sits past every token (e.g. `=SUM(`): append the hint at the end.
    if (inReferenceMode && !hintHandled) {
      html.push(referenceHint);
    }
    html = [{ kind: "text", text: "=" } as FormulaSegment].concat(html);
  } else {
    html = [{ kind: "text", text }];
  }
  // Add a trailing character if text ends with newline to ensure selector's height grows
  if (text.endsWith("\n")) {
    html.push({ kind: "text", text: "\n" });
  }
  return { html, activeRanges };
}

export { getFormulaHTML };
export default getFormulaHTML;
