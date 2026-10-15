import { useId } from "react";

/**
 * The Gunungan mark: the wayang shadow-play opener cut down to its
 * silhouette, with a terminal cursor inside and a turmeric dot — the period
 * that ends every ABAP statement. Drawn in a 64×64 box.
 *
 * `tone="inverse"` swaps to a light tile for dark grounds.
 */
export function LogoMark({
  size = 36,
  tone = "default",
  className,
  title,
}: {
  size?: number;
  tone?: "default" | "inverse";
  className?: string;
  title?: string;
}) {
  const id = useId();
  const field = tone === "inverse" ? "#eef0ff" : `url(#${id})`;
  const shape = tone === "inverse" ? "#2a32a8" : "#ffffff";
  const cursor = tone === "inverse" ? "#eef0ff" : "#3039b0";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#5560f0" />
          <stop offset="1" stopColor="#262da0" />
        </linearGradient>
      </defs>
      <rect width="64" height="64" rx="18" fill={field} />
      <path d="M32 9C40 17 49 25 49 38V53H15V38C15 25 24 17 32 9Z" fill={shape} />
      <path d="M24.5 32L31 37.5L24.5 43" fill="none" stroke={cursor} strokeWidth="4.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="38.5" cy="42" r="3.4" fill="#f2b632" />
    </svg>
  );
}

/** "abap nusantara." — the name from Settings, lower-cased, closed by the turmeric period. */
export function Wordmark({ name, accent, className = "" }: { name: string; accent?: string; className?: string }) {
  return (
    <span className={`wordmark ${className}`}>
      {name.toLowerCase()}
      {accent && (
        <>
          {" "}
          <span className="wordmark-lite">{accent.toLowerCase()}</span>
        </>
      )}
      <span className="text-kunyit">.</span>
    </span>
  );
}
