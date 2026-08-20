import { checkSupabaseConnection } from "@/lib/supabase/client";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  try {
    await checkSupabaseConnection();
    return Response.json({ connected: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Connection failed.";
    return Response.json({ connected: false, error: message }, { status: 503 });
  }
}
