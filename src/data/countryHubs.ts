// Country & region landing hubs for /jobs/in/:country.
// Slug + display name + blurb + keywords (used in JSON-LD and page text).
// Hubs are only rendered if the DB has ≥1 live job matching `locationQuery`;
// empty ones are omitted from routing and the sitemap.

export interface CountryHub {
  slug: string;
  name: string;          // Display name
  locationQuery: string; // ILIKE match against jobs.location
  blurb: string;
  keywords: string[];
}

export const COUNTRY_HUBS: CountryHub[] = [
  {
    slug: "united-states",
    name: "United States",
    locationQuery: "United States",
    blurb:
      "Jobs in the United States across the international development sector — USAID implementers, the World Bank Group, UN agencies in NYC and DC, and the largest US-based NGOs, think tanks, and foundations.",
    keywords: [
      "international development jobs USA",
      "USAID jobs",
      "World Bank jobs USA",
      "UN jobs in the United States",
      "NGO jobs USA",
    ],
  },
  {
    slug: "usa-global",
    name: "USA / Global (Remote)",
    locationQuery: "Global",
    blurb:
      "Remote and globally-distributed roles in international development — many based out of US organizations and open to US-based applicants alongside candidates worldwide.",
    keywords: [
      "remote international development jobs",
      "global NGO jobs",
      "remote UN jobs",
      "US-based remote development jobs",
    ],
  },
  {
    slug: "nigeria",
    name: "Nigeria",
    locationQuery: "Nigeria",
    blurb:
      "Jobs in Nigeria across humanitarian, public health, governance, and development programmes — UN agencies, USAID implementers, and the largest concentration of INGO field offices in West Africa.",
    keywords: ["NGO jobs Nigeria", "UN jobs Nigeria", "development jobs Lagos Abuja"],
  },
  {
    slug: "united-kingdom",
    name: "United Kingdom",
    locationQuery: "United Kingdom",
    blurb:
      "International development roles in the United Kingdom — FCDO, Save the Children, Oxfam GB, ODI, the Wellcome Trust, and a deep ecosystem of development consultancies headquartered in London.",
    keywords: ["NGO jobs UK", "FCDO jobs", "international development jobs London"],
  },
  {
    slug: "kenya",
    name: "Kenya",
    locationQuery: "Kenya",
    blurb:
      "Jobs in Kenya in the international development sector — UN-Habitat, UNEP, ICRC's regional delegation, and hundreds of NGOs working across East Africa from Nairobi.",
    keywords: ["UN jobs Kenya", "NGO jobs Nairobi", "humanitarian jobs Kenya"],
  },
  {
    slug: "south-africa",
    name: "South Africa",
    locationQuery: "South Africa",
    blurb:
      "Development, public health, and governance roles in South Africa — UN agencies, regional INGOs, and the continent's largest cluster of research institutes and foundations.",
    keywords: ["NGO jobs South Africa", "development jobs Johannesburg", "UN jobs Pretoria"],
  },
  {
    slug: "germany",
    name: "Germany",
    locationQuery: "Germany",
    blurb:
      "Jobs in Germany across international cooperation — GIZ, KfW, the UN campus in Bonn, and a large pool of development consultancies and research institutes.",
    keywords: ["GIZ jobs", "UN jobs Bonn", "international development jobs Germany"],
  },
  {
    slug: "canada",
    name: "Canada",
    locationQuery: "Canada",
    blurb:
      "International development jobs in Canada — Global Affairs Canada, IDRC, Cuso International, and Canada's growing community of development consultancies and INGOs.",
    keywords: ["international development jobs Canada", "Global Affairs Canada jobs", "NGO jobs Canada"],
  },
  {
    slug: "india",
    name: "India",
    locationQuery: "India",
    blurb:
      "Development, public health, and education roles in India — UN agencies, the Gates Foundation, large national NGOs, and a thriving ecosystem of social-impact organizations.",
    keywords: ["NGO jobs India", "UN jobs India", "development jobs Delhi Mumbai"],
  },
  {
    slug: "ghana",
    name: "Ghana",
    locationQuery: "Ghana",
    blurb:
      "International development jobs in Ghana — UN agencies, USAID implementers, and a wide network of NGOs working on health, education, and governance across West Africa.",
    keywords: ["NGO jobs Ghana", "UN jobs Accra", "development jobs Ghana"],
  },
  {
    slug: "australia",
    name: "Australia",
    locationQuery: "Australia",
    blurb:
      "International development roles in Australia — DFAT, ABT Associates, Palladium, and Australia's network of consultancies delivering programmes across the Indo-Pacific.",
    keywords: ["DFAT jobs", "international development jobs Australia", "NGO jobs Sydney"],
  },
  {
    slug: "switzerland",
    name: "Switzerland",
    locationQuery: "Switzerland",
    blurb:
      "Humanitarian and multilateral roles in Switzerland — WHO, UNHCR, OHCHR, ILO, WTO, IFRC, and ICRC all headquartered in Geneva, the densest cluster of UN-system employers in Europe.",
    keywords: ["UN jobs Geneva", "WHO jobs", "humanitarian jobs Switzerland"],
  },
  {
    slug: "belgium",
    name: "Belgium",
    locationQuery: "Belgium",
    blurb:
      "International development jobs in Belgium — the European Commission's DEVCO/INTPA, Enabel, MSF Belgium, and a wide ecosystem of EU-facing NGOs in Brussels.",
    keywords: ["EU jobs Brussels", "Enabel jobs", "NGO jobs Belgium"],
  },
  {
    slug: "netherlands",
    name: "Netherlands",
    locationQuery: "Netherlands",
    blurb:
      "International development jobs in the Netherlands — SNV, Cordaid, Oxfam Novib, and a strong network of Dutch development consultancies.",
    keywords: ["NGO jobs Netherlands", "international development jobs Amsterdam", "SNV jobs"],
  },
  {
    slug: "sweden",
    name: "Sweden",
    locationQuery: "Sweden",
    blurb:
      "International cooperation roles in Sweden — Sida, the Folke Bernadotte Academy, and a strong base of Swedish INGOs and research institutes.",
    keywords: ["Sida jobs", "NGO jobs Sweden", "international development jobs Stockholm"],
  },
  {
    slug: "denmark",
    name: "Denmark",
    locationQuery: "Denmark",
    blurb:
      "Jobs in Denmark across international cooperation — Danida, DanChurchAid, Save the Children Denmark, and Copenhagen's UN City campus.",
    keywords: ["Danida jobs", "UN City Copenhagen jobs", "NGO jobs Denmark"],
  },
  {
    slug: "austria",
    name: "Austria",
    locationQuery: "Austria",
    blurb:
      "International organisation jobs in Austria — UNIDO, IAEA, UNOV, OSCE, and Vienna's wider cluster of multilateral institutions.",
    keywords: ["UN jobs Vienna", "UNIDO jobs", "IAEA jobs"],
  },
  {
    slug: "france",
    name: "France",
    locationQuery: "France",
    blurb:
      "Jobs in France across international development — UNESCO, OECD, AFD, Expertise France, and a wide network of Paris-based NGOs and consultancies.",
    keywords: ["UNESCO jobs", "OECD jobs", "AFD jobs", "NGO jobs France"],
  },
  {
    slug: "ireland",
    name: "Ireland",
    locationQuery: "Ireland",
    blurb:
      "International development jobs in Ireland — Irish Aid, Concern Worldwide, GOAL, Trócaire, and Dublin's growing ecosystem of development organisations.",
    keywords: ["Irish Aid jobs", "Concern Worldwide jobs", "NGO jobs Ireland"],
  },
  {
    slug: "ethiopia",
    name: "Ethiopia",
    locationQuery: "Ethiopia",
    blurb:
      "Jobs in Ethiopia in the development sector — the African Union, the UN Economic Commission for Africa, and a deep humanitarian footprint across the Horn of Africa from Addis Ababa.",
    keywords: ["UN jobs Addis Ababa", "African Union jobs", "NGO jobs Ethiopia"],
  },
  {
    slug: "uganda",
    name: "Uganda",
    locationQuery: "Uganda",
    blurb:
      "International development jobs in Uganda — UN agencies, refugee-response programmes, and a wide network of national and international NGOs operating across East Africa.",
    keywords: ["NGO jobs Uganda", "UN jobs Kampala", "humanitarian jobs Uganda"],
  },
  {
    slug: "senegal",
    name: "Senegal",
    locationQuery: "Senegal",
    blurb:
      "Regional development jobs in Senegal — UNICEF, UNFPA, WFP, and OCHA all run their West and Central Africa regional offices from Dakar.",
    keywords: ["UN jobs Dakar", "NGO jobs Senegal", "West Africa humanitarian jobs"],
  },
  {
    slug: "egypt",
    name: "Egypt",
    locationQuery: "Egypt",
    blurb:
      "Development and humanitarian jobs in Egypt — UN regional offices, USAID Mission, and a wide network of NGOs working across the MENA region from Cairo.",
    keywords: ["UN jobs Cairo", "NGO jobs Egypt", "MENA development jobs"],
  },
  {
    slug: "jordan",
    name: "Jordan",
    locationQuery: "Jordan",
    blurb:
      "Humanitarian and refugee-response jobs in Jordan — UNHCR, UNRWA, and a major hub of INGOs delivering programmes across Syria, Iraq, and Yemen from Amman.",
    keywords: ["UN jobs Amman", "UNHCR jobs Jordan", "humanitarian jobs Jordan"],
  },
  {
    slug: "bangladesh",
    name: "Bangladesh",
    locationQuery: "Bangladesh",
    blurb:
      "Development and humanitarian roles in Bangladesh — BRAC, UN agencies, and a wide humanitarian footprint serving the Rohingya response in Cox's Bazar.",
    keywords: ["BRAC jobs", "UN jobs Bangladesh", "humanitarian jobs Cox's Bazar"],
  },
  {
    slug: "philippines",
    name: "Philippines",
    locationQuery: "Philippines",
    blurb:
      "Jobs in the Philippines across international development — the Asian Development Bank, UN agencies in Manila, and a strong network of national NGOs.",
    keywords: ["ADB jobs", "UN jobs Manila", "NGO jobs Philippines"],
  },
  {
    slug: "singapore",
    name: "Singapore",
    locationQuery: "Singapore",
    blurb:
      "International development and impact jobs in Singapore — regional offices of foundations, multilateral institutions, and impact investors covering Asia-Pacific.",
    keywords: ["NGO jobs Singapore", "impact jobs Singapore", "international development jobs Singapore"],
  },
  {
    slug: "thailand",
    name: "Thailand",
    locationQuery: "Thailand",
    blurb:
      "Regional development jobs in Thailand — ESCAP, UNICEF EAPRO, UNDP RBAP, FAO RAP, and OCHA ROAP all based in Bangkok as the UN's Asia-Pacific hub.",
    keywords: ["UN jobs Bangkok", "Asia Pacific development jobs", "NGO jobs Thailand"],
  },
  {
    slug: "japan",
    name: "Japan",
    locationQuery: "Japan",
    blurb:
      "International development jobs in Japan — JICA, the UN University, ADB Institute, and major Japanese foundations supporting global development.",
    keywords: ["JICA jobs", "UN jobs Japan", "international development jobs Tokyo"],
  },
  {
    slug: "south-korea",
    name: "South Korea",
    locationQuery: "South Korea",
    blurb:
      "Development cooperation jobs in South Korea — KOICA, the Green Climate Fund, and Seoul's growing cluster of multilateral and impact organisations.",
    keywords: ["KOICA jobs", "Green Climate Fund jobs", "development jobs Seoul"],
  },
  {
    slug: "china",
    name: "China",
    locationQuery: "China",
    blurb:
      "International development and impact jobs in China — UN country teams, AIIB, and a wide network of foundations and impact organisations.",
    keywords: ["UN jobs China", "AIIB jobs", "NGO jobs Beijing Shanghai"],
  },
  // Regions emitted by fix-locations
  {
    slug: "sub-saharan-africa",
    name: "Sub-Saharan Africa",
    locationQuery: "Sub-Saharan Africa",
    blurb:
      "Multi-country roles across Sub-Saharan Africa — regional positions with UN agencies, INGOs, and donor-funded programmes covering several African countries.",
    keywords: ["Sub-Saharan Africa jobs", "regional NGO jobs Africa"],
  },
  {
    slug: "east-africa",
    name: "East Africa",
    locationQuery: "East Africa",
    blurb:
      "Regional roles across East Africa — Kenya, Tanzania, Uganda, Rwanda, and Ethiopia — with UN agencies and INGOs running multi-country programmes.",
    keywords: ["East Africa jobs", "regional development jobs East Africa"],
  },
  {
    slug: "west-africa",
    name: "West Africa",
    locationQuery: "West Africa",
    blurb:
      "Multi-country roles across West Africa — based out of regional hubs in Dakar, Accra, and Abidjan, covering Nigeria, Ghana, Senegal, and beyond.",
    keywords: ["West Africa jobs", "regional NGO jobs West Africa"],
  },
  {
    slug: "southern-africa",
    name: "Southern Africa",
    locationQuery: "Southern Africa",
    blurb:
      "Regional development jobs across Southern Africa — South Africa, Botswana, Zambia, and Zimbabwe — with UN agencies and INGOs.",
    keywords: ["Southern Africa jobs", "regional NGO jobs Southern Africa"],
  },
  {
    slug: "mena",
    name: "MENA",
    locationQuery: "MENA",
    blurb:
      "Regional jobs across the Middle East and North Africa — humanitarian response, development programmes, and policy roles covering multiple MENA countries.",
    keywords: ["MENA jobs", "Middle East NGO jobs", "humanitarian jobs MENA"],
  },
  {
    slug: "europe",
    name: "Europe",
    locationQuery: "Europe",
    blurb:
      "Pan-European roles in international cooperation — EU institutions, regional NGO offices, and multi-country development programmes across Europe.",
    keywords: ["Europe NGO jobs", "EU development jobs"],
  },
  {
    slug: "latin-america",
    name: "Latin America",
    locationQuery: "Latin America",
    blurb:
      "Regional jobs across Latin America and the Caribbean — UN agencies, IDB, and INGOs running multi-country programmes from Panama City, Bogotá, and Mexico City.",
    keywords: ["Latin America jobs", "IDB jobs", "NGO jobs Latin America"],
  },
  {
    slug: "asia-pacific",
    name: "Asia-Pacific",
    locationQuery: "Asia-Pacific",
    blurb:
      "Regional roles across Asia and the Pacific — UN agencies, ADB, and INGOs running multi-country programmes from Bangkok, Manila, and Suva.",
    keywords: ["Asia Pacific jobs", "regional NGO jobs Asia"],
  },
];

export function getCountryHubBySlug(slug: string): CountryHub | undefined {
  return COUNTRY_HUBS.find((h) => h.slug === slug.toLowerCase());
}

// Legacy /jobs/in/:city slugs map → new country (or city) destinations.
export const LEGACY_CITY_REDIRECTS: Record<string, string> = {
  nairobi: "/jobs/in/cities/nairobi",
  "new-york": "/jobs/in/cities/new-york",
  geneva: "/jobs/in/cities/geneva",
  "washington-dc": "/jobs/in/cities/washington-dc",
  london: "/jobs/in/cities/london",
  "addis-ababa": "/jobs/in/cities/addis-ababa",
  bangkok: "/jobs/in/cities/bangkok",
  dakar: "/jobs/in/cities/dakar",
};
