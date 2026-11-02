import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, SquareTerminal } from "lucide-react";
import { getSetting } from "@/features/settings/queries";
import exercises from "@/components/tools/abap-playground/content/exercises.json";

export const metadata: Metadata = {
  title: "Latihan ABAP",
  description:
    "Latihan ABAP interaktif yang langsung diperiksa otomatis dengan ABAP Unit. Kerjakan di browser, tanpa server SAP: dari IF dan loop sampai class, exception, dan Open SQL.",
};

interface Exercise {
  id: string;
  title: string;
  level: string;
  /** static HTML written in content/exercises.json */
  brief: string;
}

export default async function LatihanPage() {
  // The exercises live in the playground; hiding the tool hides them too.
  if ((await getSetting("tools")).hidden.includes("abap-playground")) notFound();
  const list = exercises as Exercise[];

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 sm:py-16">
      <h1 className="display text-[clamp(2rem,4.6vw,3.25rem)] font-bold leading-[1.05]">Latihan ABAP</h1>
      <p className="mt-3 max-w-2xl text-foreground-muted">
        Setiap latihan berisi kode awal yang perlu kamu lengkapi. Tekan <b>Periksa</b> dan jawabanmu diuji dengan ABAP Unit, langsung di browser. Progresmu
        tersimpan di perangkat ini.
      </p>

      <ol className="mt-10 grid gap-4">
        {list.map((ex, i) => (
          <li key={ex.id}>
            <Link
              href={`/tools/abap-playground?latihan=${ex.id}`}
              className="group flex items-start gap-4 rounded-xl border border-border bg-surface-elevated p-5 transition-colors hover:border-brand"
            >
              <span className="inline-flex h-10 w-10 flex-none items-center justify-center rounded-[12px] bg-brand-tint font-mono text-sm font-bold text-brand">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-xs font-semibold uppercase tracking-wide text-brand">{ex.level}</span>
                <span className="mt-0.5 block text-lg font-bold leading-snug">{ex.title}</span>
                <span
                  className="mt-1.5 block text-sm leading-relaxed text-foreground-muted [&_code]:font-mono [&_code]:text-[0.85em]"
                  dangerouslySetInnerHTML={{ __html: ex.brief }}
                />
              </span>
              <ArrowRight className="mt-2 h-4 w-4 flex-none text-foreground-muted transition-transform group-hover:translate-x-0.5 group-hover:text-brand" />
            </Link>
          </li>
        ))}
      </ol>

      <Link
        href="/tools/abap-playground?contoh=blank"
        className="mt-10 inline-flex items-center gap-2 rounded-xl border border-border bg-surface-elevated px-4 py-2.5 text-sm font-semibold transition-colors hover:border-brand hover:text-brand-dark"
      >
        <SquareTerminal className="h-4 w-4" /> Buka playground kosong
      </Link>
    </div>
  );
}
