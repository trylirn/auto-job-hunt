import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { Seo } from "@/components/Seo";
import { buildMeta } from "@/lib/seo";
import AdsterraNativeAd from "@/components/AdsterraNativeAd";
import { useSalaryData } from "@/hooks/useSalaryData";
import {
  JOB_FAMILIES,
  LEVELS,
  computeBenchmarks,
  findBenchmark,
  formatUsd,
  type JobFamily,
  type Level,
} from "@/lib/salaryBenchmarks";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const meta = buildMeta({
  title: "Remote Salary Insights Calculator",
  description:
    "See real pay benchmarks for remote roles by job family and experience level, built from published salary ranges on live job listings.",
  path: "/tools",
});

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Tools() {
  const { data, isLoading } = useSalaryData();
  const [family, setFamily] = useState<JobFamily>("Engineering");
  const [level, setLevel] = useState<Level>("Senior");

  const { benchmarks, sampleSize } = useMemo(
    () => computeBenchmarks(data?.rows ?? []),
    [data?.rows]
  );

  const selected = findBenchmark(benchmarks, family, level);
  const thin = !selected || selected.count < 3;

  return (
    <Layout>
      <Seo {...meta} />

      <div className="container max-w-4xl py-10 md:py-14">
        <header className="mb-8">
          <p className="mb-2 text-xs uppercase tracking-widest text-muted-foreground">
            Tools
          </p>
          <h1 className="font-display text-3xl leading-tight tracking-tight md:text-4xl">
            Remote Salary Insights Calculator
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Every figure below comes from pay ranges published on live remote
            listings on Eplicant — no surveys, no estimates. Pick a job family
            and experience level to see what companies are actually offering.
          </p>
        </header>

        <section
          aria-labelledby="calculator"
          className="rounded-sm border border-rule bg-card p-5 md:p-6"
        >
          <h2 id="calculator" className="sr-only">
            Salary calculator
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Job family
              </label>
              <Select value={family} onValueChange={(v) => setFamily(v as JobFamily)}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JOB_FAMILIES.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1.5 block text-sm text-muted-foreground">
                Experience level
              </label>
              <Select value={level} onValueChange={(v) => setLevel(v as Level)}>
                <SelectTrigger className="rounded-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LEVELS.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mt-6 border-t border-rule pt-6">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading benchmarks…</p>
            ) : thin ? (
              <p className="text-sm text-muted-foreground">
                Not enough listings publish pay for {family} · {level} yet. Try
                another combination — we update these figures as new listings
                arrive.
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Lower range", value: selected!.low },
                  { label: "Median", value: selected!.median },
                  { label: "Upper range", value: selected!.high },
                ].map((cell) => (
                  <div key={cell.label}>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {cell.label}
                    </p>
                    <p className="mt-1 font-display text-2xl md:text-3xl">
                      {formatUsd(cell.value)}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {!isLoading && !thin && (
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Based on {selected!.count} listing
                {selected!.count === 1 ? "" : "s"} with published pay · USD, annual
              </p>
            )}
          </div>
        </section>

        <div className="my-8">
          <AdsterraNativeAd />
        </div>

        <section aria-labelledby="table" className="mt-2">
          <h2 id="table" className="font-display text-xl tracking-tight">
            All benchmarks
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Median annual pay in USD, with the number of listings behind each
            figure. Blank cells don't have enough data yet.
          </p>

          <div className="mt-4 overflow-x-auto rounded-sm border border-rule">
            <table className="w-full min-w-[640px] text-sm">
              <caption className="sr-only">
                Median remote salary by job family and experience level
              </caption>
              <thead>
                <tr className="border-b border-rule bg-card text-left">
                  <th scope="col" className="p-3 font-medium">
                    Job family
                  </th>
                  {LEVELS.map((l) => (
                    <th key={l} scope="col" className="p-3 font-medium">
                      {l}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {JOB_FAMILIES.map((f) => (
                  <tr key={f} className="border-b border-rule last:border-0">
                    <th scope="row" className="p-3 text-left font-medium">
                      {f}
                    </th>
                    {LEVELS.map((l) => {
                      const b = findBenchmark(benchmarks, f, l);
                      const enough = b && b.count >= 3;
                      return (
                        <td key={l} className="p-3 text-muted-foreground">
                          {enough ? (
                            <>
                              <span className="text-foreground">
                                {formatUsd(b!.median)}
                              </span>
                              <span className="ml-1 text-xs">({b!.count})</span>
                            </>
                          ) : (
                            "—"
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            Drawn from {sampleSize} live listings that publish a US-dollar pay
            range, added between {formatDate(data?.oldest ?? null)} and{" "}
            {formatDate(data?.newest ?? null)}. Listings priced in other
            currencies are excluded so the numbers stay comparable.
          </p>
        </section>

        <div className="mt-8">
          <AdsterraNativeAd />
        </div>
      </div>
    </Layout>
  );
}
