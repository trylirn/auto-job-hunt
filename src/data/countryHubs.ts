// Country & region landing hubs for /jobs/in/:country.
//
// The board is remote-only, so a hub is not "jobs located in X" — it is
// "fully remote roles open to people working from X". Copy, keywords and
// JSON-LD are all framed that way.
//
// Hubs are only rendered if the DB has ≥1 live job matching `locationQuery`;
// empty ones are omitted from routing and the sitemap.

export interface CountryHub {
  slug: string;
  name: string;          // Display name
  locationQuery: string; // ILIKE match against jobs.location
  blurb: string;
  keywords: string[];
}

interface HubSeed {
  slug: string;
  name: string;
  locationQuery?: string;
  /** Region hubs read a little differently in copy. */
  region?: boolean;
}

const HUB_SEEDS: HubSeed[] = [
  { slug: "united-states", name: "United States" },
  { slug: "usa-global", name: "Worldwide (Remote)", locationQuery: "Global" },
  { slug: "nigeria", name: "Nigeria" },
  { slug: "united-kingdom", name: "United Kingdom" },
  { slug: "kenya", name: "Kenya" },
  { slug: "south-africa", name: "South Africa" },
  { slug: "germany", name: "Germany" },
  { slug: "canada", name: "Canada" },
  { slug: "india", name: "India" },
  { slug: "ghana", name: "Ghana" },
  { slug: "australia", name: "Australia" },
  { slug: "switzerland", name: "Switzerland" },
  { slug: "belgium", name: "Belgium" },
  { slug: "netherlands", name: "Netherlands" },
  { slug: "sweden", name: "Sweden" },
  { slug: "denmark", name: "Denmark" },
  { slug: "austria", name: "Austria" },
  { slug: "france", name: "France" },
  { slug: "ireland", name: "Ireland" },
  { slug: "ethiopia", name: "Ethiopia" },
  { slug: "uganda", name: "Uganda" },
  { slug: "senegal", name: "Senegal" },
  { slug: "egypt", name: "Egypt" },
  { slug: "jordan", name: "Jordan" },
  { slug: "bangladesh", name: "Bangladesh" },
  { slug: "philippines", name: "Philippines" },
  { slug: "singapore", name: "Singapore" },
  { slug: "thailand", name: "Thailand" },
  { slug: "japan", name: "Japan" },
  { slug: "south-korea", name: "South Korea" },
  { slug: "china", name: "China" },
  { slug: "sub-saharan-africa", name: "Sub-Saharan Africa", region: true },
  { slug: "east-africa", name: "East Africa", region: true },
  { slug: "west-africa", name: "West Africa", region: true },
  { slug: "southern-africa", name: "Southern Africa", region: true },
  { slug: "mena", name: "MENA", region: true },
  { slug: "europe", name: "Europe", region: true },
  { slug: "latin-america", name: "Latin America", region: true },
  { slug: "asia-pacific", name: "Asia-Pacific", region: true },
];

function blurbFor(seed: HubSeed): string {
  if (seed.slug === "usa-global") {
    return "Fully remote roles open to candidates anywhere in the world — no location restriction, no relocation, no office.";
  }
  const where = seed.region ? `across ${seed.name}` : `from ${seed.name}`;
  return `Fully remote jobs you can do ${where} — engineering, design, marketing, support, operations, finance and more. Every role is work-from-anywhere or explicitly open to applicants ${where}. No commute, no relocation.`;
}

function keywordsFor(seed: HubSeed): string[] {
  if (seed.slug === "usa-global") {
    return [
      "worldwide remote jobs",
      "work from anywhere jobs",
      "remote jobs no location restriction",
      "global remote hiring",
    ];
  }
  return [
    `remote jobs ${seed.name}`,
    `work from home jobs ${seed.name}`,
    `remote hiring ${seed.name}`,
    `${seed.name} work from anywhere roles`,
  ];
}

export const COUNTRY_HUBS: CountryHub[] = HUB_SEEDS.map((seed) => ({
  slug: seed.slug,
  name: seed.name,
  locationQuery: seed.locationQuery ?? seed.name,
  blurb: blurbFor(seed),
  keywords: keywordsFor(seed),
}));

export function getCountryHubBySlug(slug: string): CountryHub | undefined {
  return COUNTRY_HUBS.find((h) => h.slug === slug);
}

/**
 * City hubs are retired — a remote board has no city-specific inventory.
 * Old city URLs (both `/jobs/in/:city` and `/jobs/in/cities/:city`) redirect
 * to the country hub so existing backlinks keep their value.
 */
export const LEGACY_CITY_REDIRECTS: Record<string, string> = {
  nairobi: "/jobs/in/kenya",
  "new-york": "/jobs/in/united-states",
  geneva: "/jobs/in/switzerland",
  "washington-dc": "/jobs/in/united-states",
  london: "/jobs/in/united-kingdom",
  "addis-ababa": "/jobs/in/ethiopia",
  bangkok: "/jobs/in/thailand",
  dakar: "/jobs/in/senegal",
  lagos: "/jobs/in/nigeria",
  abuja: "/jobs/in/nigeria",
  brussels: "/jobs/in/belgium",
  rome: "/jobs/in/europe",
  vienna: "/jobs/in/austria",
  copenhagen: "/jobs/in/denmark",
  kampala: "/jobs/in/uganda",
  amman: "/jobs/in/jordan",
  manila: "/jobs/in/philippines",
  delhi: "/jobs/in/india",
  berlin: "/jobs/in/germany",
  bonn: "/jobs/in/germany",
  paris: "/jobs/in/france",
};
