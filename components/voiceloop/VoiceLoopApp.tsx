"use client";

import { useCallback, useState } from "react";
import type { Theme } from "@/lib/reviews";
import { AppShell, type Screen } from "./AppShell";
import { DashboardScreen } from "./DashboardScreen";
import { DigestScreen } from "./DigestScreen";
import { EvidenceDrawer } from "./EvidenceDrawer";
import { ReviewsScreen } from "./ReviewsScreen";
import { UploadScreen } from "./UploadScreen";

export function VoiceLoopApp() {
  const [screen, setScreen] = useState<Screen>("upload");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [evidenceTheme, setEvidenceTheme] = useState<Theme | null>(null);
  const [toast, setToast] = useState("");
  const closeEvidence = useCallback(() => setEvidenceTheme(null), []);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(""), 2200); };

  return <>
    <AppShell screen={screen} mobileOpen={mobileOpen} onMobileOpenChange={setMobileOpen} onNavigate={setScreen}>
      {screen === "upload" && <UploadScreen onComplete={() => { setScreen("dashboard"); notify("248 reviews imported successfully."); }} />}
      {screen === "dashboard" && <DashboardScreen onNavigateDigest={() => setScreen("digest")} onEvidence={setEvidenceTheme} />}
      {screen === "reviews" && <ReviewsScreen onEvidence={setEvidenceTheme} />}
      {screen === "digest" && <DigestScreen onEvidence={setEvidenceTheme} onRefreshed={() => notify("AI Digest refreshed.")} />}
    </AppShell>
    <EvidenceDrawer theme={evidenceTheme} onClose={closeEvidence} />
    <div role="status" aria-live="polite" className={`fixed bottom-5 left-1/2 z-[60] -translate-x-1/2 rounded-lg bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-xl transition-all ${toast ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-8 opacity-0"}`}>{toast}</div>
  </>;
}
