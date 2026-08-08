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

const ESCAPED_TAG = /&lt;\/?[a-z][\s\S]*?&gt;/i;

/** Some feeds ship double-escaped markup ("&lt;p&gt;Text&lt;/p&gt;") which would
 * otherwise render as literal, unreadable text. Decode it back to real HTML. */
function decodeEscapedMarkup(value: string): string {
  if (!ESCAPED_TAG.test(value)) return value;
  const el = document.createElement("textarea");
  el.innerHTML = value;
  return el.value;
}

const HTML_TAG = /<\/?(p|div|br|ul|ol|li|h[1-6]|table|section|article|span|strong|em|blockquote|pre)\b[^>]*>/i;

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/**
 * Recruiters paste plain text into the submit form, so newlines are the only
 * paragraph signal they give us. HTML collapses those, which is why submitted
 * descriptions used to render as one solid block. Convert blank-line-separated
 * blocks into real paragraphs (and single newlines into <br>) before
 * sanitising. Descriptions that already contain markup pass through unchanged.
 */
export function renderDescriptionHtml(
  content: string | null | undefined
): string {
  if (!content) return "";
  const value = decodeEscapedMarkup(content).trim();
  if (!value) return "";

  if (HTML_TAG.test(value)) return sanitizeHtml(value);

  const html = value
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, "<br />")}</p>`)
    .join("");

  return sanitizeHtml(html);
}
