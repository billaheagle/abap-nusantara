"use client";

import "./globals.css";
import { ErrorContent } from "@/components/ui/error-content";

// Replaces the root layout when it fails (its metadata reads settings from the
// database), so it brings its own document and styles. The fonts live
// in the root layout and aren't loaded here; the system fallbacks stand in.
export default function GlobalError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="id" data-theme="light">
      <body className="min-h-screen bg-background text-foreground">
        <main>
          <ErrorContent error={error} retry={retry} fullScreen />
        </main>
      </body>
    </html>
  );
}
