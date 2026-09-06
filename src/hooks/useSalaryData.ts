import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { SalaryRow } from "@/lib/salaryBenchmarks";

export interface SalaryData {
  rows: SalaryRow[];
  oldest: string | null;
  newest: string | null;
}

async function fetchSalaryRows(): Promise<SalaryData> {
  const { data, error } = await supabase
    .from("jobs")
    .select("title,salary,created_at")
    .is("archived_at", null)
    .not("salary", "is", null)
    .or("source.is.null,source.neq.himalayas")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) throw error;

  const rows = (data ?? []) as { title: string; salary: string | null; created_at: string }[];
  const dates = rows.map((r) => r.created_at).filter(Boolean).sort();
  return {
    rows: rows.map(({ title, salary }) => ({ title, salary })),
    newest: dates.length ? dates[dates.length - 1] : null,
    oldest: dates.length ? dates[0] : null,
  };
}

export function useSalaryData() {
  return useQuery<SalaryData>({
    queryKey: ["salary-benchmarks"],
    queryFn: fetchSalaryRows,
    staleTime: 1000 * 60 * 30,
  });
}
