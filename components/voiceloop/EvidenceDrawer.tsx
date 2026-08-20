"use client";

import { useEffect, useRef, useState } from "react";
import { fetchReviewsByTheme, type StoredReview } from "@/lib/supabase/reviews";
import { CloseIcon } from "./icons";

export function EvidenceDrawer({ theme, onClose }: { theme: string; onClose: () => void }) {
  const [reviews, setReviews] = useState<StoredReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", close);
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    return () => {
      document.removeEventListener("keydown", close);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    fetchReviewsByTheme(theme)
      .then((matches) => { if (!cancelled) setReviews(matches); })
      .catch((loadError) => { if (!cancelled) setError(loadError instanceof Error ? loadError.message : "Supporting reviews could not be loaded."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [theme]);

  return <>
    <button aria-label="Close evidence drawer" onClick={onClose} className="fixed inset-0 z-40 bg-slate-950/45" />
    <aside role="dialog" aria-modal="true" aria-labelledby="evidence-title" className="fixed inset-y-0 right-0 z-50 w-full overflow-y-auto bg-white p-5 shadow-2xl sm:max-w-lg sm:p-7">
      <button ref={closeButtonRef} onClick={onClose} className="float-right grid size-11 place-items-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" aria-label="Close supporting evidence"><CloseIcon className="size-5"/></button>
      <p className="pt-1 text-[11px] font-bold tracking-[0.12em] text-blue-600">SUPPORTING EVIDENCE</p>
      <h2 id="evidence-title" className="mt-2 pr-14 text-2xl font-bold">{theme}</h2>
      <p className="mt-2 text-sm text-slate-500">Real review excerpts connected to this theme.</p>
      <div className="mt-7 space-y-3">
        {loading && <div role="status" className="space-y-3">{Array.from({ length: 3 }, (_, index) => <div key={index} className="h-28 animate-pulse rounded-xl bg-slate-100" />)}</div>}
        {error && <div className="rounded-xl bg-red-50 p-4 text-sm font-medium text-red-700">{error}</div>}
        {!loading && !error && reviews.length === 0 && <div className="rounded-xl bg-slate-50 p-6 text-center text-sm text-slate-500">No stored reviews match this theme.</div>}
        {!loading && !error && reviews.map((review) => <EvidenceReview key={review.id} review={review}/>) }
      </div>
    </aside>
  </>;
}

function EvidenceReview({ review }: { review: StoredReview }) {
  return <article className="rounded-xl border border-slate-200 p-4"><p className="text-sm leading-6 text-slate-700">“{review.review_text}”</p><div className="mt-4 flex items-center justify-between gap-3 text-xs text-slate-500"><span>{review.source ?? "Unknown source"}{review.sentiment ? ` · ${review.sentiment}` : ""}</span><span className="shrink-0 text-amber-500">{review.rating ? "★".repeat(review.rating) : "—"}</span></div></article>;
}
