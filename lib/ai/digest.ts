export type DigestInsight = {
  title: string;
  summary: string;
  theme: string;
  mention_count: number;
  supporting_quotes: string[];
};

export type DigestProblem = {
  problem: string;
  theme: string;
  frequency: number;
  supporting_quotes: string[];
};

export type DigestAction = {
  action: string;
  reason: string;
  supporting_theme: string;
};

export type AIDigest = {
  executive_summary: {
    headline: string;
    summary: string;
  };
  whats_working: DigestInsight[];
  needs_attention: DigestInsight[];
  top_problems: DigestProblem[];
  recommended_actions: DigestAction[];
  analyzed_review_count: number;
};

type DigestReview = {
  review_text: string;
  theme: string;
  sentiment: "Positive" | "Neutral" | "Negative";
};

export function validateDigest(value: unknown, reviews: DigestReview[]): AIDigest {
  if (!isRecord(value) || !isRecord(value.executive_summary)) throw new Error("Digest summary is invalid.");
  const summary = value.executive_summary;
  if (!isText(summary.headline) || !isText(summary.summary)) throw new Error("Digest summary is incomplete.");
  if (!Array.isArray(value.whats_working) || !Array.isArray(value.needs_attention) || !Array.isArray(value.top_problems) || !Array.isArray(value.recommended_actions)) {
    throw new Error("Digest sections are invalid.");
  }

  const themeCounts = new Map<string, number>();
  const quotesByThemeAndSentiment = new Map<string, Set<string>>();
  for (const review of reviews) {
    themeCounts.set(review.theme, (themeCounts.get(review.theme) ?? 0) + 1);
    const key = `${review.theme}\u0000${review.sentiment}`;
    const quotes = quotesByThemeAndSentiment.get(key) ?? new Set<string>();
    quotes.add(review.review_text);
    quotesByThemeAndSentiment.set(key, quotes);
  }

  const validateInsight = (item: unknown, sentiment: "Positive" | "Negative"): DigestInsight => {
    if (!isRecord(item) || !isText(item.title) || !isText(item.summary) || !isText(item.theme) || !Number.isInteger(item.mention_count) || !isQuoteList(item.supporting_quotes)) {
      throw new Error("A digest insight is invalid.");
    }
    verifyThemeCountAndQuotes(item.theme, item.mention_count as number, item.supporting_quotes, sentiment, themeCounts, quotesByThemeAndSentiment);
    return item as DigestInsight;
  };

  const whatsWorking = value.whats_working.map((item) => validateInsight(item, "Positive"));
  const needsAttention = value.needs_attention.map((item) => validateInsight(item, "Negative"));
  const topProblems = value.top_problems.map((item) => {
    if (!isRecord(item) || !isText(item.problem) || !isText(item.theme) || !Number.isInteger(item.frequency) || !isQuoteList(item.supporting_quotes)) {
      throw new Error("A recurring problem is invalid.");
    }
    verifyThemeCountAndQuotes(item.theme, item.frequency as number, item.supporting_quotes, "Negative", themeCounts, quotesByThemeAndSentiment);
    return item as DigestProblem;
  });
  const recommendedActions = value.recommended_actions.map((item) => {
    if (!isRecord(item) || !isText(item.action) || !isText(item.reason) || !isText(item.supporting_theme) || !quotesByThemeAndSentiment.has(`${item.supporting_theme}\u0000Negative`)) {
      throw new Error("A recommended action is invalid.");
    }
    return item as DigestAction;
  });

  return {
    executive_summary: { headline: summary.headline as string, summary: summary.summary as string },
    whats_working: whatsWorking,
    needs_attention: needsAttention,
    top_problems: topProblems,
    recommended_actions: recommendedActions,
    analyzed_review_count: reviews.length,
  };
}

function verifyThemeCountAndQuotes(theme: string, count: number, quotes: string[], sentiment: "Positive" | "Negative", themeCounts: Map<string, number>, quotesByThemeAndSentiment: Map<string, Set<string>>) {
  if (themeCounts.get(theme) !== count) throw new Error(`Digest count for ${theme} does not match the source data.`);
  const eligibleQuotes = quotesByThemeAndSentiment.get(`${theme}\u0000${sentiment}`);
  if (!eligibleQuotes) throw new Error(`Digest section for ${theme} is not supported by ${sentiment.toLowerCase()} reviews.`);
  if (quotes.some((quote) => !eligibleQuotes.has(quote))) throw new Error(`Digest evidence for ${theme} does not match a stored ${sentiment.toLowerCase()} review.`);
}

function isRecord(value: unknown): value is Record<string, unknown> { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function isText(value: unknown): value is string { return typeof value === "string" && value.trim().length > 0; }
function isQuoteList(value: unknown): value is string[] { return Array.isArray(value) && value.length <= 2 && value.every(isText); }

export const digestJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    executive_summary: {
      type: "object",
      additionalProperties: false,
      properties: { headline: { type: "string" }, summary: { type: "string" } },
      required: ["headline", "summary"],
    },
    whats_working: { type: "array", maxItems: 3, items: insightSchema() },
    needs_attention: { type: "array", maxItems: 3, items: insightSchema() },
    top_problems: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          problem: { type: "string" },
          theme: { type: "string" },
          frequency: { type: "integer", minimum: 1 },
          supporting_quotes: { type: "array", maxItems: 2, items: { type: "string" } },
        },
        required: ["problem", "theme", "frequency", "supporting_quotes"],
      },
    },
    recommended_actions: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: { action: { type: "string" }, reason: { type: "string" }, supporting_theme: { type: "string" } },
        required: ["action", "reason", "supporting_theme"],
      },
    },
  },
  required: ["executive_summary", "whats_working", "needs_attention", "top_problems", "recommended_actions"],
} as const;

function insightSchema() {
  return {
    type: "object",
    additionalProperties: false,
    properties: {
      title: { type: "string" },
      summary: { type: "string" },
      theme: { type: "string" },
      mention_count: { type: "integer", minimum: 1 },
      supporting_quotes: { type: "array", maxItems: 2, items: { type: "string" } },
    },
    required: ["title", "summary", "theme", "mention_count", "supporting_quotes"],
  } as const;
}
