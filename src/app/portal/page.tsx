import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PortalWorkspace } from "@/components/portal-workspace";
import { requireEmployee } from "@/lib/auth/employee";
import type { Folder } from "@/lib/portal/folder-types";

export const metadata: Metadata = { title: "Employee portal", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function PortalPage() {
  const { supabase } = await requireEmployee();
  const [{ data: brands, error: brandsError }, folderResult] = await Promise.all([
    supabase.from("brands").select("id, slug, name").order("name"),
    supabase.from("portal_folders").select("id, module, parent_id, name").order("name"),
  ]);
  if (brandsError) redirect("/auth/access?reason=unavailable");
  // Folders are non-fatal: if the portal_folders migration has not been applied
  // yet, the portal still loads and the folder sections simply appear empty.
  const folders = (folderResult.data ?? []) as Folder[];
  return <PortalWorkspace brands={brands ?? []} folders={folders} />;
}
