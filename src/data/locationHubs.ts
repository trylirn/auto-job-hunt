// Curated international-development hubs for /jobs/in/:city landing pages.
// Each hub powers a dedicated SEO landing page and a sitemap entry.

export interface LocationHub {
  slug: string;          // URL slug, e.g. "nairobi"
  city: string;          // Display name, e.g. "Nairobi"
  country: string;       // Country for breadcrumbs / title
  locationQuery: string; // Substring matched against jobs.location (case-insensitive)
  blurb: string;         // 1-2 sentence intro shown on the page and in meta description
  keywords: string[];    // Target queries — surfaced in JSON-LD + on-page text
}

export const LOCATION_HUBS: LocationHub[] = [
  {
    slug: "nairobi",
    city: "Nairobi",
    country: "Kenya",
    locationQuery: "Nairobi",
    blurb:
      "Nairobi is one of the world's largest international development hubs — home to UN-Habitat, UNEP, the ICRC regional delegation, and hundreds of NGOs working across East Africa.",
    keywords: ["UN jobs in Kenya", "NGO jobs Nairobi", "international development jobs Nairobi"],
  },
  {
    slug: "new-york",
    city: "New York",
    country: "United States",
    locationQuery: "New York",
    blurb:
      "New York hosts UN Headquarters, UNICEF, UNDP, UN Women, and the largest concentration of UN-system roles globally, alongside major foundations and policy institutes.",
    keywords: ["UN jobs in NYC", "UN jobs New York", "international NGO jobs New York"],
  },
  {
    slug: "geneva",
    city: "Geneva",
    country: "Switzerland",
    locationQuery: "Geneva",
    blurb:
      "Geneva is the operational headquarters of the WHO, UNHCR, OHCHR, ILO, WTO, IFRC, and ICRC — the world's densest cluster of humanitarian and human-rights employers.",
    keywords: ["UN jobs Geneva", "WHO jobs Geneva", "humanitarian jobs Geneva"],
  },
  {
    slug: "washington-dc",
    city: "Washington, D.C.",
    country: "United States",
    locationQuery: "Washington",
    blurb:
      "Washington, D.C. is home to the World Bank, IMF, IFC, IDB, USAID, and most major US-based international development NGOs and think tanks.",
    keywords: ["World Bank jobs Washington DC", "international development jobs DC", "USAID jobs"],
  },
  {
    slug: "london",
    city: "London",
    country: "United Kingdom",
    locationQuery: "London",
    blurb:
      "London hosts FCDO, the Commonwealth Secretariat, Save the Children, Oxfam GB, ODI, and a deep ecosystem of international development consultancies.",
    keywords: ["international development jobs London", "NGO jobs London", "FCDO jobs"],
  },
  {
    slug: "addis-ababa",
    city: "Addis Ababa",
    country: "Ethiopia",
    locationQuery: "Addis Ababa",
    blurb:
      "Addis Ababa is the seat of the African Union and the UN Economic Commission for Africa, and a primary base for humanitarian operations across the Horn of Africa.",
    keywords: ["UN jobs Addis Ababa", "African Union jobs", "NGO jobs Ethiopia"],
  },
  {
    slug: "bangkok",
    city: "Bangkok",
    country: "Thailand",
    locationQuery: "Bangkok",
    blurb:
      "Bangkok is the regional hub for UN agencies covering Asia and the Pacific — ESCAP, UNICEF EAPRO, UNDP RBAP, FAO RAP, and OCHA ROAP are all based here.",
    keywords: ["UN jobs Bangkok", "NGO jobs Bangkok", "Asia Pacific development jobs"],
  },
  {
    slug: "dakar",
    city: "Dakar",
    country: "Senegal",
    locationQuery: "Dakar",
    blurb:
      "Dakar serves as the West and Central Africa regional hub for UNICEF, UNFPA, WFP, OCHA, and many INGOs operating across the Sahel.",
    keywords: ["UN jobs Dakar", "NGO jobs Senegal", "West Africa humanitarian jobs"],
  },
];

export function getHubBySlug(slug: string): LocationHub | undefined {
  return LOCATION_HUBS.find((h) => h.slug === slug.toLowerCase());
}
