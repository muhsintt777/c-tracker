import { addDays, differenceInCalendarDays, format, isValid, parseISO } from "date-fns";
import type { CycleAnalysis, CycleInterval, Period } from "./types";

export const FALLBACK_CYCLE_LENGTH = 28;
export const MAX_INTERVALS = 6;
export const MIN_PLAUSIBLE_CYCLE_LENGTH = 15;
export const MAX_PLAUSIBLE_CYCLE_LENGTH = 45;

export function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = parseISO(value);
  return isValid(parsed) && format(parsed, "yyyy-MM-dd") === value;
}

export function compareCalendarDates(left: string, right: string): number {
  return differenceInCalendarDays(parseISO(left), parseISO(right));
}

export function addCalendarDays(value: string, days: number): string {
  return format(addDays(parseISO(value), days), "yyyy-MM-dd");
}

export function periodDuration(startDate: string, endDate: string): number {
  if (!isCalendarDate(startDate) || !isCalendarDate(endDate) || endDate < startDate) {
    throw new RangeError("A valid end date on or after the start date is required.");
  }
  return compareCalendarDates(endDate, startDate) + 1;
}

export function validatePeriod(period: Period): string | null {
  if (!period.id.trim()) return "Period ID is required.";
  if (!isCalendarDate(period.startDate)) return "Start date must be a valid calendar date.";
  if (period.endDate !== null) {
    if (!isCalendarDate(period.endDate)) return "End date must be a valid calendar date.";
    if (period.endDate < period.startDate) return "End date cannot be before the start date.";
  }
  return null;
}

export function getCycleIntervals(periods: Period[]): {
  intervals: CycleInterval[];
  issues: string[];
  validPeriods: Period[];
} {
  const issues: string[] = [];
  const uniqueDates = new Set<string>();
  const validPeriods: Period[] = [];

  for (const period of periods) {
    const error = validatePeriod(period);
    if (error) {
      issues.push(`${period.id}: ${error}`);
      continue;
    }
    if (uniqueDates.has(period.startDate)) {
      issues.push(`Duplicate period start date: ${period.startDate}.`);
      continue;
    }
    uniqueDates.add(period.startDate);
    validPeriods.push(period);
  }

  validPeriods.sort((a, b) => a.startDate.localeCompare(b.startDate));

  const nonOverlapping: Period[] = [];
  for (const period of validPeriods) {
    const previous = nonOverlapping.at(-1);
    if (previous && (previous.endDate === null || previous.endDate >= period.startDate)) {
      issues.push(`Overlapping periods starting ${previous.startDate} and ${period.startDate}.`);
      nonOverlapping.pop();
      continue;
    }
    nonOverlapping.push(period);
  }

  const intervals: CycleInterval[] = [];
  for (let index = 1; index < nonOverlapping.length; index += 1) {
    const previous = nonOverlapping[index - 1];
    const current = nonOverlapping[index];
    const days = compareCalendarDates(current.startDate, previous.startDate);
    if (days < MIN_PLAUSIBLE_CYCLE_LENGTH || days > MAX_PLAUSIBLE_CYCLE_LENGTH) {
      issues.push(`Cycle interval of ${days} days (${previous.startDate} to ${current.startDate}) needs review.`);
      continue;
    }
    intervals.push({ from: previous.startDate, to: current.startDate, days });
  }

  return { intervals, issues, validPeriods: nonOverlapping };
}

export function analyzeCycle(periods: Period[], today: string): CycleAnalysis {
  if (!isCalendarDate(today)) throw new RangeError("Today must be a valid calendar date.");

  const { intervals, issues, validPeriods } = getCycleIntervals(periods);
  if (validPeriods.length === 0) {
    return { prediction: null, validPeriods, issues };
  }

  const latestStart = validPeriods.at(-1)!.startDate;
  const selectedIntervals = intervals.slice(-MAX_INTERVALS);
  const isPreliminary = selectedIntervals.length === 0;
  const cycleLength = isPreliminary
    ? FALLBACK_CYCLE_LENGTH
    : Math.round(selectedIntervals.reduce((sum, interval) => sum + interval.days, 0) / selectedIntervals.length);
  const estimatedDate = addCalendarDays(latestStart, cycleLength);
  const daysUntil = compareCalendarDates(estimatedDate, today);

  return {
    prediction: {
      estimatedDate,
      cycleLength,
      daysUntil,
      isPreliminary,
      intervalsUsed: selectedIntervals.length,
      status: daysUntil > 0 ? "upcoming" : daysUntil === 0 ? "due" : "overdue"
    },
    validPeriods,
    issues
  };
}
