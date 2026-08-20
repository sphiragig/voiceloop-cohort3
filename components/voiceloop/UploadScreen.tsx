"use client";

import { useRef, useState } from "react";
import { Card } from "./AppShell";
import { UploadIcon } from "./icons";

type UploadStatus = "idle" | "loading" | "success" | "error";

export function UploadScreen({ onComplete }: { onComplete: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [dragging, setDragging] = useState(false);

  const process = (file?: File) => {
    if (file && !file.name.toLowerCase().endsWith(".csv")) {
      setStatus("error");
      return;
    }
    setStatus("loading");
    window.setTimeout(() => {
      setStatus("success");
      window.setTimeout(onComplete, 850);
    }, 1000);
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
          {status !== "idle" && <StatusPanel status={status} />}
        </div>
        <div className="mt-7 flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-5 text-sm sm:flex-row"><span className="font-semibold text-slate-700">Expected CSV format</span><button onClick={() => process()} className="font-semibold text-blue-600 hover:text-blue-700">Try sample data →</button></div>
      </Card>
      <div className="mx-auto mt-6 flex max-w-3xl items-center justify-center gap-5 text-xs text-slate-500"><span>✓ Secure upload</span><span>✓ No setup required</span><span className="hidden sm:inline">✓ Results in seconds</span></div>
    </section>
  );
}

function StatusPanel({ status }: { status: Exclude<UploadStatus, "idle"> }) {
  const styles = status === "loading" ? "bg-blue-50 text-blue-800" : status === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800";
  const text = status === "loading" ? "Analyzing reviews…" : status === "success" ? "✓ 248 reviews imported successfully." : "Please choose a valid CSV file and try again.";
  return <div role="status" className={`mt-5 rounded-lg px-4 py-3 text-sm font-semibold ${styles}`}>{status === "loading" && <span className="mr-2 inline-block size-3 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />}{text}</div>;
}
