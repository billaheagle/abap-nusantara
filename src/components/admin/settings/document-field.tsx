"use client";

import { useRef, useState } from "react";
import { ExternalLink, FileText, Loader2, Upload } from "lucide-react";
import { fieldClass, useIssue } from "@/components/admin/settings/fields";

/**
 * PDF upload control (Hire Me CV). Uploads to /api/admin/documents/upload and
 * stores the returned /uploads/… path; a "paste a URL" fallback keeps
 * externally hosted files (e.g. Google Drive) possible.
 */
export function DocumentField({
  label,
  hint,
  value,
  onChange,
  path,
}: {
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  /** Settings path for validation messages, e.g. "hero.resumeUrl". */
  path?: string;
}) {
  const error = useIssue(path);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [justUploaded, setJustUploaded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    setUploadError(null);
    setJustUploaded(false);
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/admin/documents/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Upload failed");
      onChange(data.url);
      setJustUploaded(true);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  const isUploaded = value.startsWith("/uploads/");
  const message = uploadError ?? error;

  return (
    <div>
      <span className="mb-1 block text-sm font-medium">{label}</span>

      {value ? (
        <div className="flex flex-wrap items-center gap-3 rounded-md border border-border bg-surface/50 px-3 py-2.5">
          <FileText className="h-5 w-5 shrink-0 text-brand" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">{isUploaded ? "Uploaded PDF" : "External link"}</p>
            <p className="truncate font-mono text-xs text-foreground-muted">{value}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <a href={value} target="_blank" rel="noopener noreferrer" className="admin-btn admin-btn-icon" title="Open" aria-label="Open file">
              <ExternalLink />
            </a>
            <button type="button" className="admin-btn admin-btn-brand" onClick={() => inputRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="animate-spin" /> : <Upload />} {uploading ? "Uploading…" : "Replace"}
            </button>
            <button
              type="button"
              className="admin-btn admin-btn-negative"
              onClick={() => {
                setJustUploaded(false);
                onChange("");
              }}
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex w-full items-center justify-center gap-2 rounded-md border border-dashed border-border-strong px-4 py-5 text-sm font-medium transition-colors hover:border-brand hover:bg-surface"
        >
          {uploading ? <Loader2 className="h-4 w-4 animate-spin text-brand" /> : <Upload className="h-4 w-4 text-foreground-muted" />}
          {uploading ? "Uploading…" : "Upload PDF (max 10 MB)"}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
          e.target.value = "";
        }}
      />

      {message ? (
        <p className="mt-1 text-xs text-negative">{message}</p>
      ) : justUploaded && value ? (
        <p className="mt-1 text-xs font-medium text-positive">Uploaded ✓ — click Save at the bottom to put it on the page.</p>
      ) : (
        hint && <p className="mt-1 text-xs text-foreground-muted">{hint}</p>
      )}

      <details className="mt-2">
        <summary className="cursor-pointer select-none text-xs text-foreground-muted hover:text-foreground">or paste a link instead</summary>
        {/* type="text", not "url": uploaded files are site paths (/uploads/…),
            which native URL validation would reject and silently block Save. */}
        <input
          type="text"
          inputMode="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://drive.google.com/…"
          className={`${fieldClass} mt-1.5 font-mono`}
        />
      </details>
    </div>
  );
}
