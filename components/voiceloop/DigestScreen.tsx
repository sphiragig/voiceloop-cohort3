"use client";

import { useState } from "react";
import type { Theme } from "@/lib/reviews";
import { Card, OutlineButton, SectionHeading } from "./AppShell";
import { RefreshIcon, SparklesIcon } from "./icons";

export function DigestScreen({ onEvidence, onRefreshed }: { onEvidence: (theme: Theme) => void; onRefreshed: () => void }) {
  const [loading, setLoading] = useState(false);
  const regenerate = () => { setLoading(true); window.setTimeout(() => { setLoading(false); onRefreshed(); }, 1200); };
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="✦ AI-GENERATED · LAST 30 DAYS" title="Your customer feedback digest" description="A concise summary of what changed and what deserves attention." action={<OutlineButton onClick={regenerate} disabled={loading}><RefreshIcon className={`size-4 ${loading ? "animate-spin" : ""}`}/>Regenerate</OutlineButton>} />
      {loading ? <Card className="grid min-h-[380px] place-items-center p-8 text-center"><div><span className="mx-auto block size-10 animate-spin rounded-full border-4 border-blue-100 border-t-blue-600"/><h3 className="mt-5 text-lg font-bold">Analyzing your feedback…</h3><p className="mt-2 text-sm text-slate-500">Finding themes, changes, and supporting evidence.</p></div></Card> : <DigestBody onEvidence={onEvidence}/>} 
    </section>
  );
}

function DigestBody({ onEvidence }: { onEvidence: (theme: Theme) => void }) {
  return <div className="space-y-5"><Card className="bg-gradient-to-br from-blue-50 via-white to-teal-50 p-6 sm:p-8"><div className="flex flex-col gap-5 sm:flex-row"><span className="grid size-12 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm"><SparklesIcon className="size-7"/></span><div><p className="text-[11px] font-bold tracking-[0.12em] text-blue-600">EXECUTIVE SUMMARY</p><h3 className="mt-2 max-w-4xl text-xl font-bold leading-snug sm:text-2xl">Food quality is driving loyalty, while weekend service speed is the clearest opportunity.</h3><p className="mt-3 max-w-4xl text-sm leading-6 text-slate-600 sm:text-base">Guests praise fresh ingredients, brunch dishes, and friendly staff. Slow seating and check delivery recur in low-rated reviews.</p></div></div></Card><div className="grid gap-5 md:grid-cols-2"><DigestCard tone="positive" title="What’s working" items={[{ title: "Food quality", copy: "Praised in 96 reviews, especially brunch and seasonal dishes.", theme: "Food quality" }, { title: "Friendly staff", copy: "Positive mentions rose 14% compared with last month.", theme: "Staff friendliness" }]} onEvidence={onEvidence}/><DigestCard tone="warning" title="Needs attention" items={[{ title: "Weekend wait times", copy: "19 negative reviews mention slow seating or service.", theme: "Service speed" }, { title: "Perceived value", copy: "Some dinner guests find portions small for the price.", theme: "Value" }]} onEvidence={onEvidence}/></div></div>;
}

function DigestCard({ tone, title, items, onEvidence }: { tone: "positive" | "warning"; title: string; items: { title: string; copy: string; theme: Theme }[]; onEvidence: (theme: Theme) => void }) { const color = tone === "positive" ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"; return <Card className="p-5 sm:p-6"><div className="flex items-center gap-3"><span className={`grid size-8 place-items-center rounded-lg text-base font-bold ${color}`}>{tone === "positive" ? "↑" : "!"}</span><h3 className="font-bold">{title}</h3></div><div className="mt-5 divide-y divide-slate-200 border-t border-slate-200">{items.map((item) => <div key={item.title} className="py-5 last:pb-0"><h4 className="font-bold">{item.title}</h4><p className="mt-1 text-sm leading-6 text-slate-600">{item.copy}</p><button onClick={() => onEvidence(item.theme)} className="mt-3 text-sm font-bold text-blue-600 hover:text-blue-700">View evidence →</button></div>)}</div></Card>; }
