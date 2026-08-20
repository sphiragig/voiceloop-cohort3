import { updateReviewAnalysis, type StoredReview } from "@/lib/supabase/reviews";
import { isReviewAnalysis, type ReviewAnalysis } from "./review-analysis";

const batchSize = 10;

export type AnalysisSummary = {
  analyzed: number;
  failed: number;
  errors: string[];
};

export async function analyzeReviews(reviews: StoredReview[]): Promise<AnalysisSummary> {
  const pending = reviews.filter((review) => !review.theme && !review.sentiment);
  const summary: AnalysisSummary = { analyzed: 0, failed: 0, errors: [] };

  for (let index = 0; index < pending.length; index += batchSize) {
    const batch = pending.slice(index, index + batchSize);
    try {
      const response = await fetch("/api/reviews/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviews: batch.map(({ id, review_text }) => ({ id, review_text })),
        }),
      });
      const payload = await response.json() as { results?: unknown; error?: string };
      if (!response.ok) throw new Error(payload.error ?? "AI analysis failed.");
      if (!Array.isArray(payload.results) || !payload.results.every(isReviewAnalysis)) {
        throw new Error("The analysis response was invalid.");
      }

      const results = payload.results as ReviewAnalysis[];
      const updates = await Promise.allSettled(results.map(updateReviewAnalysis));
      updates.forEach((result) => {
        if (result.status === "fulfilled") summary.analyzed += 1;
        else {
          summary.failed += 1;
          summary.errors.push(result.reason instanceof Error ? result.reason.message : "A review could not be updated.");
        }
      });
    } catch (error) {
      summary.failed += batch.length;
      summary.errors.push(error instanceof Error ? error.message : "A batch could not be analyzed.");
    }
  }

  return summary;
}
