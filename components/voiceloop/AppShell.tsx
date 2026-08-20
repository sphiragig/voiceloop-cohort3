import type { ReactNode } from "react";
import { DashboardIcon, MenuIcon, ReviewsIcon, SparklesIcon, UploadIcon } from "./icons";

export type Screen = "upload" | "dashboard" | "reviews" | "digest";

const navItems = [
  { id: "upload" as const, label: "Upload", icon: UploadIcon },
  { id: "dashboard" as const, label: "Dashboard", icon: DashboardIcon },
  { id: "reviews" as const, label: "Reviews", icon: ReviewsIcon },
  { id: "digest" as const, label: "AI Digest", icon: SparklesIcon },
];

const screenCopy: Record<Screen, { title: string; subtitle: string }> = {
  upload: { title: "Upload reviews", subtitle: "Bring customer feedback into one place." },
  dashboard: { title: "Dashboard", subtitle: "See what your customers are saying." },
  reviews: { title: "Review Explorer", subtitle: "Search and explore every review." },
  digest: { title: "AI Digest", subtitle: "Turn feedback into clear priorities." },
};

type Props = {
  screen: Screen;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
  onNavigate: (screen: Screen) => void;
  children: ReactNode;
};

export function AppShell({ screen, mobileOpen, onMobileOpenChange, onNavigate, children }: Props) {
  const navigate = (next: Screen) => {
    onNavigate(next);
    onMobileOpenChange(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      {mobileOpen && <button className="fixed inset-0 z-30 bg-slate-950/45 lg:hidden" aria-label="Close navigation" onClick={() => onMobileOpenChange(false)} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-slate-200 bg-white px-4 py-6 transition-transform duration-200 lg:translate-x-0 ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <button onClick={() => navigate("dashboard")} className="mb-8 flex items-center gap-3 px-2 text-left">
          <span className="grid size-9 place-items-center rounded-xl bg-blue-600 text-sm font-bold text-white shadow-lg shadow-blue-600/20">V</span>
          <span><strong className="block text-lg leading-tight">VoiceLoop</strong><span className="text-xs text-slate-500">Feedback intelligence</span></span>
        </button>
        <nav className="space-y-1" aria-label="Main navigation">
          {navItems.map(({ id, label, icon: NavIcon }) => (
            <button key={id} onClick={() => navigate(id)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${screen === id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-950"}`} aria-current={screen === id ? "page" : undefined}>
              <NavIcon className="size-5" />{label}
            </button>
          ))}
        </nav>
        <div className="mt-auto rounded-xl border border-slate-200 bg-slate-50 p-3">
          <div className="flex items-center gap-3">
            <span className="grid size-9 place-items-center rounded-full bg-teal-100 text-xs font-bold text-teal-700">NB</span>
            <span><strong className="block text-sm">North &amp; Bean</strong><span className="text-xs text-slate-500">Restaurant workspace</span></span>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-[76px] items-center gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
          <button className="grid size-10 place-items-center rounded-lg border border-slate-200 text-slate-600 lg:hidden" onClick={() => onMobileOpenChange(true)} aria-label="Open navigation"><MenuIcon className="size-5" /></button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-base font-bold sm:text-lg">{screenCopy[screen].title}</h1>
            <p className="hidden truncate text-xs text-slate-500 sm:block">{screenCopy[screen].subtitle}</p>
          </div>
          <button onClick={() => navigate("upload")} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"><UploadIcon className="size-4" /><span className="hidden sm:inline">Upload CSV</span></button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}

export function SectionHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="mb-2 text-[11px] font-bold tracking-[0.12em] text-blue-600">{eyebrow}</p><h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2><p className="mt-1 text-sm text-slate-500 sm:text-base">{description}</p></div>
      {action}
    </div>
  );
}

export const Card = ({ children, className = "" }: { children: ReactNode; className?: string }) => <div className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`}>{children}</div>;
export const OutlineButton = ({ children, onClick, disabled = false }: { children: ReactNode; onClick?: () => void; disabled?: boolean }) => <button disabled={disabled} onClick={onClick} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:border-slate-400 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40">{children}</button>;
