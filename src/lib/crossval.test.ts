// 교차 검증 전용: 아래 표의 값은 앱에 들어가지 않는다. 앱의 계수는 UCUM + IUPAC 원자량
// 으로 계산되며, 여기서는 그 계산 결과를 공표된 변환표와 대조만 한다.
import { describe, expect, it } from 'vitest';
import { convert } from './convert';

function factor(analyte: string, from: string, to: string): number {
  const r = convert(analyte, 1, from, to);
  if (!r.ok) throw new Error(`${analyte}: ${r.reason}`);
  return r.factor!;
}

function value(analyte: string, v: number, from: string, to: string): number {
  const r = convert(analyte, v, from, to);
  if (!r.ok) throw new Error(`${analyte}: ${r.reason}`);
  return r.value;
}

/** Published factors are rounded to 3–4 significant figures. */
const within = (actual: number, published: number, relTol = 0.005) =>
  expect(Math.abs(actual - published) / published).toBeLessThanOrEqual(relTol);

// Labcorp "SI Unit Conversion Table" (https://www.labcorp.com/resource/si-unit-conversion-table),
// fetched 2026-10-15. Columns: conventional unit, factor, SI unit.
describe('Labcorp SI Unit Conversion Table', () => {
  it.each([
    ['glucose', 'mg/dL', 'mmol/L', 0.0555],
    ['cholesterol', 'mg/dL', 'mmol/L', 0.0259],
    ['triglycerides', 'mg/dL', 'mmol/L', 0.0113],
    ['creatinine', 'mg/dL', 'umol/L', 88.4],
    ['urea', 'mg/dL-BUN', 'mmol/L', 0.357],
    ['uric-acid', 'mg/dL', 'mmol/L', 0.059],
    ['bilirubin', 'mg/dL', 'umol/L', 17.1],
    ['calcium', 'mg/dL', 'mmol/L', 0.25],
    ['magnesium', 'mg/dL', 'mmol/L', 0.4114],
    ['phosphate', 'mg/dL', 'mmol/L', 0.323],
    ['iron', 'ug/dL', 'umol/L', 0.179],
    ['sodium', 'meq/L', 'mmol/L', 1],
    ['potassium', 'meq/L', 'mmol/L', 1],
  ])('%s %s → %s ≈ %f', (analyte, from, to, published) => {
    // uric acid is printed with 2 significant figures (0.059), so allow 1 %.
    within(factor(analyte, from, to), published, analyte === 'uric-acid' ? 0.01 : 0.005);
  });

  it.each([
    ['glucose', 'mmol/L', 'mg/dL', 18.02],
    ['cholesterol', 'mmol/L', 'mg/dL', 38.61],
    ['triglycerides', 'mmol/L', 'mg/dL', 88.5],
    ['urea', 'mmol/L', 'mg/dL-BUN', 2.8],
    ['magnesium', 'mmol/L', 'mg/dL', 2.43],
    ['phosphate', 'mmol/L', 'mg/dL', 3.1],
    ['iron', 'umol/L', 'ug/dL', 5.587],
  ])('reverse %s %s → %s ≈ %f', (analyte, from, to, published) => {
    within(factor(analyte, from, to), published);
  });
});

// NBME "Laboratory Reference Values" (nbme.org/sites/default/files/2024-12/Laboratory_Reference_Values.pdf).
// Both columns are published; check that our conversion of the conventional limits
// reproduces the SI limits to the precision NBME prints.
describe('NBME Laboratory Reference Values (conventional ↔ SI columns)', () => {
  it.each([
    ['creatinine', 0.6, 'mg/dL', 'umol/L', 53, 1],
    ['creatinine', 1.2, 'mg/dL', 'umol/L', 106, 1],
    ['glucose', 100, 'mg/dL', 'mmol/L', 5.6, 0.1],
    ['glucose', 140, 'mg/dL', 'mmol/L', 7.77, 0.01],
    ['urea', 7, 'mg/dL-BUN', 'mmol/L', 2.5, 0.05],
    ['urea', 18, 'mg/dL-BUN', 'mmol/L', 6.4, 0.05],
    ['calcium', 8.4, 'mg/dL', 'mmol/L', 2.1, 0.05],
    ['calcium', 10.2, 'mg/dL', 'mmol/L', 2.6, 0.06],
    ['phosphate', 3.0, 'mg/dL', 'mmol/L', 1.0, 0.05],
    ['phosphate', 4.5, 'mg/dL', 'mmol/L', 1.5, 0.05],
    ['bilirubin', 1.0, 'mg/dL', 'umol/L', 17, 0.5],
    ['uric-acid', 3.0, 'mg/dL', 'mmol/L', 0.18, 0.005],
    ['uric-acid', 8.2, 'mg/dL', 'mmol/L', 0.48, 0.01],
    ['cholesterol', 200, 'mg/dL', 'mmol/L', 5.2, 0.05],
    ['cholesterol', 240, 'mg/dL', 'mmol/L', 6.2, 0.05],
    ['triglycerides', 150, 'mg/dL', 'mmol/L', 1.7, 0.01],
    ['iron', 65, 'ug/dL', 'umol/L', 11.6, 0.05],
    ['iron', 175, 'ug/dL', 'umol/L', 31.3, 0.05],
    ['albumin', 3.5, 'g/dL', 'g/L', 35, 1e-9],
    ['hemoglobin', 13.5, 'g/dL', 'g/L', 135, 1e-9],
  ])('%s %f %s → %f %s', (analyte, v, from, to, published, tol) => {
    expect(Math.abs(value(analyte, v, from, to) - published)).toBeLessThanOrEqual(tol);
  });

  it('glucose 70 mg/dL: NBME prints 3.8 mmol/L (truncated); computed 3.885', () => {
    // Documented discrepancy: 70 × 0.0555 = 3.885, which rounds to 3.9, not 3.8.
    const v = value('glucose', 70, 'mg/dL', 'mmol/L');
    expect(v).toBeCloseTo(3.885, 2);
    expect(Math.abs(v - 3.8)).toBeLessThan(0.1);
  });

  it('magnesium: NBME lists 1.5–2.0 "mg/dL" = 0.75–1.0 mmol/L, which only matches mEq/L', () => {
    // Documented discrepancy in the NBME table: 1.5 mg/dL is 0.617 mmol/L,
    // whereas 1.5 mEq/L is 0.75 mmol/L.
    expect(value('magnesium', 1.5, 'mg/dL', 'mmol/L')).toBeCloseTo(0.617, 3);
    expect(value('magnesium', 1.5, 'meq/L', 'mmol/L')).toBeCloseTo(0.75, 10);
  });

  it('HbA1c ≤ 6 % ↔ ≤ 42 mmol/mol', () => {
    expect(Math.round(value('hba1c', 6, 'ngsp', 'ifcc'))).toBe(42);
  });
});

// KDIGO 2024 conversion-factor table (Kidney Int 2024;105(4S):S126).
describe('KDIGO 2024 conversion factors', () => {
  it.each([
    ['uacr', 'mg/g', 'mg/mmol', 0.113],
    ['upcr', 'mg/g', 'mg/mmol', 0.113],
    ['calcium', 'mg/dL', 'mmol/L', 0.2495],
    ['creatinine', 'mg/dL', 'umol/L', 88.4],
    ['phosphate', 'mg/dL', 'mmol/L', 0.3229],
    ['uric-acid', 'mg/dL', 'umol/L', 59.48],
  ])('%s %s → %s ≈ %f', (analyte, from, to, published) => {
    within(factor(analyte, from, to), published, 0.002);
  });
});

// TODO(verify): CMEinfo 변환표 PDF 를 찾지 못함 (cmeinfo.com 사이트맵·검색에서 해당 PDF 없음).
describe('CMEinfo conversion table', () => {
  it.todo('CMEinfo 변환표 PDF 와 대조 — 원문 미확보');
});
