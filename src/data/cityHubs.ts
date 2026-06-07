// Candidate city landing hubs. A city only renders + appears in the sitemap
// if the live DB query returns ≥1 job for it. Empty cities are silently
// dropped.

export interface CityHub {
  slug: string;
  city: string;
  country: string;
  locationQuery: string;
  blurb: string;
  keywords: string[];
}

export const CITY_HUBS: CityHub[] = [
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
  {
    slug: "lagos",
    city: "Lagos",
    country: "Nigeria",
    locationQuery: "Lagos",
    blurb:
      "Lagos hosts the largest concentration of national NGOs, foundations, and impact organisations in Nigeria, alongside the regional offices of major international employers.",
    keywords: ["NGO jobs Lagos", "development jobs Lagos", "Nigeria NGO jobs"],
  },
  {
    slug: "abuja",
    city: "Abuja",
    country: "Nigeria",
    locationQuery: "Abuja",
    blurb:
      "Abuja is Nigeria's federal capital and the country's primary base for UN agencies, USAID implementers, and the largest cluster of donor-funded programmes.",
    keywords: ["UN jobs Abuja", "USAID jobs Abuja", "NGO jobs Abuja"],
  },
  {
    slug: "brussels",
    city: "Brussels",
    country: "Belgium",
    locationQuery: "Brussels",
    blurb:
      "Brussels is the seat of the European Commission's DEVCO/INTPA and home to the EU-facing offices of most major international NGOs.",
    keywords: ["EU jobs Brussels", "INTPA jobs", "NGO jobs Brussels"],
  },
  {
    slug: "rome",
    city: "Rome",
    country: "Italy",
    locationQuery: "Rome",
    blurb:
      "Rome hosts the UN's food-systems agencies — FAO, IFAD, and WFP — alongside a wide cluster of Italian INGOs and research institutes.",
    keywords: ["FAO jobs Rome", "WFP jobs Rome", "UN jobs Rome"],
  },
  {
    slug: "vienna",
    city: "Vienna",
    country: "Austria",
    locationQuery: "Vienna",
    blurb:
      "Vienna is home to UNIDO, IAEA, UNOV, OSCE, and a wider cluster of Vienna-based multilateral institutions.",
    keywords: ["UN jobs Vienna", "UNIDO jobs", "OSCE jobs"],
  },
  {
    slug: "copenhagen",
    city: "Copenhagen",
    country: "Denmark",
    locationQuery: "Copenhagen",
    blurb:
      "Copenhagen hosts the UN City campus — UNICEF supply division, UNDP Nordic, UNFPA Nordic, and WHO Europe regional operations.",
    keywords: ["UN City Copenhagen jobs", "UNICEF jobs Copenhagen", "WHO Europe jobs"],
  },
  {
    slug: "kampala",
    city: "Kampala",
    country: "Uganda",
    locationQuery: "Kampala",
    blurb:
      "Kampala is a regional hub for UN agencies and INGOs running refugee-response and East Africa programmes.",
    keywords: ["UN jobs Kampala", "NGO jobs Uganda", "humanitarian jobs Kampala"],
  },
  {
    slug: "amman",
    city: "Amman",
    country: "Jordan",
    locationQuery: "Amman",
    blurb:
      "Amman is the regional base for UNHCR, UNRWA, and most INGOs delivering humanitarian programmes across Syria, Iraq, and Yemen.",
    keywords: ["UN jobs Amman", "NGO jobs Jordan", "humanitarian jobs Amman"],
  },
  {
    slug: "manila",
    city: "Manila",
    country: "Philippines",
    locationQuery: "Manila",
    blurb:
      "Manila is the headquarters of the Asian Development Bank and a regional base for UN agencies covering East Asia and the Pacific.",
    keywords: ["ADB jobs Manila", "UN jobs Manila", "NGO jobs Philippines"],
  },
  {
    slug: "delhi",
    city: "New Delhi",
    country: "India",
    locationQuery: "Delhi",
    blurb:
      "New Delhi hosts UN agency country teams, major foundations, and India's largest cluster of national NGOs working on health, education, and governance.",
    keywords: ["UN jobs Delhi", "NGO jobs Delhi", "international development jobs India"],
  },
  {
    slug: "berlin",
    city: "Berlin",
    country: "Germany",
    locationQuery: "Berlin",
    blurb:
      "Berlin hosts major international NGOs, foundations, and think tanks, alongside German cooperation agencies.",
    keywords: ["NGO jobs Berlin", "international development jobs Berlin"],
  },
  {
    slug: "bonn",
    city: "Bonn",
    country: "Germany",
    locationQuery: "Bonn",
    blurb:
      "Bonn hosts Germany's UN Campus — the secretariats of UNFCCC, UNV, UNCCD, and other UN agencies — alongside GIZ headquarters.",
    keywords: ["UN jobs Bonn", "GIZ jobs Bonn", "UNFCCC jobs"],
  },
  {
    slug: "paris",
    city: "Paris",
    country: "France",
    locationQuery: "Paris",
    blurb:
      "Paris hosts UNESCO, OECD, and a wide network of Paris-based NGOs, AFD, and Expertise France.",
    keywords: ["UNESCO jobs", "OECD jobs", "AFD jobs Paris"],
  },
];

export function getCityHubBySlug(slug: string): CityHub | undefined {
  return CITY_HUBS.find((h) => h.slug === slug.toLowerCase());
}
