import { supabase } from "./client";
import type { ReviewInsert } from "@/lib/csv/parse-reviews";
import type { ReviewAnalysis } from "@/lib/ai/review-analysis";

export type StoredReview = {
  id: string;
  review_text: string;
  rating: number | null;
  review_date: string | null;
  source: string | null;
  reviewer_name: string | null;
  sentiment: "Positive" | "Neutral" | "Negative" | null;
  theme: string | null;
  created_at: string;
};

export type ReviewSort = "new" | "old";

export type ReviewQuery = {
  search: string;
  source: string;
  dateFrom: string;
  dateTo: string;
  sort: ReviewSort;
  page: number;
  pageSize: number;
};

const reviewColumns = "id,review_text,rating,review_date,source,reviewer_name,sentiment,theme,created_at";

export async function insertReviews(rows: ReviewInsert[]) {
  const inserted: StoredReview[] = [];
  for (let index = 0; index < rows.length; index += 250) {
    const batch = rows.slice(index, index + 250);
    const { data, error } = await supabase.from("reviews").insert(batch).select(reviewColumns);
    if (error) throw new Error(error.message);
    inserted.push(...((data ?? []) as StoredReview[]));
  }
  return inserted;
}

export async function updateReviewAnalysis(result: ReviewAnalysis) {
  const { data, error } = await supabase
    .from("reviews")
    .update({ theme: result.theme, sentiment: result.sentiment })
    .eq("id", result.id)
    .is("theme", null)
    .is("sentiment", null)
    .select("id")
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Review ${result.id} was not updated.`);
}

export async function fetchReviews(filters: ReviewQuery) {
  const start = (filters.page - 1) * filters.pageSize;
  const end = start + filters.pageSize - 1;
  const ascending = filters.sort === "old";
  let query = supabase
    .from("reviews")
    .select(reviewColumns, { count: "exact" });

  if (filters.search.trim()) {
    const safeSearch = filters.search.trim().replace(/[%,]/g, " ");
    query = query.ilike("review_text", `%${safeSearch}%`);
  }
  if (filters.source) query = query.eq("source", filters.source);
  if (filters.dateFrom) query = query.gte("review_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("review_date", filters.dateTo);

  const { data, error, count } = await query
    .order("review_date", { ascending, nullsFirst: false })
    .order("created_at", { ascending })
    .range(start, end);

  if (error) throw new Error(error.message);
  return { reviews: (data ?? []) as StoredReview[], count: count ?? 0 };
}

export async function fetchReviewSources() {
  const { data, error } = await supabase
    .from("reviews")
    .select("source")
    .not("source", "is", null)
    .limit(1000);
  if (error) throw new Error(error.message);
  return [...new Set((data ?? []).map((row) => row.source).filter(Boolean) as string[])].sort();
}

export async function fetchReviewsByTheme(theme: string) {
  const { data, error } = await supabase
    .from("reviews")
    .select(reviewColumns)
    .eq("theme", theme)
    .order("review_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as StoredReview[];
}
