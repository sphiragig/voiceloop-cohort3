"use client";

import { useState } from "react";
import type { AIDigest, DigestInsight, DigestProblem } from "@/lib/ai/digest";
import { ensureDemoSession } from "@/lib/ai/demo-session";
import { Card, OutlineButton, SectionHeading } from "./AppShell";
import { RefreshIcon, SparklesIcon } from "./icons";

export function DigestScreen({ onEvidence, onRefreshed }: { onEvidence: (theme: string) => void; onRefreshed: () => void }) {
  const [digest, setDigest] = useState<AIDigest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const generate = async () => {
    setLoading(true);
    setError("");
    try {
      await ensureDemoSession();
      const response = await fetch("/api/digest", { method: "POST", credentials: "same-origin" });
      const payload = await response.json() as { digest?: AIDigest; error?: string };
      if (!response.ok || !payload.digest) throw new Error(payload.error ?? "AI Digest could not be generated.");
      setDigest(payload.digest);
      onRefreshed();
    } catch (generateError) {
      setError(generateError instanceof Error ? generateError.message : "AI Digest could not be generated.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="✦ AI-GENERATED" title="Your customer feedback digest" description="A concise summary grounded in your analyzed customer reviews." action={<OutlineButton onClick={generate} disabled={loading}><RefreshIcon className={`size-4 ${loading ? "animate-spin" : ""}`}/>{digest ? "Regenerate" : "Generate AI Digest"}</OutlineButton>} />
      {loading ? <DigestLoading /> : error ? <DigestError message={error} onRetry={generate} /> : digest ? <DigestBody digest={digest} onEvidence={onEvidence}/> : <DigestEmpty onGenerate={generate}/>}
    </section>
  );
}

function DigestBody({ digest, onEvidence }: { digest: AIDigest; onEvidence: (theme: string) => void }) {
  return <div className="space-y-5">
    <Card className="bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm"><SparklesIcon className="size-7"/></span><div><p className="text-[11px] font-bold tracking-[0.12em] text-blue-600">AI-GENERATED EXECUTIVE SUMMARY</p><h3 className="mt-2 max-w-4xl text-xl font-bold leading-snug sm:text-2xl">{digest.executive_summary.headline}</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 sm:text-base">{digest.executive_summary.summary}</p><p className="mt-4 text-xs font-semibold text-slate-500">Based on {digest.analyzed_review_count.toLocaleString()} analyzed reviews</p></div></div></Card>
    <div className="grid gap-5 md:grid-cols-2"><InsightSection tone="positive" title="What’s working" items={digest.whats_working} onEvidence={onEvidence}/><InsightSection tone="warning" title="Needs attention" items={digest.needs_attention} onEvidence={onEvidence}/></div>
    <ProblemSection problems={digest.top_problems} onEvidence={onEvidence}/>
    <ActionSection actions={digest.recommended_actions}/>
  </div>;
}

function InsightSection({ tone, title, items, onEvidence }: { tone: "positive" | "warning"; title: string; items: DigestInsight[]; onEvidence: (theme: string) => void }) {
  const color = tone === "positive" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50";
  return <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-lg text-base font-bold ${color}`}>{tone === "positive" ? "↑" : "!"}</span><h3 className="font-bold">{title}</h3></div>{items.length ? <div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">{items.map((item) => <div key={`${item.theme}-${item.title}`} className="py-5 last:pb-0"><div className="flex flex-wrap items-center gap-2"><h4 className="font-bold">{item.title}</h4><span className="rounded-full bg-slate-100 px-2 py-1 text-[11px] font-bold text-slate-600">{item.mention_count} mentions</span></div><p className="mt-1 text-sm leading-6 text-slate-600">{item.summary}</p><QuoteList quotes={item.supporting_quotes}/><button onClick={() => onEvidence(item.theme)} className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700">View evidence →</button></div>)}</div> : <EmptySection copy={tone === "positive" ? "No positive patterns were identified." : "No evidenced attention areas were identified."}/>}</Card>;
}

function ProblemSection({ problems, onEvidence }: { problems: DigestProblem[]; onEvidence: (theme: string) => void }) {
  return <Card className="p-5 sm:p-6"><h3 className="font-bold">Top recurring problems</h3><p className="mt-1 text-sm text-slate-500">Repeated issues supported by analyzed reviews</p>{problems.length ? <div className="mt-5 grid gap-4 md:grid-cols-3">{problems.map((problem) => <article key={`${problem.theme}-${problem.problem}`} className="rounded-xl border border-slate-200 p-4"><div className="flex items-center justify-between gap-3"><h4 className="font-bold">{problem.problem}</h4><span className="rounded-full bg-red-50 px-2 py-1 text-[11px] font-bold text-red-700">{problem.frequency}</span></div><p className="mt-2 text-xs font-semibold text-slate-500">{problem.theme}</p><QuoteList quotes={problem.supporting_quotes}/><button onClick={() => onEvidence(problem.theme)} className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700">View evidence →</button></article>)}</div> : <EmptySection copy="No recurring negative problems were identified in the analyzed reviews."/>}</Card>;
}

function ActionSection({ actions }: { actions: AIDigest["recommended_actions"] }) {
  return <Card className="p-5 sm:p-6"><h3 className="font-bold">Recommended focus / actions</h3><p className="mt-1 text-sm text-slate-500">AI-generated actions tied to evidenced themes</p>{actions.length ? <ol className="mt-5 grid gap-4 md:grid-cols-3">{actions.map((item, index) => <li key={`${item.supporting_theme}-${item.action}`} className="rounded-xl bg-slate-50 p-4"><span className="grid size-7 place-items-center rounded-full bg-blue-600 text-xs font-bold text-white">{index + 1}</span><h4 className="mt-3 font-bold">{item.action}</h4><p className="mt-2 text-sm leading-6 text-slate-600">{item.reason}</p><p className="mt-3 text-xs font-bold text-blue-700">{item.supporting_theme}</p></li>)}</ol> : <EmptySection copy="No actions were recommended because the current data does not contain an evidenced recurring problem."/>}</Card>;
}

function QuoteList({ quotes }: { quotes: string[] }) { return quotes.length ? <div className="mt-3 space-y-2">{quotes.map((quote) => <blockquote key={quote} className="border-l-2 border-slate-200 pl-3 text-xs italic leading-5 text-slate-500">“{quote}”</blockquote>)}</div> : null; }
function EmptySection({ copy }: { copy: string }) { return <div className="mt-5 rounded-xl bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">{copy}</div>; }
function DigestEmpty({ onGenerate }: { onGenerate: () => void }) { return <Card className="grid min-h-[380px] place-items-center p-8 text-center"><div><span className="mx-auto grid size-12 place-items-center rounded-xl bg-blue-50 text-blue-600"><SparklesIcon className="size-6"/></span><h3 className="mt-5 text-lg font-bold">Generate your first AI Digest</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">VoiceLoop will summarize patterns and actions using only your analyzed customer reviews.</p><button onClick={onGenerate} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Generate AI Digest</button></div></Card>; }
function DigestLoading() { return <div role="status"><Card className="grid min-h-[380px] place-items-center p-8 text-center"><div><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"/><h3 className="mt-5 text-lg font-bold">Analyzing customer feedback...</h3><p className="mt-2 text-sm text-slate-500">Finding evidence-backed themes, problems, and actions.</p></div></Card></div>; }
function DigestError({ message, onRetry }: { message: string; onRetry: () => void }) { return <Card className="grid min-h-[320px] place-items-center p-8 text-center"><div><h3 className="text-lg font-bold text-red-700">AI Digest could not be generated</h3><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{message}</p><button onClick={onRetry} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700">Try again</button></div></Card>; }
