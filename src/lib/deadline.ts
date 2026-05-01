import { differenceInCalendarDays, parseISO } from "date-fns";

export interface DeadlineInfo {
  daysLeft: number;
  label: string;
  urgent: boolean; // ≤7 days
  critical: boolean; // ≤1 day
}

export function getDeadlineInfo(applyBeforeDate: string | null): DeadlineInfo | null {
  if (!applyBeforeDate) return null;
  let date: Date;
  try {
    date = parseISO(applyBeforeDate);
    if (isNaN(date.getTime())) return null;
  } catch {
    return null;
  }
  const days = differenceInCalendarDays(date, new Date());
  if (days < 0) return null;
  let label: string;
  if (days === 0) label = "Closes today";
  else if (days === 1) label = "Closes tomorrow";
  else label = `Closes in ${days} days`;
  return {
    daysLeft: days,
    label,
    urgent: days <= 7,
    critical: days <= 1,
  };
}
