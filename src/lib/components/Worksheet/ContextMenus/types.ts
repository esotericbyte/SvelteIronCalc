// The selected range as the header context menus show it (upstream passes
// the same object to both).
export interface HeaderRange {
  rowStart: number;
  columnStart: string;
  rowEnd: number;
  columnEnd: string;
  columnCount: number;
}
