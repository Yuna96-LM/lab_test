import { REFERENCE_INTERVALS, WEEK, YEAR, type ReferenceInterval, type Sex, type Specimen } from '../data/referenceIntervals';

export type AgeUnit = 'days' | 'weeks' | 'months' | 'years';

const AGE_UNIT_DAYS: Record<AgeUnit, number> = {
  days: 1,
  weeks: WEEK,
  months: YEAR / 12,
  years: YEAR,
};

export function ageToDays(age: number, unit: AgeUnit): number {
  return age * AGE_UNIT_DAYS[unit];
}

export interface LookupQuery {
  analyteId: string;
  ageDays: number;
  sex: Exclude<Sex, 'any'>;
  specimen: Specimen;
}

/**
 * Returns every published row that covers the query exactly. Nothing is
 * interpolated or extrapolated: if no row covers the age, the result is empty.
 */
export function lookupIntervals(q: LookupQuery): ReferenceInterval[] {
  return REFERENCE_INTERVALS.filter(
    (r) =>
      r.analyteId === q.analyteId &&
      (r.sex === 'any' || r.sex === q.sex) &&
      r.specimens.includes(q.specimen) &&
      q.ageDays >= r.ageMinDays &&
      q.ageDays < r.ageMaxDays,
  );
}

export function hasAnyInterval(analyteId: string): boolean {
  return REFERENCE_INTERVALS.some((r) => r.analyteId === analyteId);
}

/** Published age coverage for an analyte, for explaining an empty lookup. */
export function coverage(analyteId: string, sex: Exclude<Sex, 'any'>, specimen: Specimen): string[] {
  return REFERENCE_INTERVALS.filter(
    (r) => r.analyteId === analyteId && (r.sex === 'any' || r.sex === sex) && r.specimens.includes(specimen),
  ).map((r) => r.ageLabel);
}

export type Flag = 'low' | 'normal' | 'high';

/** Interval limits are inclusive, as published ("135–145"). */
export function classify(value: number, r: Pick<ReferenceInterval, 'low' | 'high'>): Flag {
  if (r.low !== null && value < r.low) return 'low';
  if (r.high !== null && value > r.high) return 'high';
  return 'normal';
}
