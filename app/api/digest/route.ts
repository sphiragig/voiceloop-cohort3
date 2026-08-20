import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { digestJsonSchema, validateDigest } from "@/lib/ai/digest";

export const runtime = "nodejs";

const reviewLimit = 100;

type DigestReview = {
  review_text: string;
  rating: number | null;
  theme: string;
  sentiment: "Positive" | "Neutral" | "Negative";
};

export async function POST() {
  const apiKey = process.env.OPENAI_API_KEY;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!apiKey) return NextResponse.json({ error: "AI Digest is not configured. Add OPENAI_API_KEY to .env.local." }, { status: 503 });
  if (!supabaseUrl || !supabaseAnonKey) return NextResponse.json({ error: "Supabase is not configured." }, { status: 503 });

  const supabase = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
  const { data, error } = await supabase
    .from("reviews")
    .select("review_text,rating,theme,sentiment")
    .not("theme", "is", null)
    .not("sentiment", "is", null)
    .order("created_at", { ascending: false })
    .limit(reviewLimit);

  if (error) return NextResponse.json({ error: "Reviews could not be loaded for the digest." }, { status: 502 });
  if (!data?.length) return NextResponse.json({ error: "No analyzed reviews are available. Analyze reviews before generating a digest." }, { status: 422 });

  const reviews = data as DigestReview[];
  const themeCounts = reviews.reduce<Record<string, number>>((counts, review) => {
    counts[review.theme] = (counts[review.theme] ?? 0) + 1;
    return counts;
  }, {});
  const positiveQuotesByTheme = quotePool(reviews, "Positive");
  const negativeQuotesByTheme = quotePool(reviews, "Negative");

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      store: false,
      instructions: [
        "Create a concise restaurant feedback digest using only the supplied analyzed reviews.",
        "Never invent a theme, count, quote, problem, or action rationale.",
        "Every mention_count and frequency must exactly equal the supplied theme_counts value for that theme.",
        "Every supporting quote must be copied verbatim as the complete review_text of an eligible quote supplied for that section and theme.",
        "Use zero to two supporting quotes per item. Use empty arrays when the data does not support a section.",
        "What's working should be supported by positive reviews. Needs attention and top problems should be supported by negative reviews.",
        "Recommended actions must correspond to a real supplied theme and an evidenced issue. If there are no evidenced issues, return no recommended actions.",
      ].join(" "),
      input: JSON.stringify({ theme_counts: themeCounts, positive_quotes_by_theme: positiveQuotesByTheme, negative_quotes_by_theme: negativeQuotesByTheme, reviews }),
      text: {
        format: {
          type: "json_schema",
          name: "voice_loop_ai_digest",
          strict: true,
          schema: digestJsonSchema,
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as unknown;
    const digest = validateDigest(parsed, reviews);
    return NextResponse.json({ digest });
  } catch (digestError) {
    console.error("AI Digest generation failed", digestError);
    return NextResponse.json({ error: "AI Digest generation failed validation. Your reviews are safe; please try again." }, { status: 502 });
  }
}

function quotePool(reviews: DigestReview[], sentiment: DigestReview["sentiment"]) {
  return reviews.reduce<Record<string, string[]>>((pool, review) => {
    if (review.sentiment === sentiment) (pool[review.theme] ??= []).push(review.review_text);
    return pool;
  }, {});
}
