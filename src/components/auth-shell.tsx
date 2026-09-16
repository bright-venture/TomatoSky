import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Wordmark } from "./wordmark";

export function AuthShell({ children }: { children: React.ReactNode }) {
  return <main className="auth-page">
    <header className="auth-header"><Wordmark /><Link href="/"><ArrowLeft size={16} /> Back to TomatoSky</Link></header>
    <div className="auth-card"><span className="auth-symbol"><ShieldCheck size={28} strokeWidth={1.5} /></span>{children}</div>
    <p className="auth-footer">TOMATO SKY SAL · Employee access only</p>
  </main>;
}
