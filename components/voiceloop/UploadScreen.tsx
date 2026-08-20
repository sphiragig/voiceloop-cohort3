"use client";

import { useRef, useState } from "react";
import { parseReviewCsv } from "@/lib/csv/parse-reviews";
import { insertReviews } from "@/lib/supabase/reviews";
import { analyzeReviews } from "@/lib/ai/analyze-reviews";
import { Card } from "./AppShell";
import { UploadIcon } from "./icons";

type UploadStatus = "idle" | "loading" | "success" | "error";

const sampleCsv = `review_text,rating,review_date,source,reviewer_name
"The tomato toast was bright, fresh, and beautifully seasoned.",5,2026-08-19,Google,Maya R.
"Our server was kind, but the drinks took nearly twenty minutes.",3,2026-08-18,Yelp,Jon P.
"A cozy dining room and a thoughtful seasonal menu.",4,2026-08-17,OpenTable,Elena S.`;

export function UploadScreen({ onComplete }: { onComplete: (count: number) => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [message, setMessage] = useState("");
  const [details, setDetails] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const process = async (file?: File, sample?: string) => {
    setDetails([]);
    if (file && (!file.name.toLowerCase().endsWith(".csv") || file.size > 10 * 1024 * 1024)) {
      setStatus("error");
      setMessage(file.size > 10 * 1024 * 1024 ? "The CSV must be 10 MB or smaller." : "Please choose a .csv file.");
      return;
    }
    setStatus("loading");
    setMessage("Validating and uploading reviews…");

    try {
      const csv = sample ?? await file?.text() ?? "";
      const parsed = parseReviewCsv(csv);
      if (!parsed.ok) {
        setStatus("error");
        setMessage(parsed.error);
        return;
      }
      const inserted = await insertReviews(parsed.rows);
      setMessage("Analyzing customer feedback…");
      const analysis = await analyzeReviews(inserted);
      if (analysis.failed > 0) {
        setStatus("error");
        setMessage(`${inserted.length} reviews were uploaded safely, but ${analysis.failed} could not be analyzed. ${analysis.errors[0] ?? "Try again later."}`);
        return;
      }
      setStatus("success");
      setMessage(`${inserted.length} ${inserted.length === 1 ? "review" : "reviews"} imported and analyzed successfully.`);
      setDetails(parsed.warnings);
      window.setTimeout(() => onComplete(inserted.length), 850);
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "The upload failed. Please try again.");
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <div className="mx-auto mb-8 max-w-2xl text-center">
        <p className="mb-3 text-[11px] font-bold tracking-[0.12em] text-blue-600">GET STARTED</p>
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Turn reviews into clear next steps</h2>
        <p className="mt-3 text-base text-slate-500 sm:text-lg">Upload a CSV. VoiceLoop will organize themes, sentiment, and evidence.</p>
      </div>
      <Card className={`mx-auto max-w-3xl border-2 border-dashed p-5 text-center transition sm:p-10 ${dragging ? "border-blue-500 bg-blue-50" : "border-slate-300"}`}>
        <div onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); process(event.dataTransfer.files[0]); }}>
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-blue-50 text-blue-600"><UploadIcon className="size-7" /></div>
          <h3 className="mt-5 text-xl font-bold">Drop your CSV file here</h3>
          <p className="mt-1 text-sm text-slate-500">or choose a file from your computer</p>
          <button onClick={() => inputRef.current?.click()} className="mt-6 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700">Choose CSV file</button>
          <input ref={inputRef} type="file" accept=".csv,text/csv" className="hidden" onChange={(event) => process(event.target.files?.[0])} />
          <p className="mt-4 text-xs text-slate-500">CSV up to 10 MB · Required column: review_text</p>
          {status !== "idle" && <StatusPanel status={status} message={message} details={details} />}
        </div>
        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm sm:flex-row"><span className="font-semibold text-slate-700">Expected CSV format</span><button disabled={status === "loading"} onClick={() => process(undefined, sampleCsv)} className="font-semibold text-blue-600 hover:text-blue-700 disabled:opacity-50">Try sample data →</button></div>
      </Card>
      <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-5 text-xs text-slate-500"><span>✓ Secure upload</span><span>✓ No setup required</span><span className="hidden sm:inline">✓ Results in seconds</span></div>
    </section>
  );
}

function StatusPanel({ status, message, details }: { status: Exclude<UploadStatus, "idle">; message: string; details: string[] }) {
  const styles = status === "loading" ? "bg-blue-50 text-blue-800" : status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800";
  return <div role="status" className={`mt-5 rounded-lg px-4 py-3 text-left text-sm font-semibold ${styles}`}><div>{status === "loading" && <span className="mr-2 inline-block size-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />}{status === "success" && "✓ "}{message}</div>{details.length > 0 && <ul className="mt-2 list-disc space-y-1 pl-5 text-xs font-medium">{details.map((detail) => <li key={detail}>{detail}</li>)}</ul>}</div>;
}
