"use client";

import { ErrorContent } from "@/components/ui/error-content";

// A public page that throws (usually the database) keeps the site's header and footer.
export default function PublicError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <ErrorContent error={error} retry={retry} />;
}
