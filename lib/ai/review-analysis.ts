export const restaurantThemes = [
  "Food Quality",
  "Service Speed",
  "Staff Friendliness",
  "Wait Time",
  "Atmosphere",
  "Cleanliness",
  "Value",
  "Parking",
  "Ordering / Delivery",
  "Other",
] as const;

export const sentiments = ["Positive", "Neutral", "Negative"] as const;

export type RestaurantTheme = (typeof restaurantThemes)[number];
export type Sentiment = (typeof sentiments)[number];

export type ReviewForAnalysis = {
  id: string;
  review_text: string;
};

export type ReviewAnalysis = {
  id: string;
  theme: RestaurantTheme;
  sentiment: Sentiment;
};

export function isReviewAnalysis(value: unknown): value is ReviewAnalysis {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  return typeof result.id === "string"
    && restaurantThemes.includes(result.theme as RestaurantTheme)
    && sentiments.includes(result.sentiment as Sentiment);
}
