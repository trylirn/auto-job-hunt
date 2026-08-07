/**
 * Static route registry. Feeds the router, the sitemap, llms.txt and the
 * edge prerenderer so the three can never disagree about what exists.
 */

export interface StaticRoute {
  path: string;
  title: string;
  description: string;
  /** Include in sitemap.xml / llms.txt. */
  indexable: boolean;
  changefreq: "daily" | "weekly" | "monthly" | "yearly";
  priority: number;
}

export const STATIC_ROUTES: StaticRoute[] = [
  {
    path: "/",
    title: "Remote Jobs — Work From Anywhere",
    description:
      "Browse fully remote jobs across every industry — engineering, design, marketing, support, operations and more. Updated daily, no commute, no relocation.",
    indexable: true,
    changefreq: "daily",
    priority: 1.0,
  },
  {
    path: "/jobs/in",
    title: "Remote Jobs by Country",
    description:
      "Browse fully remote jobs by country and region — work-from-anywhere roles open to candidates in your location.",
    indexable: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/newsletter",
    title: "Weekly Newsletter",
    description:
      "A weekly digest of new fully remote jobs, delivered to your inbox.",
    indexable: true,
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    path: "/submit",
    title: "Post a Remote Job — Free",
    description:
      "Post a fully remote role for free. No account needed, live immediately.",
    indexable: true,
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/about",
    title: "About",
    description:
      "Eplicant is a remote-only job board — every listing is a fully remote role you can do from anywhere.",
    indexable: true,
    changefreq: "yearly",
    priority: 0.4,
  },
  {
    path: "/contact",
    title: "Contact",
    description:
      "Contact the Eplicant team for partnerships, feedback, or questions about remote jobs.",
    indexable: true,
    changefreq: "yearly",
    priority: 0.3,
  },
  {
    path: "/terms",
    title: "Terms of Service",
    description: "The terms governing your use of Eplicant.",
    indexable: true,
    changefreq: "yearly",
    priority: 0.2,
  },
  {
    path: "/privacy",
    title: "Privacy Policy",
    description: "How Eplicant collects, uses and protects your information.",
    indexable: true,
    changefreq: "yearly",
    priority: 0.2,
  },
];

export function getStaticRoute(path: string): StaticRoute | undefined {
  return STATIC_ROUTES.find((r) => r.path === path);
}
