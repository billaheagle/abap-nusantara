/**
 * Comments are stored and rendered as PLAIN TEXT — never HTML. React escapes
 * them on output, which is what rules out XSS; this only drops anything that
 * looks like a tag so stored comments stay clean text, plus control
 * characters other than newlines and tabs.
 *
 * It used to run DOMPurify through isomorphic-dompurify, which drags jsdom
 * into the server bundle of every page with a comment form. jsdom fails to
 * load on Vercel's runtime (ERR_REQUIRE_ESM), taking every server action on
 * the article page down with it (comments and likes). A DOM isn't needed to
 * strip tags from text that's never parsed as HTML.
 */
export function sanitizePlainText(input: string): string {
  return input
    .replace(/<\/?[a-zA-Z!][^>]*>/g, "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim();
}
