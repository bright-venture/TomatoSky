import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { LoginForm } from "@/components/login-form";

export const metadata: Metadata = { title: "Employee sign in", robots: { index: false, follow: false } };
export default function LoginPage() {
  return <AuthShell><p className="eyebrow">EMPLOYEE PORTAL</p><h1>Welcome back.</h1><p className="auth-intro">Sign in to your TomatoSky workspace.</p><LoginForm /></AuthShell>;
}
