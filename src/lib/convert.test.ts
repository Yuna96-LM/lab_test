import { describe, expect, it } from 'vitest';
import { convert, dimensionOf } from './convert';
import { molarMass } from './molarMass';

const ok = (r: ReturnType<typeof convert>) => {
  if (!r.ok) throw new Error(`expected success, got: ${r.reason} ${r.detail ?? ''}`);
  return r;
};

describe('molar mass from IUPAC atomic weights', () => {
  it.each([
    ['C6H12O6', 180.156],
    ['C4H7N3O', 113.12],
    ['CH4N2O', 60.056],
    ['C27H46O', 386.664],
    ['C57H104O6', 885.453],
    ['C5H4N4O3', 168.112],
    ['C33H36N4O6', 584.673],
    ['HCO3', 61.016],
  ])('%s = %f g/mol', (formula, expected) => {
    expect(molarMass(formula)).toBeCloseTo(expected, 3);
  });
  it('rejects unknown elements', () => {
    expect(() => molarMass('Xx2')).toThrow();
  });
});

describe('UCUM dimensions', () => {
  it.each([
    ['mg/dL', 'mass-conc'],
    ['mmol/L', 'substance-conc'],
    ['meq/L', 'eq-conc'],
    ['U/L', 'catalytic-conc'],
    ['mg/mmol', 'mass-per-substance'],
    ['mg/g', 'dimensionless'],
  ])('%s → %s', (u, d) => expect(dimensionOf(u)).toBe(d));
});

describe('convert — molecular weight', () => {
  it('glucose 100 mg/dL → mmol/L uses 10/M', () => {
    const r = ok(convert('glucose', 100, 'mg/dL', 'mmol/L'));
    expect(r.value).toBeCloseTo(1000 / 180.156, 6);
    expect(r.steps.join('\n')).toContain('180.156');
    expect(r.sources.map((s) => s.id)).toEqual(['ucum', 'iupac']);
  });
  it('round trip is identity', () => {
    const a = ok(convert('creatinine', 1.3, 'mg/dL', 'umol/L'));
    const b = ok(convert('creatinine', a.value, 'umol/L', 'mg/dL'));
    expect(b.value).toBeCloseTo(1.3, 10);
  });
  it('creatinine factor ≈ 88.4', () => {
    expect(ok(convert('creatinine', 1, 'mg/dL', 'umol/L')).factor).toBeCloseTo(88.402, 2);
  });
  it('pure scale (g/dL → g/L) does not need a molar mass', () => {
    const r = ok(convert('albumin', 4.2, 'g/dL', 'g/L'));
    expect(r.value).toBeCloseTo(42, 10);
    expect(r.sources.map((s) => s.id)).toEqual(['ucum']);
  });
});

describe('convert — ionic charge', () => {
  it('calcium 2.5 mmol/L = 5 mEq/L', () => {
    expect(ok(convert('calcium', 2.5, 'mmol/L', 'meq/L')).value).toBeCloseTo(5, 10);
  });
  it('calcium 10 mg/dL → mEq/L uses M and z', () => {
    expect(ok(convert('calcium', 10, 'mg/dL', 'meq/L')).value).toBeCloseTo((100 / 40.078) * 2, 6);
  });
  it('sodium mEq/L = mmol/L', () => {
    expect(ok(convert('sodium', 140, 'meq/L', 'mmol/L')).value).toBeCloseTo(140, 10);
  });
  it('rejects mEq/L for phosphate (pH-dependent valence)', () => {
    const r = convert('phosphate', 1, 'mmol/L', 'other:meq/L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.detail).toContain('pH');
  });
  it('rejects mEq/L for glucose (non-electrolyte)', () => {
    expect(convert('glucose', 100, 'mg/dL', 'other:meq/L').ok).toBe(false);
  });
});

describe('convert — rejections without a basis', () => {
  it('mg/dL → U/L is rejected with a reason', () => {
    const r = convert('glucose', 100, 'mg/dL', 'other:U/L');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toMatch(/차원|근거/);
  });
  it('enzyme U/L → mg/dL is rejected', () => {
    const r = convert('alt', 40, 'U/L', 'other:mg/dL');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.detail).toContain('효소');
  });
  it('albumin g/dL → mmol/L is rejected (no molar convention)', () => {
    expect(convert('albumin', 4, 'g/dL', 'other:mmol/L').ok).toBe(false);
  });
  it('glucose % is rejected even though UCUM would scale % ↔ mmol/mol', () => {
    expect(convert('glucose', 5, 'other:%', 'other:mmol/mol').ok).toBe(false);
  });
  it('negative and non-numeric values are rejected', () => {
    expect(convert('glucose', -1, 'mg/dL', 'mmol/L').ok).toBe(false);
    expect(convert('glucose', Number.NaN, 'mg/dL', 'mmol/L').ok).toBe(false);
  });
});

describe('convert — enzymes', () => {
  it('60 U/L = 1 µkat/L', () => {
    expect(ok(convert('alt', 60, 'U/L', 'ukat/L')).value).toBeCloseTo(1, 10);
  });
});

describe('special — HbA1c (NGSP master equation)', () => {
  it('IFCC 53 mmol/mol → NGSP %', () => {
    expect(ok(convert('hba1c', 53, 'ifcc', 'ngsp')).value).toBeCloseTo(0.09148 * 53 + 2.152, 10);
  });
  it('NGSP 7 % → IFCC ≈ 53 mmol/mol (not the UCUM 70)', () => {
    const r = ok(convert('hba1c', 7, 'ngsp', 'ifcc'));
    expect(r.value).toBeCloseTo((7 - 2.152) / 0.09148, 10);
    expect(Math.round(r.value)).toBe(53);
    expect(r.sources.map((s) => s.id)).toEqual(['ngsp']);
  });
  it('round trip', () => {
    const a = ok(convert('hba1c', 6.5, 'ngsp', 'ifcc'));
    expect(ok(convert('hba1c', a.value, 'ifcc', 'ngsp')).value).toBeCloseTo(6.5, 10);
  });
  it('rejects values below the intercept', () => {
    expect(convert('hba1c', 2, 'ngsp', 'ifcc').ok).toBe(false);
  });
  it('rejects non-HbA1c units', () => {
    expect(convert('hba1c', 7, 'ngsp', 'other:mg/dL').ok).toBe(false);
  });
});

describe('special — uACR / uPCR (KDIGO 2024)', () => {
  it('30 mg/g ≈ 3.39 mg/mmol (KDIGO factor 0.113)', () => {
    const r = ok(convert('uacr', 30, 'mg/g', 'mg/mmol'));
    expect(r.factor).toBeCloseTo(0.113, 3);
    expect(r.value).toBeCloseTo(30 * 113.12 / 1000, 6);
    expect(r.sources.map((s) => s.id)).toContain('kdigo2024');
  });
  it('uPCR 200 mg/g → ≈ 22.6 mg/mmol; g/g ↔ mg/g', () => {
    expect(ok(convert('upcr', 200, 'mg/g', 'mg/mmol')).value).toBeCloseTo(22.624, 3);
    expect(ok(convert('upcr', 0.2, 'g/g', 'mg/g')).value).toBeCloseTo(200, 10);
  });
});

describe('special — BUN ↔ urea', () => {
  it('BUN 14 mg/dL → urea mmol/L = 14 × 10 / 28.014', () => {
    expect(ok(convert('urea', 14, 'mg/dL-BUN', 'mmol/L')).value).toBeCloseTo(140 / 28.014, 6);
  });
  it('BUN mg/dL → urea mg/dL factor = 60.056 / 28.014', () => {
    expect(ok(convert('urea', 1, 'mg/dL-BUN', 'mg/dL-urea')).factor).toBeCloseTo(60.056 / 28.014, 6);
  });
  it('urea mmol/L → urea mg/dL uses the urea molar mass', () => {
    expect(ok(convert('urea', 5, 'mmol/L', 'mg/dL-urea')).value).toBeCloseTo(5 * 60.056 / 10, 6);
  });
});

describe('special — triglycerides as triolein', () => {
  it('150 mg/dL → mmol/L via M(C57H104O6)', () => {
    const r = ok(convert('triglycerides', 150, 'mg/dL', 'mmol/L'));
    expect(r.value).toBeCloseTo(1500 / 885.453, 6);
    expect(r.assumptions.join(' ')).toContain('triolein');
  });
});
