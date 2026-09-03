// Country detection for the location filter.
//
// Job locations arrive as free text ("Atlanta, GA", "Amsterdam, Netherlands",
// "AMER - US"). The filter dropdown must show countries only, so we match each
// stored location against a country list (name + common aliases) and offer the
// country as the filter value. Filtering itself is an ILIKE on jobs.location,
// so the value we emit is the alias most likely to appear in the data.

export interface CountryMatch {
  /** Canonical display name, e.g. "United States". */
  name: string;
  /** Value sent to the jobs query (ILIKE match against jobs.location). */
  query: string;
}

interface CountryDef {
  name: string;
  /** Lower-case tokens that indicate this country in a location string. */
  aliases: string[];
  /** Optional override for the ILIKE value (defaults to name). */
  query?: string;
}

const COUNTRIES: CountryDef[] = [
  { name: "United States", aliases: ["united states", "usa", "u.s.a", "u.s.", "america/", "amer - us", ", us", "(us)", "us-remote", "us remote"], query: "United States" },
  { name: "United Kingdom", aliases: ["united kingdom", "uk", "england", "scotland", "wales", "northern ireland", "london"], query: "United Kingdom" },
  { name: "Canada", aliases: ["canada", "toronto", "vancouver", "ottawa", "montreal"] },
  { name: "Australia", aliases: ["australia", "sydney", "melbourne"] },
  { name: "New Zealand", aliases: ["new zealand"] },
  { name: "Ireland", aliases: ["ireland", "dublin"] },
  { name: "Germany", aliases: ["germany", "berlin", "munich", "deutschland"] },
  { name: "France", aliases: ["france", "paris"] },
  { name: "Spain", aliases: ["spain", "madrid", "barcelona"] },
  { name: "Portugal", aliases: ["portugal", "lisbon"] },
  { name: "Italy", aliases: ["italy", "milan", "rome"] },
  { name: "Netherlands", aliases: ["netherlands", "amsterdam", "holland"] },
  { name: "Belgium", aliases: ["belgium", "brussels"] },
  { name: "Switzerland", aliases: ["switzerland", "zurich", "geneva"] },
  { name: "Austria", aliases: ["austria", "vienna"] },
  { name: "Sweden", aliases: ["sweden", "stockholm"] },
  { name: "Norway", aliases: ["norway", "oslo"] },
  { name: "Denmark", aliases: ["denmark", "copenhagen"] },
  { name: "Finland", aliases: ["finland", "helsinki"] },
  { name: "Poland", aliases: ["poland", "warsaw", "krakow"] },
  { name: "Czechia", aliases: ["czech", "prague"] },
  { name: "Romania", aliases: ["romania", "bucharest"] },
  { name: "Bulgaria", aliases: ["bulgaria", "sofia"] },
  { name: "Hungary", aliases: ["hungary", "budapest"] },
  { name: "Greece", aliases: ["greece", "athens"] },
  { name: "Ukraine", aliases: ["ukraine", "kyiv", "kiev"] },
  { name: "Serbia", aliases: ["serbia", "belgrade"] },
  { name: "Croatia", aliases: ["croatia", "zagreb"] },
  { name: "Estonia", aliases: ["estonia", "tallinn"] },
  { name: "Lithuania", aliases: ["lithuania", "vilnius"] },
  { name: "Latvia", aliases: ["latvia", "riga"] },
  { name: "Turkey", aliases: ["turkey", "türkiye", "istanbul"] },
  { name: "Israel", aliases: ["israel", "tel aviv"] },
  { name: "United Arab Emirates", aliases: ["united arab emirates", "uae", "dubai", "abu dhabi"] },
  { name: "Saudi Arabia", aliases: ["saudi"] },
  { name: "Egypt", aliases: ["egypt", "cairo"] },
  { name: "Morocco", aliases: ["morocco", "casablanca"] },
  { name: "Nigeria", aliases: ["nigeria", "lagos", "abuja"] },
  { name: "Ghana", aliases: ["ghana", "accra"] },
  { name: "Kenya", aliases: ["kenya", "nairobi"] },
  { name: "Uganda", aliases: ["uganda", "kampala"] },
  { name: "Tanzania", aliases: ["tanzania"] },
  { name: "Rwanda", aliases: ["rwanda", "kigali"] },
  { name: "Ethiopia", aliases: ["ethiopia", "addis"] },
  { name: "South Africa", aliases: ["south africa", "cape town", "johannesburg"] },
  { name: "India", aliases: ["india", "bangalore", "bengaluru", "mumbai", "delhi", "hyderabad", "pune", "chennai"] },
  { name: "Pakistan", aliases: ["pakistan", "karachi", "lahore"] },
  { name: "Bangladesh", aliases: ["bangladesh", "dhaka"] },
  { name: "Sri Lanka", aliases: ["sri lanka", "colombo"] },
  { name: "Nepal", aliases: ["nepal", "kathmandu"] },
  { name: "Philippines", aliases: ["philippines", "manila"] },
  { name: "Indonesia", aliases: ["indonesia", "jakarta"] },
  { name: "Malaysia", aliases: ["malaysia", "kuala lumpur"] },
  { name: "Singapore", aliases: ["singapore"] },
  { name: "Thailand", aliases: ["thailand", "bangkok"] },
  { name: "Vietnam", aliases: ["vietnam", "viet nam", "hanoi", "ho chi minh"] },
  { name: "Japan", aliases: ["japan", "tokyo"] },
  { name: "South Korea", aliases: ["south korea", "korea", "seoul"] },
  { name: "China", aliases: ["china", "shanghai", "beijing"] },
  { name: "Hong Kong", aliases: ["hong kong"] },
  { name: "Taiwan", aliases: ["taiwan", "taipei"] },
  { name: "Brazil", aliases: ["brazil", "brasil", "sao paulo", "são paulo"] },
  { name: "Argentina", aliases: ["argentina", "buenos aires"] },
  { name: "Chile", aliases: ["chile", "santiago"] },
  { name: "Colombia", aliases: ["colombia", "bogota", "bogotá"] },
  { name: "Peru", aliases: ["peru", "lima"] },
  { name: "Mexico", aliases: ["mexico", "méxico", "guadalajara"] },
  { name: "Costa Rica", aliases: ["costa rica"] },
  { name: "Uruguay", aliases: ["uruguay", "montevideo"] },
];

/** Regions and worldwide buckets shown after the country list. */
const REGIONS: CountryDef[] = [
  { name: "Worldwide (Remote)", aliases: ["global", "worldwide", "anywhere"], query: "Global" },
  { name: "Europe", aliases: ["europe", "emea"], query: "Europe" },
  { name: "Latin America", aliases: ["latin america", "latam"], query: "Latam" },
  { name: "Asia Pacific", aliases: ["apac", "apj", "asia pacific"], query: "APAC" },
  { name: "Africa", aliases: ["africa"], query: "Africa" },
  { name: "Americas", aliases: ["americas", "amer"], query: "Americas" },
];

function matches(def: CountryDef, lower: string): boolean {
  return def.aliases.some((a) => lower.includes(a));
}

/**
 * Reduce a list of raw job locations to the countries/regions actually present.
 * Countries first (alphabetical), regions last.
 */
export function countriesFromLocations(locations: string[]): CountryMatch[] {
  const lowers = locations
    .map((l) => (l || "").toLowerCase())
    .filter(Boolean);

  const pick = (defs: CountryDef[]) =>
    defs
      .filter((def) => lowers.some((l) => matches(def, l)))
      .map((def) => ({ name: def.name, query: def.query ?? def.name }));

  const found = pick(COUNTRIES).sort((a, b) => a.name.localeCompare(b.name));
  return [...found, ...pick(REGIONS)];
}
