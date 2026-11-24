const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? "" : String(value);

  if (FORMULA_PREFIX.test(text)) {
    text = `'${text}`;
  }

  if (/[",\r\n]/.test(text)) {
    text = `"${text.replace(/"/g, '""')}"`;
  }

  return text;
}

export function toCsv(rows: unknown[][]): string {
  const body = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return `\uFEFF${body}`;
}
