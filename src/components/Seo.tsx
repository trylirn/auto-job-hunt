import { Helmet } from "react-helmet-async";
import type { PageMeta } from "@/lib/seo";
import { SITE_NAME } from "@/lib/seo";

interface SeoProps extends PageMeta {
  /** Structured data blocks emitted as application/ld+json. */
  jsonLd?: unknown[];
  /** Prerender status hint used by the edge layer (e.g. 404, 410). */
  statusCode?: number;
}

/**
 * The one place head metadata is written. Every page renders exactly one of
 * these, so titles, descriptions, canonicals and social tags can never drift.
 */
export function Seo({
  title,
  description,
  canonical,
  image,
  noindex,
  type = "website",
  jsonLd = [],
  statusCode,
}: SeoProps) {
  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large" />
      )}
      {statusCode && (
        <meta name="prerender-status-code" content={String(statusCode)} />
      )}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonical} />
      {image && <meta property="og:image" content={image} />}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}

      {jsonLd.map((block, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}
