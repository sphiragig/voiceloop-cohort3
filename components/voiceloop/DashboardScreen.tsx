import type { Theme } from "@/lib/reviews";
import { themes } from "@/lib/reviews";
import { Card, OutlineButton, SectionHeading } from "./AppShell";
import { ChevronIcon, SparklesIcon } from "./icons";

const metrics = [
  { label: "Total reviews", value: "248", detail: "↑ 18% vs. prior period", tone: "text-emerald-700" },
  { label: "Average rating", value: "4.2", detail: "↑ 0.3 points", tone: "text-emerald-700" },
  { label: "Positive sentiment", value: "68%", detail: "↑ 6 percentage points", tone: "text-emerald-700" },
  { label: "Needs attention", value: "31", detail: "Service speed mentioned", tone: "text-amber-700" },
];

export function DashboardScreen({ onNavigateDigest, onEvidence }: { onNavigateDigest: () => void; onEvidence: (theme: Theme) => void }) {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <SectionHeading eyebrow="LAST 30 DAYS" title="Customer feedback overview" description="What 248 restaurant reviews are telling you." action={<OutlineButton onClick={onNavigateDigest}>View AI Digest <ChevronIcon className="size-4" /></OutlineButton>} />
      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.25fr_.75fr]">
        <Card className="p-5 sm:p-6"><h3 className="font-bold">Top themes</h3><p className="mt-1 text-sm text-slate-500">Most mentioned topics</p><div className="mt-7 space-y-5">{themes.map((theme) => <button key={theme.name} onClick={() => onEvidence(theme.name)} className="grid w-full grid-cols-[105px_1fr_30px] items-center gap-3 text-left text-xs font-semibold text-slate-700 sm:grid-cols-[145px_1fr_36px] sm:text-sm"><span>{theme.name}</span><span className="h-2.5 overflow-hidden rounded-full bg-slate-100"><span className="block h-full rounded-full bg-teal-500" style={{ width: `${theme.count}%` }} /></span><b className="text-right">{theme.count}</b></button>)}</div></Card>
        <Card className="p-5 sm:p-6"><h3 className="font-bold">Sentiment</h3><p className="mt-1 text-sm text-slate-500">Overall review tone</p><div className="mx-auto mt-5 grid size-36 place-items-center rounded-full" style={{ background: "radial-gradient(circle, white 48%, transparent 50%), conic-gradient(#16a34a 0 68%, #94a3b8 68% 89%, #dc2626 89% 100%)" }}><div className="text-center"><b className="block text-2xl">68%</b><span className="text-xs text-slate-500">positive</span></div></div><ul className="mt-5 space-y-2.5 text-sm"><SentimentRow color="bg-emerald-500" label="Positive" value="168"/><SentimentRow color="bg-slate-400" label="Neutral" value="52"/><SentimentRow color="bg-red-500" label="Negative" value="28"/></ul></Card>
        <Card className="overflow-hidden bg-gradient-to-br from-blue-50 via-white to-teal-50 p-5 sm:p-7 xl:col-span-2"><div className="flex flex-col gap-5 sm:flex-row sm:items-center"><span className="grid size-11 shrink-0 place-items-center rounded-xl bg-white text-teal-600 shadow-sm"><SparklesIcon className="size-6" /></span><div className="flex-1"><p className="text-xs font-bold text-blue-700">AI INSIGHT</p><h3 className="mt-1 text-lg font-bold sm:text-xl">Guests love the food, but peak-hour waits are hurting the experience.</h3><p className="mt-2 text-sm text-slate-600">19 negative reviews mention slow service on Friday and Saturday evenings.</p></div><button onClick={() => onEvidence("Service speed")} className="shrink-0 text-left text-sm font-bold text-blue-600 hover:text-blue-700">See supporting reviews →</button></div></Card>
      </div>
    </section>
  );
}

function MetricCard({ label, value, detail, tone }: { label: string; value: string; detail: string; tone: string }) { return <Card className="p-5"><p className="text-sm font-medium text-slate-500">{label}</p><b className="mt-2 block text-3xl tracking-tight">{value}</b><p className={`mt-2 text-xs font-semibold ${tone}`}>{detail}</p></Card>; }
function SentimentRow({ color, label, value }: { color: string; label: string; value: string }) { return <li className="flex items-center"><span className={`mr-2 size-2.5 rounded-full ${color}`} /><span className="text-slate-600">{label}</span><b className="ml-auto">{value}</b></li>; }
