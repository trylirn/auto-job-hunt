/**
 * Salary benchmark maths for the Tools page.
 *
 * Listing salary strings look like:
 *   "$130K – $140K • Offers Equity"
 *   "CA$95,000 – CA$143,750 • Multiple Ranges"
 *   "$213.6K – $300K • Offers Equity • Offers Bonus"
 *   "£45K – £50K"
 * Only USD rows feed the published benchmarks so figures stay comparable.
 */

export interface SalaryRow {
  title: string;
  salary: string | null;
}

export const JOB_FAMILIES = [
  "Engineering",
  "Product",
  "Design",
  "Data & Analytics",
  "Marketing",
  "Sales",
  "Customer Support",
  "Operations",
  "Finance & Legal",
  "People & Recruiting",
] as const;
export type JobFamily = (typeof JOB_FAMILIES)[number];

export const LEVELS = [
  "Entry / Junior",
  "Mid",
  "Senior",
  "Lead / Staff",
  "Director+",
] as const;
export type Level = (typeof LEVELS)[number];

const FAMILY_KEYWORDS: [JobFamily, RegExp][] = [
  ["Data & Analytics", /\b(data scientist|data engineer|analytics|analyst|machine learning|ml |ai engineer|bi )\b/i],
  ["Engineering", /\b(engineer|developer|devops|sre|architect|programmer|qa|security|infrastructure|technical lead)\b/i],
  ["Product", /\b(product manager|product owner|product lead|technical program|program manager|product )\b/i],
  ["Design", /\b(designer|design|ux|ui|creative director|brand studio)\b/i],
  ["Marketing", /\b(marketing|growth|content|seo|communications|social media|brand)\b/i],
  ["Sales", /\b(sales|account executive|business development|partnerships|revenue|account manager)\b/i],
  ["Customer Support", /\b(support|customer success|customer experience|technical support|service desk)\b/i],
  ["Finance & Legal", /\b(finance|accounting|accountant|controller|legal|counsel|tax|payroll|audit)\b/i],
  ["People & Recruiting", /\b(recruit|talent|people |human resources|hr )\b/i],
  ["Operations", /\b(operations|operational|ops|logistics|supply|project manager|administrator|coordinator)\b/i],
];

export function classifyFamily(title: string): JobFamily | null {
  for (const [family, re] of FAMILY_KEYWORDS) {
    if (re.test(title)) return family;
  }
  return null;
}

export function classifyLevel(title: string): Level {
  const t = title.toLowerCase();
  if (/\b(chief|vp|vice president|head of|director|president)\b/.test(t)) return "Director+";
  if (/\b(staff|principal|lead|architect)\b/.test(t)) return "Lead / Staff";
  if (/\b(senior|sr\.?|snr|manager|mgr)\b/.test(t)) return "Senior";
  if (/\b(intern|junior|jr\.?|entry|associate|apprentice|graduate|assistant|i{1,2}\b)\b/.test(t))
    return "Entry / Junior";
  return "Mid";
}

/** Parse a USD salary string into its numeric annual values. Returns [] for non-USD. */
export function parseUsdAmounts(salary: string): number[] {
  // Reject non-USD currency markers (CA$, A$, £, €, ₹, etc.)
  if (/(CA\$|AU?\$|NZ\$|S\$|R\$|HK\$|£|€|₹|¥|₦|zł|CHF|SEK|NOK|DKK)/i.test(salary)) return [];
  if (!/\$/.test(salary)) return [];

  const head = salary.split("•")[0];
  const out: number[] = [];
  const re = /\$\s*([\d,]+(?:\.\d+)?)\s*([kKmM])?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(head))) {
    let value = parseFloat(m[1].replace(/,/g, ""));
    if (!Number.isFinite(value)) continue;
    const suffix = (m[2] || "").toLowerCase();
    if (suffix === "k") value *= 1_000;
    else if (suffix === "m") value *= 1_000_000;
    // Ignore hourly-looking or clearly non-annual numbers.
    if (value < 10_000 || value > 2_000_000) continue;
    out.push(value);
  }
  return out;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return 0;
  const idx = (sorted.length - 1) * p;
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  if (lo === hi) return sorted[lo];
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

export interface Benchmark {
  family: JobFamily;
  level: Level;
  count: number;
  low: number;
  median: number;
  high: number;
}

export interface BenchmarkResult {
  benchmarks: Benchmark[];
  /** Listings that contributed at least one usable USD figure. */
  sampleSize: number;
}

export function computeBenchmarks(rows: SalaryRow[]): BenchmarkResult {
  const buckets = new Map<string, number[]>();
  let sampleSize = 0;

  for (const row of rows) {
    if (!row.salary || !row.title) continue;
    const amounts = parseUsdAmounts(row.salary);
    if (amounts.length === 0) continue;
    const family = classifyFamily(row.title);
    if (!family) continue;
    const level = classifyLevel(row.title);
    // Use the midpoint of the published range as the listing's data point.
    const mid = (Math.min(...amounts) + Math.max(...amounts)) / 2;
    const key = `${family}|${level}`;
    const arr = buckets.get(key) ?? [];
    arr.push(mid);
    buckets.set(key, arr);
    sampleSize += 1;
  }

  const benchmarks: Benchmark[] = [];
  for (const [key, values] of buckets) {
    const [family, level] = key.split("|") as [JobFamily, Level];
    const sorted = [...values].sort((a, b) => a - b);
    benchmarks.push({
      family,
      level,
      count: sorted.length,
      low: percentile(sorted, 0.25),
      median: percentile(sorted, 0.5),
      high: percentile(sorted, 0.75),
    });
  }

  return { benchmarks, sampleSize };
}

export function findBenchmark(
  benchmarks: Benchmark[],
  family: JobFamily,
  level: Level
): Benchmark | undefined {
  return benchmarks.find((b) => b.family === family && b.level === level);
}

export function formatUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "—";
  return `$${Math.round(value / 1000).toLocaleString("en-US")}K`;
}
