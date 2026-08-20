let sessionRequest: Promise<void> | null = null;

export function ensureDemoSession() {
  sessionRequest ??= fetch("/api/demo-session", {
    credentials: "same-origin",
    cache: "no-store",
  }).then(async (response) => {
    if (response.ok) return;
    const payload = await response.json().catch(() => ({})) as { error?: string };
    sessionRequest = null;
    throw new Error(payload.error ?? "AI demo access could not be initialized.");
  });
  return sessionRequest;
}
