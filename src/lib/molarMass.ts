// IUPAC CIAAW standard atomic weights — abridged/conventional values
// (https://www.ciaaw.org/atomic-weights.htm). Elements with an interval
// (H, C, N, O, Mg, S, Cl) use the IUPAC "conventional" value.
export const ATOMIC_WEIGHTS: Record<string, number> = {
  H: 1.008,
  C: 12.011,
  N: 14.007,
  O: 15.999,
  Na: 22.99,
  Mg: 24.305,
  P: 30.974,
  S: 32.06,
  Cl: 35.45,
  K: 39.098,
  Ca: 40.078,
  Fe: 55.845,
};

export interface FormulaTerm {
  element: string;
  count: number;
  weight: number;
}

/** Parses a simple Hill-style formula like "C6H12O6" (no parentheses). */
export function parseFormula(formula: string): FormulaTerm[] {
  const terms: FormulaTerm[] = [];
  const re = /([A-Z][a-z]?)(\d*)/g;
  let consumed = 0;
  for (const m of formula.matchAll(re)) {
    if (m[0] === '') continue;
    const element = m[1];
    const weight = ATOMIC_WEIGHTS[element];
    if (weight === undefined) throw new Error(`Unknown element "${element}" in ${formula}`);
    terms.push({ element, count: m[2] ? Number(m[2]) : 1, weight });
    consumed += m[0].length;
  }
  if (consumed !== formula.length) throw new Error(`Unsupported formula syntax: ${formula}`);
  return terms;
}

export function molarMass(formula: string): number {
  return parseFormula(formula).reduce((sum, t) => sum + t.count * t.weight, 0);
}

/** "6×12.011 + 12×1.008 + 6×15.999" — shown in the 계산 근거 panel. */
export function molarMassExpression(formula: string): string {
  return parseFormula(formula)
    .map((t) => (t.count === 1 ? `${t.weight}` : `${t.count}×${t.weight}`))
    .join(' + ');
}
