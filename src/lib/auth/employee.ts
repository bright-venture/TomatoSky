import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Call this in each protected page, server action, and API handler.
// Never rely on a layout, a browser check, or editable user_metadata for access.
export async function requireEmployee(requireMfa = true) {
  const supabase = await createClient();
  const verified = await supabase.auth.getClaims().catch(() => null);
  if (!verified || verified.error || !verified.data?.claims?.sub) redirect("/login");
  const claims = verified.data.claims;
  const { data: member, error } = await supabase
    .from("portal_members")
    .select("user_id, display_name, role, active")
    .eq("user_id", claims.sub)
    .maybeSingle();

  if (error) redirect("/auth/access?reason=unavailable");
  if (!member?.active || member.role !== "admin") redirect("/auth/access");
  if (requireMfa && claims.aal !== "aal2") redirect("/auth/mfa");
  return { supabase, member, claims };
}
