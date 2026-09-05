import DOMPurify from "isomorphic-dompurify";

/**
 * Comments are stored and rendered as PLAIN TEXT — never HTML. This strips
 * any tags entirely rather than trying to allow a "safe" subset, which is
 * the simplest way to guarantee no stored/reflected XSS from comments.
 */
export function sanitizePlainText(input: string): string {
  const withoutTags = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  return withoutTags.trim();
}
