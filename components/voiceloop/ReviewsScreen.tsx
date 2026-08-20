"use client";

import { useEffect, useState, type ReactNode } from "react";
import { fetchReviews, fetchReviewSources, type ReviewSort, type StoredReview } from "@/lib/supabase/reviews";
import { Card, OutlineButton, SectionHeading } from "./AppShell";
import { SearchIcon } from "./icons";

const pageSize = 6;

export function ReviewsScreen() {
  const [search, setSearch] = useState("");
  const [source, setSource] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sort, setSort] = useState<ReviewSort>("new");
  const [page, setPage] = useState(1);
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchReviewSources().then((items) => { if (!cancelled) setSources(items); }).catch(() => undefined);
    return () => { cancelled = true; };
  }, [reloadKey]);

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError("");
      try {
        const result = await fetchReviews({ search, source, dateFrom, dateTo, sort, page, pageSize });
        if (!cancelled) {
          setReviews(result.reviews);
          setTotal(result.count);
        }
      } catch (loadError) {
        if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Reviews could not be loaded.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, search ? 250 : 0);
    return () => { cancelled = true; window.clearTimeout(timer); };
  }, [search, source, dateFrom, dateTo, sort, page, reloadKey]);

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const updateFilter = (change: () => void) => { change(); setPage(1); };
  const clear = () => { setSearch(""); setSource(""); setDateFrom(""); setDateTo(""); setSort("new"); setPage(1); };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="REVIEW EXPLORER" title="All customer reviews" description={`${total} reviews match your filters.`} action={<OutlineButton onClick={clear}>Clear filters</OutlineButton>} />
      <Card className="mb-5 grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-[1.6fr_1fr_1fr_1fr_1fr]">
        <label className="relative"><span className="sr-only">Search reviews</span><SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400"/><input value={search} onChange={(event) => updateFilter(() => setSearch(event.target.value))} type="search" placeholder="Search review text…" className="h-11 w-full rounded-lg border border-slate-300 bg-white pl-10 pr-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <label><span className="sr-only">Source</span><select value={source} onChange={(event) => updateFilter(() => setSource(event.target.value))} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="">All sources</option>{sources.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span className="sr-only">From date</span><input aria-label="From date" value={dateFrom} max={dateTo || undefined} onChange={(event) => updateFilter(() => setDateFrom(event.target.value))} type="date" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <label><span className="sr-only">To date</span><input aria-label="To date" value={dateTo} min={dateFrom || undefined} onChange={(event) => updateFilter(() => setDateTo(event.target.value))} type="date" className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-600 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>
        <label><span className="sr-only">Sort</span><select aria-label="Sort" value={sort} onChange={(event) => updateFilter(() => setSort(event.target.value as ReviewSort))} className="h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"><option value="new">Newest first</option><option value="old">Oldest first</option></select></label>
      </Card>
      <Card className="overflow-hidden">
        {error ? <div className="px-6 py-16 text-center"><h3 className="font-bold text-red-700">Reviews could not be loaded</h3><p className="mt-2 text-sm text-slate-500">{error}</p><button onClick={() => setReloadKey((value) => value + 1)} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></div> : loading ? <ReviewLoading /> : reviews.length ? <><div className="hidden overflow-x-auto lg:block"><table className="w-full min-w-[900px] border-collapse text-left"><thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500"><tr><Th>Review</Th><Th>Sentiment</Th><Th>Theme</Th><Th>Rating</Th><Th>Source</Th><Th>Date</Th></tr></thead><tbody>{reviews.map((review) => <ReviewRow key={review.id} review={review} />)}</tbody></table></div><div className="divide-y divide-slate-200 lg:hidden">{reviews.map((review) => <ReviewCard key={review.id} review={review} />)}</div></> : <div className="px-6 py-16 text-center"><div className="mx-auto grid size-12 place-items-center rounded-full bg-slate-100 text-slate-400"><SearchIcon className="size-5"/></div><h3 className="mt-4 font-bold">No reviews found</h3><p className="mt-1 text-sm text-slate-500">Upload a CSV or change your search and filters.</p></div>}
        {!error && !loading && <div className="flex items-center justify-center gap-4 border-t border-slate-200 px-4 py-4"><button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-35">←</button><span className="text-sm text-slate-600">Page {Math.min(page, pages)} of {pages}</span><button disabled={page >= pages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-semibold disabled:opacity-35">→</button></div>}
      </Card>
    </section>
  );
}

function ReviewLoading() { return <div className="space-y-3 p-5" role="status" aria-label="Loading reviews">{Array.from({ length: 5 }, (_, index) => <div key={index} className="h-14 animate-pulse rounded-lg bg-slate-100" />)}</div>; }
function Th({ children }: { children: ReactNode }) { return <th className="border-b border-slate-200 px-4 py-3 font-bold">{children}</th>; }
function ReviewRow({ review }: { review: StoredReview }) { return <tr className="transition hover:bg-slate-50"><td className="max-w-sm border-b border-slate-200 px-4 py-4 text-sm leading-6 text-slate-700"><span className="block">{review.review_text}</span>{review.reviewer_name && <span className="mt-1 block text-xs text-slate-400">— {review.reviewer_name}</span>}</td><td className="border-b border-slate-200 px-4 py-4"><AnalysisBadge value={review.sentiment}/></td><td className="border-b border-slate-200 px-4 py-4"><AnalysisBadge value={review.theme}/></td><td className="border-b border-slate-200 px-4 py-4 text-sm text-amber-500">{review.rating ? <><span aria-label={`${review.rating} out of 5 stars`}>{"★".repeat(review.rating)}</span><span className="text-slate-200">{"★".repeat(5-review.rating)}</span></> : <span className="text-slate-400">—</span>}</td><td className="border-b border-slate-200 px-4 py-4 text-sm text-slate-600">{review.source ?? "—"}</td><td className="whitespace-nowrap border-b border-slate-200 px-4 py-4 text-sm text-slate-600">{formatDate(review.review_date ?? review.created_at)}</td></tr>; }
function ReviewCard({ review }: { review: StoredReview }) { return <article className="p-5"><div className="flex items-center justify-between gap-3"><AnalysisBadge value={review.sentiment}/><span className="text-sm text-amber-500">{review.rating ? "★".repeat(review.rating) : "—"}</span></div><p className="mt-3 text-sm leading-6 text-slate-700">{review.review_text}</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><AnalysisBadge value={review.theme}/><span>{review.source ?? "Unknown source"} · {formatDate(review.review_date ?? review.created_at)}</span></div></article>; }
function AnalysisBadge({ value }: { value: string | null }) { const color = value === "Positive" ? "bg-emerald-100 text-emerald-800" : value === "Negative" ? "bg-red-100 text-red-800" : value === "Neutral" ? "bg-slate-100 text-slate-700" : "bg-amber-50 text-amber-700"; return <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${color}`}>{value ?? "Not analyzed yet"}</span>; }
function formatDate(value: string) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(value.includes("T") ? value : `${value}T12:00:00`)); }
