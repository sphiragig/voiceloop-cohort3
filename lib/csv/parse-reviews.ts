import Papa from "papaparse";

export type ReviewInsert = {
  review_text: string;
  rating: number | null;
  review_date: string | null;
  source: string | null;
  reviewer_name: string | null;
  sentiment: null;
  theme: null;
};

export type CsvParseResult =
  | { ok: true; rows: ReviewInsert[]; warnings: string[] }
  | { ok: false; error: string };

const requiredColumn = "review_text";
const supportedColumns = new Set([
  requiredColumn,
  "rating",
  "review_date",
  "source",
  "reviewer_name",
]);

export function parseReviewCsv(csv: string): CsvParseResult {
  if (!csv.trim()) {
    return { ok: false, error: "The CSV is empty. Add a header and at least one review." };
  }

  const result = Papa.parse<Record<string, string>>(csv, {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (header) => header.trim().toLowerCase(),
  });

  if (result.errors.length > 0) {
    const firstError = result.errors[0];
    const location = typeof firstError.row === "number" ? ` near row ${firstError.row + 2}` : "";
    return { ok: false, error: `The CSV could not be parsed${location}: ${firstError.message}` };
  }

  const fields = result.meta.fields ?? [];
  if (!fields.includes(requiredColumn)) {
    return { ok: false, error: "Missing required column: review_text." };
  }

  const duplicateFields = fields.filter((field, index) => fields.indexOf(field) !== index);
  if (duplicateFields.length > 0) {
    return { ok: false, error: `Duplicate column: ${duplicateFields[0]}.` };
  }

  const unknownFields = fields.filter((field) => !supportedColumns.has(field));
  const warnings = unknownFields.length > 0
    ? [`Ignored unsupported columns: ${unknownFields.join(", ")}.`]
    : [];
  const rows: ReviewInsert[] = [];
  const invalidRows: string[] = [];

  result.data.forEach((row, index) => {
    const rowNumber = index + 2;
    const reviewText = row.review_text?.trim() ?? "";
    if (!reviewText) {
      invalidRows.push(`Row ${rowNumber}: review_text is empty.`);
      return;
    }

    const ratingResult = parseRating(row.rating);
    if (!ratingResult.ok) {
      invalidRows.push(`Row ${rowNumber}: rating must be a whole number from 1 to 5.`);
      return;
    }

    const dateResult = parseDate(row.review_date);
    if (!dateResult.ok) {
      invalidRows.push(`Row ${rowNumber}: review_date must use YYYY-MM-DD.`);
      return;
    }

    rows.push({
      review_text: reviewText,
      rating: ratingResult.value,
      review_date: dateResult.value,
      source: nullableText(row.source),
      reviewer_name: nullableText(row.reviewer_name),
      sentiment: null,
      theme: null,
    });
  });

  if (rows.length === 0) {
    const detail = invalidRows[0] ? ` ${invalidRows[0]}` : "";
    return { ok: false, error: `No valid review rows were found.${detail}` };
  }

  if (invalidRows.length > 0) {
    warnings.push(
      `${invalidRows.length} invalid ${invalidRows.length === 1 ? "row was" : "rows were"} skipped.`,
      ...invalidRows.slice(0, 3),
    );
  }

  return { ok: true, rows, warnings };
}

function nullableText(value: string | undefined) {
  const normalized = value?.trim();
  return normalized ? normalized : null;
}

function parseRating(value: string | undefined): { ok: true; value: number | null } | { ok: false } {
  const normalized = value?.trim();
  if (!normalized) return { ok: true, value: null };
  if (!/^[1-5]$/.test(normalized)) return { ok: false };
  return { ok: true, value: Number(normalized) };
}

function parseDate(value: string | undefined): { ok: true; value: string | null } | { ok: false } {
  const normalized = value?.trim();
  if (!normalized) return { ok: true, value: null };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized)) return { ok: false };
  const date = new Date(`${normalized}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== normalized) return { ok: false };
  return { ok: true, value: normalized };
}
