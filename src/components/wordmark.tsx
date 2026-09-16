import Link from "next/link";

// On the portal and auth pages, pass asLink={false} so the wordmark is plain
// text (no navigation). The public site uses the default linked wordmark.
export function Wordmark({ light = false, asLink = true }: { light?: boolean; asLink?: boolean }) {
  const className = `wordmark ${light ? "wordmark-light" : ""}`;
  const content = <>tomato<span>sky</span><i aria-hidden="true" /></>;
  if (!asLink) return <span aria-label="TomatoSky" className={className}>{content}</span>;
  return <Link href="/" aria-label="TomatoSky home" className={className}>{content}</Link>;
}
