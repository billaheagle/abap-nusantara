"use client";

import { ErrorContent } from "@/components/ui/error-content";

// Errors in a layout below the root (the public layout reads settings from the
// database) land here, without the header and footer.
export default function RootError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <main>
      <ErrorContent error={error} retry={retry} fullScreen />
    </main>
  );
}
