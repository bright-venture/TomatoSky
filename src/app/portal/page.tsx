import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalWorkspace } from "@/components/portal-workspace";
import { requireEmployee } from "@/lib/auth/employee";

export const metadata: Metadata = { title: "Employee portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const { supabase, member } = await requireEmployee();
  const { data: brands, error } = await supabase.from("brands").select("id, slug, name").order("name");
  if (error) redirect("/auth/access?reason=unavailable");
  return <PortalWorkspace displayName={member.display_name} brands={brands ?? []} />;
}
