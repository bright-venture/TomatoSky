import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireEmployee } from "@/lib/auth/employee";
import { AuthShell } from "@/components/auth-shell";
import { MfaForm } from "@/components/mfa-form";

export const metadata: Metadata = { title: "Verify your sign in", robots: { index: false, follow: false } };
export default async function MfaPage() {
  const { claims } = await requireEmployee(false);
  if (claims.aal === "aal2") redirect("/portal");
  return <AuthShell><p className="eyebrow">SECURE EMPLOYEE ACCESS</p><h1>One more step.</h1><MfaForm /></AuthShell>;
}
