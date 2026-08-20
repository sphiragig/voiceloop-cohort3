import OpenAI from "openai";
import { NextResponse } from "next/server";
import {
  isReviewAnalysis,
  restaurantThemes,
  sentiments,
  type ReviewForAnalysis,
} from "@/lib/ai/review-analysis";

export const runtime = "nodejs";

const batchSize = 10;

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI analysis is not configured. Add OPENAI_API_KEY to .env.local." },
      { status: 503 },
    );
  }

  let reviews: ReviewForAnalysis[];
  try {
    const body = await request.json() as { reviews?: unknown };
    if (!Array.isArray(body.reviews) || body.reviews.length === 0 || body.reviews.length > batchSize) {
      throw new Error(`Provide between 1 and ${batchSize} reviews.`);
    }
    reviews = body.reviews.map((review) => {
      if (!review || typeof review !== "object") throw new Error("Each review must be an object.");
      const candidate = review as Record<string, unknown>;
      if (typeof candidate.id !== "string" || typeof candidate.review_text !== "string" || !candidate.review_text.trim()) {
        throw new Error("Each review requires an id and non-empty review_text.");
      }
      return { id: candidate.id, review_text: candidate.review_text.slice(0, 8000) };
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid analysis request." },
      { status: 400 },
    );
  }

  try {
    const openai = new OpenAI({ apiKey });
    const response = await openai.responses.create({
      model: "gpt-5-mini",
      store: false,
      instructions: [
        "Classify restaurant reviews. Return exactly one result for every supplied review id.",
        "Choose the single dominant theme. Use Neutral for mixed or average feedback.",
        "Wait Time is time before seating, ordering, or attention; Service Speed is slow service or fulfillment after service begins.",
        "Never alter or omit an id.",
      ].join(" "),
      input: JSON.stringify({ reviews }),
      text: {
        format: {
          type: "json_schema",
          name: "restaurant_review_analysis",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              results: {
                type: "array",
                minItems: reviews.length,
                maxItems: reviews.length,
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    id: { type: "string" },
                    theme: { type: "string", enum: [...restaurantThemes] },
                    sentiment: { type: "string", enum: [...sentiments] },
                  },
                  required: ["id", "theme", "sentiment"],
                },
              },
            },
            required: ["results"],
          },
        },
      },
    });

    const parsed = JSON.parse(response.output_text) as { results?: unknown };
    if (!Array.isArray(parsed.results) || !parsed.results.every(isReviewAnalysis)) {
      throw new Error("OpenAI returned an invalid analysis result.");
    }
    const requestedIds = new Set(reviews.map((review) => review.id));
    const returnedIds = new Set(parsed.results.map((result) => result.id));
    if (returnedIds.size !== requestedIds.size || [...returnedIds].some((id) => !requestedIds.has(id))) {
      throw new Error("OpenAI returned mismatched review ids.");
    }

    return NextResponse.json({ results: parsed.results });
  } catch (error) {
    console.error("Review analysis failed", error);
    return NextResponse.json(
      { error: "AI analysis failed. Your uploaded reviews are safe; try again later." },
      { status: 502 },
    );
  }
}
