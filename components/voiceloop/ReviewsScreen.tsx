"use client";

import { useMemo, useState } from "react";
import { reviews, themes, type Review, type Sentiment, type Theme } from "@/lib/reviews";
import { Card, OutlineButton, SectionHeading } from "./AppShell";
import { SearchIcon } from "./icons";

type Sort = "new" | "old" | "high" | "low";
const pageSize = 6;

export function ReviewsScreen({ onEvidence }: { onEvidence: (theme: Theme) => void }) {
  const [search, setSearch] = useState("");
  const [sentiment, setSentiment] = useState<"all" | Sentiment>("all");
  const [theme, setTheme] = useState<"all" | Theme>("all");
  const [sort, setSort] = useState<Sort>("new");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => reviews.filter((review) => (!search || review.text.toLowerCase().includes(search.toLowerCase())) && (sentiment === "all" || review.sentiment === sentiment) && (theme === "all" || review.theme === theme)).sort((a, b) => sort === "old" ? a.date.localeCompare(b.date) : sort === "high" ? b.rating - a.rating : sort === "low" ? a.rating - b.rating : b.date.localeCompare(a.date)), [search, sentiment, theme, sort]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pages);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);
  const resetPage = (change: () => void) => { change(); setPage(1); };
  const clear = () => { setSearch(""); setSentiment("all"); setTheme("all"); setSort("new"); setPage(1); };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="REVIEW EXPLORER" title="All customer reviews" description={`${filtered.length} reviews match your filters.`} action={<OutlineButton onClick={clear}>Clear filters</OutlineButton>} />
      <Card className="mb-5 grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-[2fr_1fr_1fr_1fr]">
        <label className="relative"><span className="sr-only">Search reviews</span><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => resetPage(() => setSearch(event.target.value))} type="search" placeholder="Search review text…" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <Select label="Sentiment" value={sentiment} onChange={(value) => resetPage(() => setSentiment(value as "all" | Sentiment))} options={["all", "Positive", "Neutral", "Negative"]} />
        <Select label="Theme" value={theme} onChange={(value) => resetPage(() => setTheme(value as "all" | Theme))} options={["all", ...themes.map((item) => item.name)]} />
        <Select label="Sort" value={sort} onChange={(value) => resetPage(() => setSort(value as Sort))} options={["new", "old", "high", "low"]} labels={{ new: "Newest first", old: "Oldest first", high: "Rating: high to low", low: "Rating: low to high" }} />
      </Card>
      <Card className="overflow-hidden">
        {visible.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><Th>Review</Th><Th>Sentiment</Th><Th>Theme</Th><Th>Rating</Th><Th>Source</Th><Th>Date</Th></tr></thead><tbody>{visible.map((review) => <ReviewRow key={review.id} review={review} onEvidence={onEvidence} />)}</tbody></table></div><div className="divide-y divide-slate-200 lg:hidden">{visible.map((review) => <ReviewCard key={review.id} review={review} onEvidence={onEvidence} />)}</div></> : <div className="px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><SearchIcon className="size-5"/></div><h3 className="mt-4 font-bold">No reviews found</h3><p className="mt-1 text-sm text-slate-500">Try changing your search or filters.</p></div>}
        <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-4 py-4"><button disabled={safePage === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-35">←</button><span className="text-sm text-slate-600">Page {safePage} of {pages}</span><button disabled={safePage === pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-35">→</button></div>
      </Card>
    </section>
  );
}

function Select({ label, value, onChange, options, labels = {} }: { label: string; value: string; onChange: (value: string) => void; options: string[]; labels?: Record<string, string> }) { return <label><span className="sr-only">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100">{options.map((option) => <option key={option} value={option}>{labels[option] ?? (option === "all" ? `All ${label.toLowerCase()}` : option)}</option>)}</select></label>; }
function Th({ children }: { children: React.ReactNode }) { return <th className="border-b border-slate-200 px-4 py-3 font-bold">{children}</th>; }
function ReviewRow({ review, onEvidence }: { review: Review; onEvidence: (theme: Theme) => void }) { return <tr className="transition hover:bg-slate-50"><td className="max-w-sm border-b border-slate-200 px-4 py-4 text-sm leading-6 text-slate-700">{review.text}</td><td className="border-b border-slate-200 px-4 py-4"><SentimentBadge sentiment={review.sentiment}/></td><td className="border-b border-slate-200 px-4 py-4"><button onClick={() => onEvidence(review.theme)} className="text-sm font-semibold text-blue-600 hover:text-blue-700">{review.theme}</button></td><td className="border-b border-slate-200 px-4 py-4 text-sm text-amber-500" aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}<span className="text-slate-200">{"★".repeat(5-review.rating)}</span></td><td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600">{review.source}</td><td className="whitespace-nowrap border-b border-slate-200 px-4 py-4 text-sm text-slate-600">{formatDate(review.date)}</td></tr>; }
function ReviewCard({ review, onEvidence }: { review: Review; onEvidence: (theme: Theme) => void }) { return <article className="p-5"><div className="flex items-center justify-between gap-3"><SentimentBadge sentiment={review.sentiment}/><span className="text-sm text-amber-500">{"★".repeat(review.rating)}<span className="text-slate-200">{"★".repeat(5-review.rating)}</span></span></div><p className="mt-3 text-sm leading-6 text-slate-700">{review.text}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><button onClick={() => onEvidence(review.theme)} className="font-semibold text-blue-600">{review.theme}</button><span>{review.source} · {formatDate(review.date)}</span></div></article>; }
function SentimentBadge({ sentiment }: { sentiment: Sentiment }) { const color = sentiment === "Positive" ? "bg-emerald-100 text-emerald-800" : sentiment === "Negative" ? "bg-red-100 text-red-800" : "bg-slate-100 text-slate-700"; return <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${color}`}>{sentiment}</span>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
