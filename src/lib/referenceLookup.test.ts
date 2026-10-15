import { describe, expect, it } from 'vitest';
import { ageToDays, classify, lookupIntervals } from './referenceLookup';
import { REFERENCE_INTERVALS } from '../data/referenceIntervals';

const q = (analyteId: string, age: number, unit: 'days' | 'weeks' | 'years', sex: 'M' | 'F' = 'M', specimen: 'serum' | 'plasma' = 'serum') =>
  lookupIntervals({ analyteId, ageDays: ageToDays(age, unit), sex, specimen });

describe('reference interval lookup', () => {
  it('adult sodium 135–145', () => {
    const r = q('sodium', 40, 'years');
    expect(r).toHaveLength(1);
    expect([r[0].low, r[0].high]).toEqual([135, 145]);
  });
  it('band edges are [min, max)', () => {
    expect(q('sodium', 6, 'days')[0].ageLabel).toBe('0d to <1w');
    expect(q('sodium', 7, 'days')[0].ageLabel).toBe('1w to <18y');
  });
  it('paediatric potassium differs by specimen', () => {
    expect(q('potassium', 5, 'years', 'M', 'serum')[0].high).toBe(5.3);
    expect(q('potassium', 5, 'years', 'M', 'plasma')[0].high).toBe(4.9);
  });
  it('creatinine is sex-specific and not extrapolated past 60 y', () => {
    expect(q('creatinine', 30, 'years', 'F')[0].high).toBe(90);
    expect(q('creatinine', 30, 'years', 'M')[0].high).toBe(110);
    expect(q('creatinine', 70, 'years', 'M')).toHaveLength(0);
  });
  it('no published adult phosphate before 20 y — the paediatric 18–<20 band applies', () => {
    expect(q('phosphate', 19, 'years')[0].ageLabel).toBe('18y to <20y');
  });
  it('lipase is serum only', () => {
    expect(q('lipase', 30, 'years', 'M', 'plasma')).toHaveLength(0);
  });
  it('no paediatric interval for adult-only analytes (no extrapolation)', () => {
    expect(q('alt', 10, 'years')).toHaveLength(0);
  });
  it('every row has low ≤ high and a valid age band', () => {
    for (const r of REFERENCE_INTERVALS) {
      if (r.low !== null && r.high !== null) expect(r.low).toBeLessThanOrEqual(r.high);
      expect(r.ageMinDays).toBeLessThan(r.ageMaxDays);
    }
  });
});

describe('classify', () => {
  const r = { low: 135, high: 145 };
  it.each([
    [134.9, 'low'],
    [135, 'normal'],
    [145, 'normal'],
    [145.1, 'high'],
  ])('%f → %s', (v, flag) => expect(classify(v, r)).toBe(flag));
});
