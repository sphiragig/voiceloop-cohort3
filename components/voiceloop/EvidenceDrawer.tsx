"use client";

import { useEffect } from "react";
import { reviews, type Theme } from "@/lib/reviews";
import { CloseIcon } from "./icons";

export function EvidenceDrawer({ theme, onClose }: { theme: Theme | null; onClose: () => void }) {
  useEffect(() => {
    if (!theme) return;
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", close); document.body.style.overflow = ""; };
  }, [theme, onClose]);

  const matches = theme ? reviews.filter((review) => review.theme === theme) : [];
  return <><button aria-label="Close evidence drawer" onClick={onClose} className={`fixed inset-0 z-40 bg-slate-950/45 transition-opacity ${theme ? "opacity-100" : "pointer-events-none opacity-0"}`} /><aside role="dialog" aria-modal="true" aria-labelledby="evidence-title" className={`fixed inset-y-0 right-0 z-50 w-full max-w-lg overflow-y-auto bg-white p-5 shadow-2xl transition-transform duration-300 sm:p-7 ${theme ? "translate-x-0" : "translate-x-full"}`}><button onClick={onClose} className="float-right grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50" aria-label="Close"><CloseIcon className="size-5"/></button><p className="pt-1 text-[11px] font-bold tracking-[0.12em] text-blue-600">SUPPORTING EVIDENCE</p><h2 id="evidence-title" className="mt-2 text-2xl font-bold">{theme}</h2><p className="mt-2 text-sm text-slate-500">Real review excerpts connected to this theme.</p><div className="mt-7 space-y-3">{matches.map((review) => <article key={review.id} className="rounded-xl border border-slate-200 p-4"><p className="text-sm leading-6 text-slate-700">“{review.text}”</p><div className="mt-4 flex items-center justify-between text-xs text-slate-500"><span>{review.source} · {review.sentiment}</span><span className="text-amber-500">{"★".repeat(review.rating)}</span></div></article>)}</div></aside></>;
}
