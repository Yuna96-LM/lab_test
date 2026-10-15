import { UcumLhcUtils } from '@lhncbc/ucum-lhc';
import { findUnit, getAnalyte, type Analyte, type UnitOption } from '../data/analytes';
import { SOURCES, type Source, type SourceId } from '../data/sources';
import { molarMass, molarMassExpression } from './molarMass';

const ucum = UcumLhcUtils.getInstance();

export type Dimension = 'mass-conc' | 'substance-conc' | 'eq-conc' | 'catalytic-conc' | 'mass-per-substance' | 'dimensionless';

const DIMENSION_LABEL: Record<Dimension, string> = {
  'mass-conc': '질량 농도',
  'substance-conc': '물질량 농도',
  'eq-conc': '당량 농도',
  'catalytic-conc': '촉매(효소) 활성 농도',
  'mass-per-substance': '질량/물질량 비',
  dimensionless: '무차원 비',
};

// Probe units: a unit belongs to a dimension if UCUM converts it to the probe
// without needing a molecular weight or charge.
const PROBES: [Dimension, string][] = [
  ['mass-conc', 'g/L'],
  ['substance-conc', 'mol/L'],
  ['eq-conc', 'eq/L'],
  ['catalytic-conc', 'kat/L'],
  ['mass-per-substance', 'g/mol'],
  ['dimensionless', '1'],
];

export function dimensionOf(ucumCode: string): Dimension | null {
  for (const [dim, probe] of PROBES) {
    if (ucum.convertUnitTo(ucumCode, 1, probe).status === 'succeeded') return dim;
  }
  return null;
}

export interface ConversionOk {
  ok: true;
  value: number;
  /** Multiplicative factor (result = input × factor) when the conversion is linear. */
  factor?: number;
  method: string;
  formula: string;
  steps: string[];
  assumptions: string[];
  sources: Source[];
}

export interface ConversionError {
  ok: false;
  reason: string;
  detail?: string;
}

export type ConversionResult = ConversionOk | ConversionError;

const fail = (reason: string, detail?: string): ConversionError => ({ ok: false, reason, detail });

export function fmt(x: number, sig = 6): string {
  if (!Number.isFinite(x)) return String(x);
  if (x === 0) return '0';
  return String(Number(x.toPrecision(sig)));
}

function sourcesOf(ids: SourceId[]): Source[] {
  return [...new Set(ids)].map((id) => SOURCES[id]);
}

// --- HbA1c (NGSP master equation) ----------------------------------------

export const NGSP_SLOPE = 0.09148;
export const NGSP_INTERCEPT = 2.152;

function convertHbA1c(value: number, from: UnitOption, to: UnitOption): ConversionResult {
  const ids = ['ngsp', 'ifcc'];
  if (!ids.includes(from.id) || !ids.includes(to.id)) {
    return fail(
      'HbA1c 는 NGSP % 와 IFCC mmol/mol 사이의 변환만 근거(NGSP master equation)가 있습니다.',
      'UCUM 상으로는 % 와 mmol/mol 이 모두 무차원이라 7 % = 70 mmol/mol 처럼 단순 배율이 나오지만, 이는 HbA1c 에 대해 틀린 값이므로 사용하지 않습니다.',
    );
  }
  const common = {
    method: 'NGSP–IFCC master equation (회귀식, 단위 환산 아님)',
    assumptions: getAnalyte('hba1c')!.assumptions ?? [],
    sources: sourcesOf(['ngsp']),
  };
  if (from.id === to.id) {
    return { ok: true, value, factor: 1, formula: `${to.label} = ${from.label}`, steps: ['같은 단위'], ...common };
  }
  if (from.id === 'ifcc') {
    const v = NGSP_SLOPE * value + NGSP_INTERCEPT;
    return {
      ok: true,
      value: v,
      formula: `NGSP(%) = ${NGSP_SLOPE} × IFCC(mmol/mol) + ${NGSP_INTERCEPT}`,
      steps: [`${NGSP_SLOPE} × ${value} + ${NGSP_INTERCEPT} = ${fmt(v, 4)} %`],
      ...common,
    };
  }
  const v = (value - NGSP_INTERCEPT) / NGSP_SLOPE;
  if (v <= 0) {
    return fail(`NGSP ${value} % 는 master equation 의 절편(${NGSP_INTERCEPT} %) 이하라 IFCC 값이 0 이하가 됩니다. 식의 적용 범위 밖입니다.`);
  }
  return {
    ok: true,
    value: v,
    formula: `IFCC(mmol/mol) = (NGSP(%) − ${NGSP_INTERCEPT}) / ${NGSP_SLOPE}`,
    steps: [
      `NGSP 공표식 NGSP = ${NGSP_SLOPE} × IFCC + ${NGSP_INTERCEPT} 를 IFCC 에 대해 정리`,
      `(${value} − ${NGSP_INTERCEPT}) / ${NGSP_SLOPE} = ${fmt(v, 4)} mmol/mol`,
    ],
    ...common,
  };
}

// --- UCUM path -----------------------------------------------------------

function basisFormula(analyte: Analyte, unit: UnitOption): string | undefined {
  return unit.basisFormula ?? analyte.formula;
}

function rejectionForDimension(analyte: Analyte, dim: Dimension, unit: UnitOption): ConversionError {
  const label = DIMENSION_LABEL[dim];
  if (dim === 'eq-conc') {
    return fail(
      `${analyte.ko}: ${unit.label}(${label}) 변환 근거 없음`,
      analyte.noChargeReason ?? '이 분석물에 대해 이온 전하가 정의되어 있지 않습니다.',
    );
  }
  if (dim === 'substance-conc' || dim === 'mass-conc' || dim === 'mass-per-substance') {
    return fail(
      `${analyte.ko}: ${unit.label}(${label}) 변환 근거 없음`,
      analyte.noMolarReason ?? '이 분석물에 대해 해당 차원으로 환산할 분자량 근거가 없습니다.',
    );
  }
  return fail(
    `${analyte.ko}: ${unit.label}(${label}) 는 이 분석물의 보고 단위 차원과 달라 변환할 수 없습니다.`,
    `${analyte.ko} 의 단위 차원: ${[...new Set(analyte.units.map((x) => dimensionOf(x.ucum)))]
      .filter(Boolean)
      .map((d) => DIMENSION_LABEL[d!])
      .join(', ')}`,
  );
}

function ucumConvert(from: string, value: number, to: string, mw?: number, charge?: number): number {
  const r = ucum.convertUnitTo(from, value, to, { molecularWeight: mw ?? null, charge: charge ?? null });
  if (r.status !== 'succeeded' || r.toVal === null) {
    throw new Error(r.msg.join(' ') || `UCUM 변환 실패: ${from} → ${to}`);
  }
  return r.toVal;
}

export function convert(analyteId: string, value: number, fromId: string, toId: string): ConversionResult {
  const analyte = getAnalyte(analyteId);
  if (!analyte) return fail(`알 수 없는 분석물: ${analyteId}`);
  const from = findUnit(analyte, fromId);
  const to = findUnit(analyte, toId);
  if (!from || !to) return fail(`알 수 없는 단위: ${!from ? fromId : toId}`);
  if (!Number.isFinite(value)) return fail('숫자 값을 입력하세요.');
  if (value < 0) return fail('농도·활성 값은 음수가 될 수 없습니다.');

  if (analyte.special === 'hba1c') return convertHbA1c(value, from, to);

  // 1) UCUM dimension check against the dimensions this analyte is reported in.
  const fromDim = dimensionOf(from.ucum);
  const toDim = dimensionOf(to.ucum);
  if (!fromDim || !toDim) return fail(`UCUM 이 해석할 수 없는 단위입니다: ${!fromDim ? from.ucum : to.ucum}`);
  const allowed = new Set(analyte.units.map((x) => dimensionOf(x.ucum)));
  if (!allowed.has(fromDim)) return rejectionForDimension(analyte, fromDim, from);
  if (!allowed.has(toDim)) return rejectionForDimension(analyte, toDim, to);

  const steps: string[] = [
    `UCUM 차원 검사: ${from.label} [${DIMENSION_LABEL[fromDim]}] → ${to.label} [${DIMENSION_LABEL[toDim]}] — 통과`,
  ];
  const sourceIds: SourceId[] = ['ucum'];
  const fBasis = basisFormula(analyte, from);
  const tBasis = basisFormula(analyte, to);
  const molarDims: Dimension[] = ['substance-conc', 'eq-conc'];
  // mass↔mol, mass↔eq, ratio(mg/g)↔mg/mmol need M; mol↔eq needs only the charge.
  const needsMolar = fromDim !== toDim && !(molarDims.includes(fromDim) && molarDims.includes(toDim));
  const basisDiffers = fBasis !== tBasis && (fromDim === 'mass-conc' || toDim === 'mass-conc');
  const needsCharge = (fromDim === 'eq-conc') !== (toDim === 'eq-conc');

  if (needsCharge && !analyte.charge) {
    return rejectionForDimension(analyte, 'eq-conc', fromDim === 'eq-conc' ? from : to);
  }

  const describeMw = (formula: string, label?: string) => {
    const mw = molarMass(formula);
    steps.push(`M(${label ?? formula}) = ${molarMassExpression(formula)} = ${fmt(mw)} g/mol (IUPAC 표준 원자량으로 계산)`);
    sourceIds.push('iupac');
    return mw;
  };

  let result: number;
  let factor: number;
  try {
    if (basisDiffers) {
      // e.g. BUN (mass of N2) ↔ urea mass: go through the amount of substance.
      if (!fBasis || !tBasis) throw new Error('분자량 근거가 없습니다.');
      const mwF = describeMw(fBasis, from.basisLabel ?? (fBasis === analyte.formula ? analyte.formulaLabel : undefined));
      const mwT = describeMw(tBasis, to.basisLabel ?? (tBasis === analyte.formula ? analyte.formulaLabel : undefined));
      const mid = ucumConvert(from.ucum, 1, 'mmol/L', mwF);
      factor = ucumConvert('mmol/L', mid, to.ucum, mwT);
      steps.push(`UCUM: 1 ${from.label} → ${fmt(mid)} mmol/L → ${fmt(factor)} ${to.label}`);
    } else {
      let mw: number | undefined;
      if (needsMolar) {
        const basis = fBasis ?? tBasis;
        if (!basis) {
          return rejectionForDimension(analyte, fromDim === 'mass-conc' ? toDim : fromDim, fromDim === 'mass-conc' ? to : from);
        }
        mw = describeMw(basis, from.basisLabel ?? to.basisLabel ?? analyte.formulaLabel);
      }
      if (needsCharge) {
        steps.push(`이온 전하 |z| = ${analyte.charge} → 1 mmol = ${analyte.charge} mEq`);
      }
      factor = ucumConvert(from.ucum, 1, to.ucum, mw, analyte.charge);
      steps.push(`UCUM 변환: 1 ${from.label} = ${fmt(factor)} ${to.label}`);
    }
    result = value * factor;
  } catch (e) {
    return fail('UCUM 이 이 변환을 거부했습니다.', (e as Error).message);
  }

  const kdigo = analyte.id === 'uacr' || analyte.id === 'upcr';
  if (kdigo && (fromDim !== toDim)) {
    sourceIds.push('kdigo2024');
    steps.push('대조: KDIGO 2024 변환표의 공표 계수 mg/g × 0.113 = mg/mmol');
  }

  return {
    ok: true,
    value: result,
    factor,
    method: basisDiffers
      ? 'UCUM + 분자량(물질량 경유, 기준 물질이 다른 두 질량 단위)'
      : needsCharge
        ? 'UCUM + 분자량 + 이온 전하'
        : needsMolar
          ? 'UCUM + 분자량'
          : 'UCUM 스케일 변환',
    formula: `${to.label} = ${from.label} × ${fmt(factor)}`,
    steps,
    assumptions: analyte.assumptions ?? [],
    sources: sourcesOf(sourceIds),
  };
}
