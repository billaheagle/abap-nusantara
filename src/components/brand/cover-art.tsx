import { useId } from "react";

/**
 * Generated cover art: a series hue, a soft light, one motif and grain.
 * Replaces the PNG covers on cards and article headers so every article
 * reads as part of the same system (the PNGs still serve social previews).
 *
 * `tone` picks the hue: series order 1–5, or any number for articles outside
 * a series (hashed from the slug by `coverTone`).
 */

const HUES: [mid: string, light: string, deep: string][] = [
  ["#3a43c9", "#5b66f2", "#262c96"],
  ["#0f8f7a", "#22b89c", "#0a6152"],
  ["#c46a12", "#f0952f", "#8e4a07"],
  ["#b8336a", "#e35b92", "#7f1f49"],
  ["#6b3fc4", "#9068ec", "#4a2690"],
];

/** Series order → tone index; standalone articles get a stable tone from their slug. */
export function coverTone(seriesOrder: number | null | undefined, slug: string): number {
  if (seriesOrder && seriesOrder > 0) return (seriesOrder - 1) % HUES.length;
  let h = 0;
  for (const ch of slug) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % HUES.length;
}

function Motif({ tone }: { tone: number }) {
  const stroke = { fill: "none", stroke: "#fff", strokeOpacity: 0.24, strokeWidth: 9, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (tone) {
    case 0: // an arch between two points: the first bridge
      return (
        <>
          <path d="M540 430V300a95 95 0 0 1 190 0v130" {...stroke} />
          <circle cx="800" cy="420" r="30" fill="#f2b632" />
        </>
      );
    case 1: // request and reply
      return (
        <>
          <path d="M430 260h350M730 210l50 50-50 50M780 360H430M480 310l-50 50 50 50" {...stroke} />
          <circle cx="605" cy="310" r="26" fill="#f2b632" />
        </>
      );
    case 2: // a shield: integrations that hold up
      return (
        <>
          <path d="M600 150l130 50v90c0 80-60 130-130 160-70-30-130-80-130-160v-90z" {...stroke} />
          <circle cx="600" cy="300" r="24" fill="#f2b632" />
        </>
      );
    case 3: // two shapes joined: mapping
      return (
        <>
          <rect x="430" y="190" width="120" height="80" rx="16" {...stroke} />
          <rect x="650" y="330" width="120" height="80" rx="16" {...stroke} />
          <path d="M550 230c70 0 50 140 100 140" {...stroke} />
          <circle cx="600" cy="300" r="20" fill="#f2b632" />
        </>
      );
    default: // a monitored line
      return (
        <>
          <path d="M420 380l90-60 80 50 120-150 80 60" {...stroke} />
          <circle cx="710" cy="220" r="24" fill="#f2b632" />
        </>
      );
  }
}

export function CoverArt({ tone, seed = 0, className }: { tone: number; seed?: number; className?: string }) {
  const id = useId();
  const [mid, light, deep] = HUES[((tone % HUES.length) + HUES.length) % HUES.length];
  const shift = (seed * 37) % 160;

  return (
    <svg viewBox="0 0 1000 560" preserveAspectRatio="xMidYMid slice" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}g`} cx={`${70 + shift / 8}%`} cy="20%" r="90%">
          <stop offset="0" stopColor={light} />
          <stop offset="0.55" stopColor={mid} />
          <stop offset="1" stopColor={deep} />
        </radialGradient>
        <filter id={`${id}n`}>
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0" />
        </filter>
      </defs>
      <rect width="1000" height="560" fill={`url(#${id}g)`} />
      <circle cx={820 - shift} cy="80" r="260" fill="#fff" fillOpacity="0.07" />
      <circle cx={140 + shift} cy="560" r="220" fill="#000" fillOpacity="0.1" />
      <Motif tone={tone % HUES.length} />
      <rect width="1000" height="560" filter={`url(#${id}n)`} />
    </svg>
  );
}
