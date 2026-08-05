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
    title: "Remote International Development Jobs",
    description:
      "Browse remote jobs for international development professionals — NGO, UN, humanitarian and global health roles, updated daily.",
    indexable: true,
    changefreq: "daily",
    priority: 1.0,
  },
  {
    path: "/opportunities",
    title: "Fellowships, Scholarships & Grants",
    description:
      "Fellowships, scholarships, grants, conferences and programmes for international development professionals.",
    indexable: true,
    changefreq: "daily",
    priority: 0.9,
  },
  {
    path: "/jobs/in",
    title: "Jobs by Country & City",
    description:
      "Browse remote international development, UN and NGO jobs by country and region — every location with a live opening.",
    indexable: true,
    changefreq: "daily",
    priority: 0.8,
  },
  {
    path: "/guides/un-careers",
    title: "UN Careers Guide",
    description:
      "How UN recruitment works — job grades, Inspira, the Personal History Profile, JPO and YPP routes.",
    indexable: true,
    changefreq: "monthly",
    priority: 0.7,
  },
  {
    path: "/newsletter",
    title: "Weekly Newsletter",
    description:
      "A weekly digest of new remote jobs across the international development sector.",
    indexable: true,
    changefreq: "weekly",
    priority: 0.6,
  },
  {
    path: "/submit",
    title: "Post a Remote Job — Free",
    description:
      "Post a remote role for international development professionals. Free, no account needed, live immediately.",
    indexable: true,
    changefreq: "monthly",
    priority: 0.6,
  },
  {
    path: "/about",
    title: "About",
    description:
      "Eplicant is a remote job board for international development professionals — connecting talent with mission-driven roles worldwide.",
    indexable: true,
    changefreq: "yearly",
    priority: 0.4,
  },
  {
    path: "/contact",
    title: "Contact",
    description:
      "Contact the Eplicant team for partnerships, feedback, or questions about jobs and opportunities.",
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
