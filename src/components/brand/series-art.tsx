import Image from "next/image";
import { CoverArt } from "./cover-art";

/**
 * Plain illustrated background (no text) for a series card. The content repo keeps it at
 * assets/series/latar/<slug>.jpg, and `content:import` copies it to public/series/latar/.
 * Whether a series has one follows from its cover: coverImage `/series/<slug>.jpg`.
 */
export function seriesArtUrl(coverImage: string | null | undefined): string | null {
  const m = /^\/series\/([a-z0-9-]+)\.jpg$/.exec(coverImage ?? "");
  return m ? `/series/latar/${m[1]}.jpg` : null;
}

/**
 * Background of a series card: the illustration when the series has one, otherwise the
 * generated cover art. `className` positions it (`absolute inset-0 -z-10 ...`).
 */
export function SeriesArt({
  coverImage,
  tone,
  seed,
  sizes,
  className,
  scrim = "bottom",
}: {
  coverImage: string | null | undefined;
  tone: number;
  seed: number;
  sizes: string;
  className: string;
  /** "side" also darkens the left, for big text that sits beside the illustration. */
  scrim?: "bottom" | "side";
}) {
  const art = seriesArtUrl(coverImage);
  if (!art) return <CoverArt tone={tone} seed={seed} className={className} />;
  return (
    <>
      <Image src={art} alt="" fill sizes={sizes} className={`${className} object-cover object-right`} />
      {/* Keeps the white text readable over the lighter parts of the illustration. */}
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-black/75 via-black/35 to-black/5" />
      {scrim === "side" && <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-r from-black/45 via-black/15 to-transparent" />}
    </>
  );
}
