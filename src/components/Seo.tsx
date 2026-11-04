import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";
import type { PageMeta } from "@/lib/seo";
import { SITE_NAME, applyQueryToMeta, buildMeta } from "@/lib/seo";
import { getStaticRoute } from "@/lib/routes";

interface SeoProps extends PageMeta {
  /** Structured data blocks emitted as application/ld+json. */
  jsonLd?: unknown[];
  /** Prerender status hint (e.g. 404, 410). The real HTTP status is set by netlify/edge-functions/seo.ts. */
  statusCode?: number;
}

/**
 * The one place head metadata is written. Every page renders exactly one of
 * these, so titles, descriptions, canonicals and social tags can never drift.
 *
 * The Netlify edge function writes the same tags into the HTML before it is
 * sent (marked data-rh="true"), and Helmet replaces them here once React loads.
 * Both sides run `applyQueryToMeta`, so ?page=2 and filter URLs get the same
 * title/canonical/robots on the server and in the browser.
 */
export function Seo({ jsonLd = [], statusCode, ...rawMeta }: SeoProps) {
  const { search } = useLocation();
  const { title, description, canonical, image, noindex, type = "website" } =
    statusCode && statusCode >= 400 ? { ...rawMeta, noindex: true } : applyQueryToMeta(rawMeta, search);

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />
      {noindex ? (
        <meta name="robots" content="noindex, follow" />
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

/** Head tags for a page listed in src/lib/routes.ts (About, Terms, …). */
export function StaticPageSeo({ path, jsonLd }: { path: string; jsonLd?: unknown[] }) {
  const route = getStaticRoute(path);
  const meta = buildMeta({
    title: route?.title ?? SITE_NAME,
    description: route?.description ?? "",
    path,
    rawTitle: !route,
  });
  return <Seo {...meta} jsonLd={jsonLd} />;
}
