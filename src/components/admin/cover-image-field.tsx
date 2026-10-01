"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { ImagePlus, Loader2 } from "lucide-react";

/**
 * Cover-image control for the article editor. Uploads through the existing
 * /api/admin/media/upload endpoint (which sniffs the MIME type, re-encodes
 * via sharp, and records a Media row), shows a preview, and keeps the
 * resulting path in a hidden input so it submits with the form. A collapsed
 * "paste a URL" fallback stays available for images hosted elsewhere.
 *
 * Uncontrolled with `name` (article form) or controlled with `value` +
 * `onChange` (settings forms, which serialise their own state). `square`
 * switches the preview to a small square, e.g. for a profile photo.
 */
export function CoverImageField({
  name,
  defaultValue,
  value: controlledValue,
  onChange,
  label = "Cover image",
  uploadLabel = "Upload cover image",
  square = false,
}: {
  name?: string;
  defaultValue?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  uploadLabel?: string;
  square?: boolean;
}) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const value = controlledValue ?? internalValue;
  const setValue = (next: string) => {
    setInternalValue(next);
    onChange?.(next);
  };
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/media/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      setValue(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = "";
  }

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {name && <input type="hidden" name={name} value={value} />}

      {value ? (
        <div className={`overflow-hidden rounded-md border border-border ${square ? "max-w-[14rem]" : ""}`}>
          <div className={`relative bg-surface ${square ? "aspect-square" : "aspect-[16/9]"}`}>
            <Image src={value} alt={`${label} preview`} fill sizes="360px" className="object-cover" unoptimized={!value.startsWith("/")} />
          </div>
          <div className="flex items-center justify-between gap-2 border-t border-border bg-surface-elevated px-3 py-2">
            <span className="truncate font-mono text-xs text-foreground-muted">{value}</span>
            <div className="flex shrink-0 gap-2.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="text-xs font-medium text-brand hover:underline"
              >
                {uploading ? "Uploading…" : "Replace"}
              </button>
              <button
                type="button"
                onClick={() => setValue("")}
                className="text-xs font-medium text-negative hover:underline"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const file = e.dataTransfer.files?.[0];
            if (file) upload(file);
          }}
          className={`flex w-full flex-col items-center justify-center gap-2 rounded-md border border-dashed px-4 py-7 text-center transition-colors ${
            dragging ? "border-brand bg-brand-tint" : "border-border-strong hover:border-brand hover:bg-surface"
          }`}
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-brand" />
          ) : (
            <ImagePlus className="h-5 w-5 text-foreground-muted" />
          )}
          <span className="text-sm font-medium">{uploading ? "Uploading…" : uploadLabel}</span>
          <span className="text-xs text-foreground-muted">PNG, JPEG or WebP · up to 8 MB · or drop a file here</span>
        </button>
      )}

      <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={onPick} />

      {error && <p className="mt-1 text-xs text-negative">{error}</p>}

      <details className="mt-2">
        <summary className="cursor-pointer select-none text-xs text-foreground-muted hover:text-foreground">
          or paste an image URL
        </summary>
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="/uploads/… or https://…"
          className="mt-1.5 w-full rounded-md border border-border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand/40"
        />
      </details>
    </div>
  );
}
