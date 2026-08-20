export type Sentiment = "Positive" | "Neutral" | "Negative";

export type Theme =
  | "Food quality"
  | "Service speed"
  | "Staff friendliness"
  | "Atmosphere"
  | "Value";

export type Review = {
  id: number;
  text: string;
  sentiment: Sentiment;
  theme: Theme;
  rating: number;
  source: "Google" | "Yelp" | "OpenTable";
  date: string;
};

export const reviews: Review[] = [
  { id: 1, text: "The mushroom toast was outstanding and everything tasted incredibly fresh. We will absolutely be back for brunch.", sentiment: "Positive", theme: "Food quality", rating: 5, source: "Google", date: "2026-08-18" },
  { id: 2, text: "Lovely staff, but we waited almost 25 minutes before anyone took our drink order.", sentiment: "Negative", theme: "Service speed", rating: 2, source: "Yelp", date: "2026-08-17" },
  { id: 3, text: "Our server remembered the allergy note and checked every dish with the kitchen.", sentiment: "Positive", theme: "Staff friendliness", rating: 5, source: "OpenTable", date: "2026-08-16" },
  { id: 4, text: "Beautiful room and good music. It felt lively without being too loud.", sentiment: "Positive", theme: "Atmosphere", rating: 4, source: "Google", date: "2026-08-13" },
  { id: 5, text: "Dinner was tasty, although the portions felt small for the price.", sentiment: "Neutral", theme: "Value", rating: 3, source: "Yelp", date: "2026-08-10" },
  { id: 6, text: "The seasonal pasta and citrus salad were the best dishes we had all weekend.", sentiment: "Positive", theme: "Food quality", rating: 5, source: "Google", date: "2026-08-08" },
  { id: 7, text: "We had a reservation but still stood by the door for twenty minutes.", sentiment: "Negative", theme: "Service speed", rating: 2, source: "OpenTable", date: "2026-08-07" },
  { id: 8, text: "Friendly greeting and attentive recommendations from our server.", sentiment: "Positive", theme: "Staff friendliness", rating: 5, source: "Google", date: "2026-08-04" },
  { id: 9, text: "The patio is charming, though traffic noise made it difficult to relax.", sentiment: "Neutral", theme: "Atmosphere", rating: 3, source: "Yelp", date: "2026-07-31" },
  { id: 10, text: "Great ingredients, but our entrées arrived lukewarm and at different times.", sentiment: "Negative", theme: "Food quality", rating: 2, source: "Google", date: "2026-07-27" },
  { id: 11, text: "Solid neighborhood option. Lunch pricing is fair and the set menu is a good deal.", sentiment: "Positive", theme: "Value", rating: 4, source: "Google", date: "2026-07-23" },
  { id: 12, text: "Dessert was excellent, but getting the check took longer than the meal itself.", sentiment: "Negative", theme: "Service speed", rating: 3, source: "OpenTable", date: "2026-07-21" },
];

export const themes: { name: Theme; count: number }[] = [
  { name: "Food quality", count: 96 },
  { name: "Service speed", count: 64 },
  { name: "Staff friendliness", count: 58 },
  { name: "Atmosphere", count: 42 },
  { name: "Value", count: 31 },
];
