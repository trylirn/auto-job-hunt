import DOMPurify from "dompurify";

// Sanitize untrusted HTML before injecting via dangerouslySetInnerHTML.
// Any newly-submitted job description is user-controlled until the AI
// cleanup pass runs, so treat all rich-text content as untrusted.
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return "";
  return DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ["style", "script", "iframe", "object", "embed", "form"],
    FORBID_ATTR: ["style", "onerror", "onload", "onclick"],
  });
}
