"use client";

import { useEffect, useState } from "react";
import { fetchDashboardData, type DashboardCount, type DashboardData } from "@/lib/supabase/dashboard";
import { Card, OutlineButton, SectionHeading } from "./AppShell";
import { ChevronIcon, SparklesIcon } from "./icons";

export function DashboardScreen({ onNavigateDigest }: { onNavigateDigest: () => void }) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetchDashboardData()
      .then((result) => { if (!cancelled) setData(result); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Dashboard data could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);

  const retry = () => {
    setLoading(true);
    setError("");
    setReloadKey((value) => value + 1);
  };

  if (loading) return <DashboardLoading />;
  if (error) return <DashboardError message={error} onRetry={retry} />;
  if (!data) return null;

  const metrics = [
    { label: "Total reviews", value: data.totalReviews.toLocaleString(), detail: "All stored reviews", tone: "text-slate-500" },
    { label: "Average rating", value: data.averageRating === null ? "—" : data.averageRating.toFixed(1), detail: data.ratingCount ? `Across ${data.ratingCount.toLocaleString()} rated reviews` : "No ratings available", tone: "text-slate-500" },
    { label: "Positive sentiment", value: data.positivePercentage === null ? "—" : `${Math.round(data.positivePercentage)}%`, detail: data.analyzedCount ? `Across ${data.analyzedCount.toLocaleString()} analyzed reviews` : "No analyzed reviews yet", tone: "text-emerald-700" },
    { label: "Needs attention", value: data.negativeCount.toLocaleString(), detail: "Negative reviews", tone: data.negativeCount ? "text-amber-700" : "text-slate-500" },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="ALL REVIEWS" title="Customer feedback overview" description={data.totalReviews ? `What ${data.totalReviews.toLocaleString()} restaurant ${data.totalReviews === 1 ? "review is" : "reviews are"} telling you.` : "Upload reviews to see your customer feedback overview."} action={<OutlineButton onClick={onNavigateDigest}>View AI Digest <ChevronIcon className="size-4" /></OutlineButton>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      {data.totalReviews === 0 ? <DashboardEmpty /> : <DashboardContent data={data} />}
    </section>
  );
}

function DashboardContent({ data }: { data: DashboardData }) {
  return <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
    <ThemeChart themes={data.themes} />
    <SentimentChart sentiments={data.sentiments} analyzedCount={data.analyzedCount} positivePercentage={data.positivePercentage} />
    <InsightCard insight={data.insight} analyzedCount={data.analyzedCount} unanalyzedCount={data.unanalyzedCount} />
    {data.sources.length > 0 && <SourceChart sources={data.sources} />}
  </div>;
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <Card className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><b className="mt-2 block text-3xl tracking-tight">{value}</b><p className={`mt-2 text-xs font-semibold ${tone}`}>{detail}</p></Card>; }

function ThemeChart({ themes }: { themes: DashboardCount[] }) {
  const maximum = themes[0]?.count ?? 0;
  return <Card className="p-5 sm:p-6"><h3 className="font-bold">Top themes</h3><p className="mt-1 text-sm text-slate-500">Most mentioned analyzed topics</p>{themes.length ? <div className="mt-7 space-y-5">{themes.map((theme) => <div key={theme.name} className="grid w-full grid-cols-[105px_1fr_30px] items-center gap-3 text-xs font-semibold text-slate-700 sm:grid-cols-[145px_1fr_36px] sm:text-sm"><span>{theme.name}</span><span className="h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-teal-500" style={{ width: `${maximum ? (theme.count / maximum) * 100 : 0}%` }} /></span><b className="text-right">{theme.count}</b></div>)}</div> : <EmptyChart copy="Themes will appear after reviews are analyzed." />}</Card>;
}

function SentimentChart({ sentiments, analyzedCount, positivePercentage }: { sentiments: DashboardData["sentiments"]; analyzedCount: number; positivePercentage: number | null }) {
  const positiveEnd = analyzedCount ? (sentiments.Positive / analyzedCount) * 100 : 0;
  const neutralEnd = analyzedCount ? positiveEnd + (sentiments.Neutral / analyzedCount) * 100 : 0;
  const background = analyzedCount ? `radial-gradient(circle, white 48%, transparent 50%), conic-gradient(#16a34a 0 ${positiveEnd}%, #94a3b8 ${positiveEnd}% ${neutralEnd}%, #dc2626 ${neutralEnd}% 100%)` : "radial-gradient(circle, white 48%, transparent 50%), conic-gradient(#e2e8f0 0 100%)";
  return <Card className="p-5 sm:p-6"><h3 className="font-bold">Sentiment</h3><p className="mt-1 text-sm text-slate-500">Overall analyzed review tone</p><div className="mx-auto mt-5 grid size-36 place-items-center rounded-full" style={{ background }}><div className="text-center"><b className="block text-2xl">{positivePercentage === null ? "—" : `${Math.round(positivePercentage)}%`}</b><span className="text-xs text-slate-500">positive</span></div></div><ul className="mt-5 space-y-2.5 text-sm"><SentimentRow color="bg-emerald-500" label="Positive" value={sentiments.Positive}/><SentimentRow color="bg-slate-400" label="Neutral" value={sentiments.Neutral}/><SentimentRow color="bg-red-500" label="Negative" value={sentiments.Negative}/></ul></Card>;
}

function InsightCard({ insight, analyzedCount, unanalyzedCount }: { insight: string | null; analyzedCount: number; unanalyzedCount: number }) {
  return <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50 p-5 sm:p-7 xl:col-span-2"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm"><SparklesIcon className="size-6" /></span><div className="flex-1"><p className="text-xs font-bold text-blue-700">DATA INSIGHT</p><h3 className="mt-1 text-lg font-bold sm:text-xl">{insight ?? "Analyze reviews to generate a data insight."}</h3><p className="mt-2 text-sm text-slate-600">{analyzedCount.toLocaleString()} analyzed{unanalyzedCount ? ` · ${unanalyzedCount.toLocaleString()} awaiting analysis` : " · all reviews analyzed"}</p></div></div></Card>;
}

function SourceChart({ sources }: { sources: DashboardCount[] }) {
  const maximum = sources[0]?.count ?? 0;
  return <Card className="p-5 sm:p-6 xl:col-span-2"><h3 className="font-bold">Reviews by source</h3><p className="mt-1 text-sm text-slate-500">Where customer feedback was collected</p><div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{sources.map((source) => <div key={source.name} className="rounded-xl bg-slate-50 p-4"><div className="flex items-center justify-between text-sm"><span className="font-semibold text-slate-700">{source.name}</span><b>{source.count}</b></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-blue-600" style={{ width: `${maximum ? (source.count / maximum) * 100 : 0}%` }} /></div></div>)}</div></Card>;
}

function SentimentRow({ color, label, value }: { color: string; label: string; value: number }) { return <li className="flex items-center"><span className={`mr-2 size-2.5 rounded-full ${color}`} /><span className="text-slate-600">{label}</span><b className="ml-auto">{value}</b></li>; }
function EmptyChart({ copy }: { copy: string }) { return <div className="mt-7 rounded-xl bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">{copy}</div>; }
function DashboardEmpty() { return <Card className="px-6 py-16 text-center"><h3 className="font-bold">No reviews yet</h3><p className="mt-2 text-sm text-slate-500">Upload a CSV to populate this dashboard.</p></Card>; }
function DashboardLoading() { return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" role="status" aria-label="Loading dashboard"><div className="mb-6 h-20 animate-pulse rounded-xl bg-slate-200"/><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }, (_, index) => <div key={index} className="h-32 animate-pulse rounded-xl bg-slate-200" />)}</div><div className="mt-5 grid gap-5 xl:grid-cols-2"><div className="h-80 animate-pulse rounded-xl bg-slate-200"/><div className="h-80 animate-pulse rounded-xl bg-slate-200"/></div></section>; }
function DashboardError({ message, onRetry }: { message: string; onRetry: () => void }) { return <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8"><Card className="px-6 py-16 text-center"><h3 className="font-bold text-red-700">Dashboard could not be loaded</h3><p className="mt-2 text-sm text-slate-500">{message}</p><button onClick={onRetry} className="mt-5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">Try again</button></Card></section>; }
