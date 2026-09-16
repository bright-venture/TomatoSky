import Link from "next/link";

export function Wordmark({ light = false }: { light?: boolean }) {
  return <Link href="/" aria-label="TomatoSky home" className={`wordmark ${light ? "wordmark-light" : ""}`}>tomato<span>sky</span><i aria-hidden="true" /></Link>;
}
