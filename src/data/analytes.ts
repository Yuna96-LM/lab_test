import type { SourceId } from './sources';

export interface UnitOption {
  /** Stable id used in the UI (unique within an analyte). */
  id: string;
  /** UCUM code handed to ucum-lhc. */
  ucum: string;
  /** Human label. */
  label: string;
  /**
   * Chemical basis of this unit when it differs from the analyte default,
   * e.g. BUN "mg/dL" is mass of urea *nitrogen* (N2), not mass of urea.
   */
  basisFormula?: string;
  basisLabel?: string;
}

export interface Analyte {
  id: string;
  en: string;
  ko: string;
  synonyms: string[];
  /** Formula whose molar mass (from IUPAC atomic weights) is used for mass↔mol. */
  formula?: string;
  formulaLabel?: string;
  /** Ionic charge magnitude used for mEq/L ↔ mmol/L. */
  charge?: number;
  /** Why mEq/L is not offered, if relevant. */
  noChargeReason?: string;
  /** Why mass↔mol is not offered, if relevant. */
  noMolarReason?: string;
  /** Uses a dedicated published equation instead of UCUM. */
  special?: 'hba1c';
  units: UnitOption[];
  assumptions?: string[];
  sources: SourceId[];
}

const u = (id: string, label = id, ucum = id): UnitOption => ({ id, ucum, label });

// UCUM codes: "meq/L" = mEq/L, "umol/L" = µmol/L, "ukat/L" = µkat/L.
const MEQ = u('meq/L', 'mEq/L');
const UMOL = u('umol/L', 'µmol/L');
const ENZYME_UNITS = [u('U/L'), u('ukat/L', 'µkat/L'), u('nkat/L')];
const enzymeAssumption =
  '1 U = 1 µmol/min (UCUM 정의), 1 kat = 1 mol/s → 1 U/L = 1/60 µkat/L. 측정 온도·방법이 다른 결과끼리의 변환이 아님.';

const NO_MOLAR_PROTEIN =
  '단백질은 단일 분자량으로 환산하는 공인 관례가 없어 질량↔물질량 변환 근거가 없음';

const enzyme = (id: string, en: string, ko: string, synonyms: string[]): Analyte => ({
  id,
  en,
  ko,
  synonyms,
  noMolarReason: '효소 활성(촉매 활성 농도)은 질량·물질량 농도와 차원이 다름',
  units: ENZYME_UNITS,
  assumptions: [enzymeAssumption],
  sources: ['ucum'],
});

export const ANALYTES: Analyte[] = [
  {
    id: 'glucose',
    en: 'Glucose',
    ko: '포도당(혈당)',
    synonyms: ['glu', 'blood sugar', 'FBS', 'FPG', '혈당', '공복혈당'],
    formula: 'C6H12O6',
    noChargeReason: '포도당은 비전해질(전하 0)이므로 mEq 단위가 정의되지 않음',
    units: [u('mg/dL'), u('mmol/L'), u('g/L'), u('mg/L')],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'cholesterol',
    en: 'Cholesterol (total / HDL / LDL)',
    ko: '콜레스테롤(총·HDL·LDL)',
    synonyms: ['chol', 'TC', 'HDL', 'LDL', 'HDL-C', 'LDL-C', '총콜레스테롤'],
    formula: 'C27H46O',
    noChargeReason: '콜레스테롤은 비전해질이므로 mEq 단위가 정의되지 않음',
    units: [u('mg/dL'), u('mmol/L')],
    assumptions: ['HDL·LDL 콜레스테롤도 콜레스테롤 분자(C27H46O) 질량으로 보고된다는 관례를 따름'],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'triglycerides',
    en: 'Triglycerides',
    ko: '중성지방',
    synonyms: ['TG', 'triglyceride', 'trig', '트리글리세리드'],
    formula: 'C57H104O6',
    formulaLabel: 'triolein (C57H104O6)',
    noChargeReason: '중성지방은 비전해질이므로 mEq 단위가 정의되지 않음',
    units: [u('mg/dL'), u('mmol/L')],
    assumptions: [
      '중성지방은 단일 분자가 아닌 혼합물이다. 관례에 따라 대표 분자 triolein(C57H104O6)의 분자량으로 환산함',
      '실제 시료의 지방산 조성에 따라 진짜 몰 농도와는 차이가 있을 수 있음',
    ],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'creatinine',
    en: 'Creatinine',
    ko: '크레아티닌',
    synonyms: ['Cr', 'Cre', 'SCr', 'creat', '크레아티닌'],
    formula: 'C4H7N3O',
    noChargeReason: '크레아티닌은 생리적 pH에서 이온 당량으로 보고하지 않음',
    units: [u('mg/dL'), UMOL, u('mmol/L'), u('mg/L')],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'urea',
    en: 'Urea / Blood urea nitrogen (BUN)',
    ko: '요소 / 혈중요소질소(BUN)',
    synonyms: ['BUN', 'urea nitrogen', 'SUN', '요소질소', '요소'],
    formula: 'CH4N2O',
    formulaLabel: 'urea (CH4N2O)',
    noChargeReason: '요소는 비전해질이므로 mEq 단위가 정의되지 않음',
    units: [
      { id: 'mg/dL-BUN', ucum: 'mg/dL', label: 'mg/dL (BUN, 요소질소)', basisFormula: 'N2', basisLabel: '요소 1분자의 질소 2원자 (N2)' },
      { id: 'mmol/L', ucum: 'mmol/L', label: 'mmol/L (요소)' },
      { id: 'mg/dL-urea', ucum: 'mg/dL', label: 'mg/dL (요소)' },
    ],
    assumptions: [
      'BUN(mg/dL)은 요소 분자 중 질소의 질량만 센 값: 요소 1 mol = 질소 2 mol(28.014 g)',
      'mmol/L 은 요소(= 요소질소/2) 물질량 농도',
    ],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'uric-acid',
    en: 'Uric acid (urate)',
    ko: '요산',
    synonyms: ['UA', 'urate', '요산'],
    formula: 'C5H4N4O3',
    noChargeReason: '요산은 이온 당량으로 보고하는 관례가 없음',
    units: [u('mg/dL'), UMOL, u('mmol/L')],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'bilirubin',
    en: 'Bilirubin (total / direct)',
    ko: '빌리루빈(총·직접)',
    synonyms: ['TBil', 'T-bil', 'DBil', 'D-bil', '총빌리루빈', '직접빌리루빈'],
    formula: 'C33H36N4O6',
    noChargeReason: '빌리루빈은 이온 당량으로 보고하는 관례가 없음',
    units: [u('mg/dL'), UMOL],
    assumptions: ['직접(포합) 빌리루빈도 비포합 빌리루빈 분자량으로 환산하는 관례를 따름'],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'calcium',
    en: 'Calcium',
    ko: '칼슘',
    synonyms: ['Ca', 'Ca2+', '칼슘'],
    formula: 'Ca',
    charge: 2,
    units: [u('mg/dL'), u('mmol/L'), MEQ],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'magnesium',
    en: 'Magnesium',
    ko: '마그네슘',
    synonyms: ['Mg', 'Mg2+', '마그네슘'],
    formula: 'Mg',
    charge: 2,
    units: [u('mg/dL'), u('mmol/L'), MEQ],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'phosphate',
    en: 'Phosphate (inorganic phosphorus)',
    ko: '인(무기인)',
    synonyms: ['P', 'Pi', 'PO4', 'phosphorus', '인산', '무기인'],
    formula: 'P',
    formulaLabel: 'phosphorus (P) — 인 원자 기준',
    noChargeReason: '혈중 인산은 HPO4²⁻/H2PO4⁻ 혼합이라 평균 전하가 pH에 따라 달라 mEq 환산 근거가 고정되지 않음',
    units: [u('mg/dL'), u('mmol/L')],
    assumptions: ['mg/dL 은 인산 이온이 아닌 인(P) 원자의 질량으로 보고된다는 관례를 따름'],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'sodium',
    en: 'Sodium',
    ko: '나트륨',
    synonyms: ['Na', 'Na+', '소듐', '나트륨'],
    formula: 'Na',
    charge: 1,
    units: [u('mmol/L'), MEQ, u('mg/dL')],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'potassium',
    en: 'Potassium',
    ko: '칼륨',
    synonyms: ['K', 'K+', '포타슘', '칼륨'],
    formula: 'K',
    charge: 1,
    units: [u('mmol/L'), MEQ, u('mg/dL')],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'chloride',
    en: 'Chloride',
    ko: '염화물(클로라이드)',
    synonyms: ['Cl', 'Cl-', '클로라이드', '염소'],
    formula: 'Cl',
    charge: 1,
    units: [u('mmol/L'), MEQ, u('mg/dL')],
    assumptions: ['Cl⁻ 의 전하 크기 |z| = 1 사용'],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'bicarbonate',
    en: 'Bicarbonate (total CO2)',
    ko: '중탄산염(총 CO2)',
    synonyms: ['HCO3', 'HCO3-', 'tCO2', 'CO2', '중탄산'],
    formula: 'HCO3',
    charge: 1,
    units: [u('mmol/L'), MEQ],
    assumptions: ['HCO3⁻ 의 전하 크기 |z| = 1 사용'],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'iron',
    en: 'Iron / TIBC',
    ko: '철 / 총철결합능',
    synonyms: ['Fe', 'serum iron', 'TIBC', '혈청철', '철'],
    formula: 'Fe',
    noChargeReason: '혈청 철은 트랜스페린 결합 상태로 이온 당량 보고 관례가 없음',
    units: [u('ug/dL', 'µg/dL'), UMOL],
    assumptions: ['TIBC 도 결합 가능한 철(Fe) 원자의 양으로 표현되므로 같은 계수 사용'],
    sources: ['ucum', 'iupac'],
  },
  {
    id: 'albumin',
    en: 'Albumin',
    ko: '알부민',
    synonyms: ['Alb', '알부민'],
    noMolarReason: NO_MOLAR_PROTEIN,
    units: [u('g/dL'), u('g/L')],
    sources: ['ucum'],
  },
  {
    id: 'total-protein',
    en: 'Total protein',
    ko: '총단백',
    synonyms: ['TP', 'protein', '총단백질'],
    noMolarReason: NO_MOLAR_PROTEIN,
    units: [u('g/dL'), u('g/L')],
    sources: ['ucum'],
  },
  {
    id: 'hemoglobin',
    en: 'Hemoglobin',
    ko: '혈색소(헤모글로빈)',
    synonyms: ['Hb', 'Hgb', '혈색소', '헤모글로빈'],
    noMolarReason: '혈색소 mmol/L 보고는 단량체/사량체 기준 선택에 따라 값이 4배 달라져 이 앱에서는 제공하지 않음',
    units: [u('g/dL'), u('g/L')],
    sources: ['ucum'],
  },
  enzyme('alt', 'Alanine aminotransferase (ALT)', '알라닌아미노전이효소', ['ALT', 'GPT', 'SGPT']),
  enzyme('ast', 'Aspartate aminotransferase (AST)', '아스파르트산아미노전이효소', ['AST', 'GOT', 'SGOT']),
  enzyme('alp', 'Alkaline phosphatase (ALP)', '알칼리인산분해효소', ['ALP', 'ALKP', '알칼리포스파타제']),
  enzyme('ggt', 'Gamma-glutamyl transferase (GGT)', '감마글루타밀전이효소', ['GGT', 'γ-GT', 'GGTP']),
  enzyme('ld', 'Lactate dehydrogenase (LD)', '젖산탈수소효소', ['LD', 'LDH']),
  enzyme('ck', 'Creatine kinase (CK)', '크레아틴키나아제', ['CK', 'CPK']),
  enzyme('lipase', 'Lipase', '리파아제', ['LPS', '리파제']),
  {
    id: 'hba1c',
    en: 'Hemoglobin A1c (HbA1c)',
    ko: '당화혈색소',
    synonyms: ['A1c', 'HbA1c', 'glycated hemoglobin', 'glycohemoglobin', '당화혈색소'],
    special: 'hba1c',
    units: [
      { id: 'ngsp', ucum: '%', label: '% (NGSP/DCCT)' },
      { id: 'ifcc', ucum: 'mmol/mol', label: 'mmol/mol (IFCC)' },
    ],
    assumptions: [
      'NGSP % 와 IFCC mmol/mol 은 서로 다른 측정량(분모가 다름)이므로 단위 환산이 아니라 회귀식(master equation)으로 변환',
      'NGSP 는 IFCC → NGSP 방향의 식을 공표함. NGSP → IFCC 는 같은 식을 대수적으로 뒤집은 것',
    ],
    sources: ['ngsp'],
  },
  {
    id: 'uacr',
    en: 'Urine albumin-to-creatinine ratio (uACR)',
    ko: '요 알부민/크레아티닌 비',
    synonyms: ['ACR', 'UACR', 'albuminuria', 'microalbumin', '알부민뇨', '미세알부민'],
    formula: 'C4H7N3O',
    formulaLabel: 'creatinine (C4H7N3O) — 분모',
    units: [u('mg/g'), u('mg/mmol')],
    assumptions: ['분모(크레아티닌)의 질량↔물질량 환산에 크레아티닌 분자량을 사용; 분자(알부민) 질량은 그대로'],
    sources: ['ucum', 'iupac', 'kdigo2024'],
  },
  {
    id: 'upcr',
    en: 'Urine protein-to-creatinine ratio (uPCR)',
    ko: '요 단백/크레아티닌 비',
    synonyms: ['PCR', 'UPCR', 'proteinuria', '단백뇨'],
    formula: 'C4H7N3O',
    formulaLabel: 'creatinine (C4H7N3O) — 분모',
    units: [u('mg/g'), u('g/g'), u('mg/mmol')],
    assumptions: ['분모(크레아티닌)의 질량↔물질량 환산에 크레아티닌 분자량을 사용; 분자(단백) 질량은 그대로'],
    sources: ['ucum', 'iupac', 'kdigo2024'],
  },
];

/** Units offered under "기타 단위" so that unsupported conversions can be tried and explained. */
export const OTHER_UNITS: UnitOption[] = [
  u('mg/dL'),
  u('g/dL'),
  u('g/L'),
  u('mmol/L'),
  UMOL,
  MEQ,
  u('U/L'),
  u('ukat/L', 'µkat/L'),
  u('%'),
  u('mmol/mol'),
  u('mg/g'),
  u('mg/mmol'),
].map((x) => ({ ...x, id: `other:${x.id}` }));

export function getAnalyte(id: string): Analyte | undefined {
  return ANALYTES.find((a) => a.id === id);
}

export function findUnit(analyte: Analyte, unitId: string): UnitOption | undefined {
  return analyte.units.find((x) => x.id === unitId) ?? OTHER_UNITS.find((x) => x.id === unitId);
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[\s\-_()/·.]/g, '');
}

/** Search by English name, Korean name, id or synonyms. */
export function searchAnalytes(query: string): Analyte[] {
  const q = normalize(query);
  if (!q) return ANALYTES;
  return ANALYTES.filter((a) =>
    [a.id, a.en, a.ko, ...a.synonyms].some((s) => normalize(s).includes(q)),
  );
}
