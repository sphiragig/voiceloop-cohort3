import { supabase } from "./client";

type DashboardReview = {
  rating: number | null;
  sentiment: "Positive" | "Neutral" | "Negative" | null;
  theme: string | null;
  source: string | null;
};

export type DashboardCount = {
  name: string;
  count: number;
};

export type DashboardData = {
  totalReviews: number;
  averageRating: number | null;
  ratingCount: number;
  analyzedCount: number;
  unanalyzedCount: number;
  positivePercentage: number | null;
  negativeCount: number;
  themes: DashboardCount[];
  sentiments: {
    Positive: number;
    Neutral: number;
    Negative: number;
  };
  sources: DashboardCount[];
  insight: string | null;
};

const pageSize = 1000;

export async function fetchDashboardData(): Promise<DashboardData> {
  const reviews: DashboardReview[] = [];

  for (let start = 0; ; start += pageSize) {
    const { data, error } = await supabase
      .from("reviews")
      .select("rating,sentiment,theme,source")
      .range(start, start + pageSize - 1);
    if (error) throw new Error(error.message);
    const page = (data ?? []) as DashboardReview[];
    reviews.push(...page);
    if (page.length < pageSize) break;
  }

  return calculateDashboardData(reviews);
}

export function calculateDashboardData(reviews: DashboardReview[]): DashboardData {
  const ratings = reviews.flatMap((review) => review.rating === null ? [] : [review.rating]);
  const sentiments = { Positive: 0, Neutral: 0, Negative: 0 };
  const themeCounts = new Map<string, number>();
  const negativeThemeCounts = new Map<string, number>();
  const sourceCounts = new Map<string, number>();

  for (const review of reviews) {
    if (review.sentiment) sentiments[review.sentiment] += 1;
    const theme = review.theme?.trim();
    if (theme) {
      themeCounts.set(theme, (themeCounts.get(theme) ?? 0) + 1);
      if (review.sentiment === "Negative") {
        negativeThemeCounts.set(theme, (negativeThemeCounts.get(theme) ?? 0) + 1);
      }
    }
    const source = review.source?.trim();
    if (source) sourceCounts.set(source, (sourceCounts.get(source) ?? 0) + 1);
  }

  const analyzedCount = sentiments.Positive + sentiments.Neutral + sentiments.Negative;
  const themes = sortedCounts(themeCounts).slice(0, 5);
  const sources = sortedCounts(sourceCounts);
  const topNegativeTheme = sortedCounts(negativeThemeCounts)[0];

  return {
    totalReviews: reviews.length,
    averageRating: ratings.length
      ? ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
      : null,
    ratingCount: ratings.length,
    analyzedCount,
    unanalyzedCount: reviews.length - analyzedCount,
    positivePercentage: analyzedCount
      ? (sentiments.Positive / analyzedCount) * 100
      : null,
    negativeCount: sentiments.Negative,
    themes,
    sentiments,
    sources,
    insight: buildInsight(themes[0], topNegativeTheme),
  };
}

function sortedCounts(counts: Map<string, number>): DashboardCount[] {
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name));
}

function buildInsight(topTheme?: DashboardCount, topNegativeTheme?: DashboardCount) {
  if (!topTheme) return null;
  if (!topNegativeTheme) {
    return `${topTheme.name} is the most frequently mentioned theme. There are no analyzed negative reviews yet.`;
  }
  if (topTheme.name === topNegativeTheme.name) {
    return `${topTheme.name} is the most frequently mentioned theme and also has the highest number of negative reviews.`;
  }
  return `${topTheme.name} is the most frequently mentioned theme, while ${topNegativeTheme.name} has the highest number of negative reviews.`;
}
