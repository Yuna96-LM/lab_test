import type { SourceId } from './sources';

export type Sex = 'any' | 'M' | 'F';
export type Specimen = 'serum' | 'plasma';

/** Age expressed in days. Bands are [min, max). */
export const DAY = 1;
export const WEEK = 7;
export const YEAR = 365.25;

export interface ReferenceInterval {
  analyteId: string;
  /** Label of the published row, e.g. "Potassium (plasma)". */
  label: string;
  sex: Sex;
  specimens: Specimen[];
  ageMinDays: number;
  ageMaxDays: number;
  /** Published age band text, shown verbatim. */
  ageLabel: string;
  low: number | null;
  high: number | null;
  unit: string;
  /** Unit id in ANALYTES used to convert a user's result before classifying. */
  unitId: string;
  notes?: string[];
  sources: SourceId[];
  /** Facts that could not be confirmed against the primary source. */
  verify?: string[];
}

const ADULT_MAX = 120 * YEAR;
const ADULT_LABEL = '18y to <120y';

// 출처 메모: rcpa.edu.au 의 Table 6 페이지는 자동 접근(Cloudflare)이 막혀 있어
// 같은 표를 공표한 RCPA 승인 문헌(Tate 2014 CBR Table 1·2, Koerbin 2019 CCLM Table 1)
// 에서 값을 옮겼다. 웹 검색 스니펫으로 RCPA 페이지와 일치가 확인된 행은
// sodium, potassium(serum/plasma, 소아), chloride, bicarbonate(성인), calcium(성인),
// magnesium(성인), phosphate(20y+, 0d–<1w), lipase 이다.
const RCPA_VIA_PAPERS: SourceId[] = ['rcpaTable6', 'aacb2014', 'koerbin2019'];
// 소아 구간은 Tate 2014 Table 2 에만 실려 있음 (Koerbin 2019 는 성인 표).
const RCPA_PAEDS: SourceId[] = ['rcpaTable6', 'aacb2014'];
const RCPA_PAGE_NOT_READ =
  'TODO(verify): rcpa.edu.au Table 6 원문 페이지를 직접 열지 못함(Cloudflare 차단). RCPA 승인 문헌의 표와 대조함';

const adult = (
  analyteId: string,
  label: string,
  low: number | null,
  high: number | null,
  unit: string,
  unitId: string,
  extra: Partial<ReferenceInterval> = {},
): ReferenceInterval => ({
  analyteId,
  label,
  sex: 'any',
  specimens: ['serum', 'plasma'],
  ageMinDays: 18 * YEAR,
  ageMaxDays: ADULT_MAX,
  ageLabel: ADULT_LABEL,
  low,
  high,
  unit,
  unitId,
  sources: RCPA_VIA_PAPERS,
  ...extra,
});

type Band = [ageMinDays: number, ageMaxDays: number, ageLabel: string, low: number, high: number];

const paeds = (
  analyteId: string,
  label: string,
  unit: string,
  unitId: string,
  bands: Band[],
  extra: Partial<ReferenceInterval> = {},
): ReferenceInterval[] =>
  bands.map(([ageMinDays, ageMaxDays, ageLabel, low, high]) => ({
    analyteId,
    label,
    sex: 'any',
    specimens: ['serum', 'plasma'],
    ageMinDays,
    ageMaxDays,
    ageLabel,
    low,
    high,
    unit,
    unitId,
    sources: RCPA_PAEDS,
    ...extra,
  }));

const W1 = 1 * WEEK;
const W4 = 4 * WEEK;
const W26 = 26 * WEEK;

export const REFERENCE_INTERVALS: ReferenceInterval[] = [
  // Sodium
  ...paeds('sodium', 'Sodium', 'mmol/L', 'mmol/L', [
    [0, W1, '0d to <1w', 132, 147],
    [W1, 18 * YEAR, '1w to <18y', 133, 144],
  ]),
  adult('sodium', 'Sodium', 135, 145, 'mmol/L', 'mmol/L'),

  // Potassium — paediatric serum and plasma are published separately.
  ...paeds('potassium', 'Potassium (serum)', 'mmol/L', 'mmol/L', [
    [0, W1, '0d to <1w', 3.8, 6.5],
    [W1, W26, '1w to <26w', 4.2, 6.7],
    [W26, 2 * YEAR, '26w to <2y', 3.9, 5.6],
    [2 * YEAR, 18 * YEAR, '2y to <18y', 3.6, 5.3],
  ], { specimens: ['serum'] }),
  ...paeds('potassium', 'Potassium (plasma)', 'mmol/L', 'mmol/L', [
    [0, W1, '0d to <1w', 3.5, 6.2],
    [W1, W26, '1w to <26w', 3.8, 6.4],
    [W26, 2 * YEAR, '26w to <2y', 3.5, 5.4],
    [2 * YEAR, 18 * YEAR, '2y to <18y', 3.3, 4.9],
  ], { specimens: ['plasma'] }),
  adult('potassium', 'Potassium', 3.5, 5.2, 'mmol/L', 'mmol/L', {
    notes: ['성인 구간은 혈청·혈장 모두에 사용하도록 제안됨. 헤파린 혈장만 검사하는 검사실은 더 낮은 구간을 선택할 수 있음(원문 각주)'],
  }),

  // Chloride
  ...paeds('chloride', 'Chloride', 'mmol/L', 'mmol/L', [
    [0, W1, '0d to <1w', 98, 115],
    [W1, 18 * YEAR, '1w to <18y', 97, 110],
  ]),
  adult('chloride', 'Chloride', 95, 110, 'mmol/L', 'mmol/L'),

  // Bicarbonate
  ...paeds('bicarbonate', 'Bicarbonate', 'mmol/L', 'mmol/L', [
    [0, W1, '0d to <1w', 15, 28],
    [W1, 2 * YEAR, '1w to <2y', 16, 29],
    [2 * YEAR, 10 * YEAR, '2y to <10y', 17, 30],
    [10 * YEAR, 18 * YEAR, '10y to <18y', 20, 32],
  ]),
  adult('bicarbonate', 'Bicarbonate', 22, 32, 'mmol/L', 'mmol/L', {
    notes: ['중탄산염은 JCTLM 등재 참조물질/방법이 없음(원문 각주)'],
  }),

  // Creatinine
  ...paeds('creatinine', 'Creatinine', 'µmol/L', 'umol/L', [
    [0, W1, '0w to <1w', 22, 93],
    [W1, W4, '1w to <4w', 17, 50],
    [W4, 2 * YEAR, '4w to <2y', 11, 36],
    [2 * YEAR, 6 * YEAR, '2y to <6y', 20, 44],
    [6 * YEAR, 12 * YEAR, '6y to <12y', 27, 58],
  ], { notes: ['<19세 구간은 Ortho Vitros enzymatic creatinine 측정법을 쓰는 검사실 전용(원문 각주). 그 외 검사실은 18세부터 성인 구간 적용'], sources: RCPA_PAEDS, verify: [RCPA_PAGE_NOT_READ] }),
  ...[
    { sex: 'M' as const, rows: [[12, 15, 35, 83], [15, 19, 50, 100]] },
    { sex: 'F' as const, rows: [[12, 15, 35, 74], [15, 19, 38, 82]] },
  ].flatMap(({ sex, rows }) =>
    rows.map(([a, b, low, high]) => ({
      analyteId: 'creatinine',
      label: 'Creatinine',
      sex,
      specimens: ['serum', 'plasma'] as Specimen[],
      ageMinDays: a * YEAR,
      ageMaxDays: b * YEAR,
      ageLabel: `${a}y to <${b}y`,
      low,
      high,
      unit: 'µmol/L',
      unitId: 'umol/L',
      notes: ['<19세 구간은 Ortho Vitros enzymatic creatinine 측정법을 쓰는 검사실 전용(원문 각주). 그 외 검사실은 18세부터 성인 구간 적용'],
      sources: ['rcpaTable6', 'aacb2014'] as SourceId[],
      verify: [RCPA_PAGE_NOT_READ],
    })),
  ),
  adult('creatinine', 'Creatinine', 60, 110, 'µmol/L', 'umol/L', {
    sex: 'M',
    ageMaxDays: 60 * YEAR,
    ageLabel: '18y to <60y',
    notes: ['조화 구간은 60세 미만 성인에만 공표됨. 60세 이상은 검사실 재량(원문 각주) — 앱은 외삽하지 않음'],
    verify: [RCPA_PAGE_NOT_READ],
  }),
  adult('creatinine', 'Creatinine', 45, 90, 'µmol/L', 'umol/L', {
    sex: 'F',
    ageMaxDays: 60 * YEAR,
    ageLabel: '18y to <60y',
    notes: ['조화 구간은 60세 미만 성인에만 공표됨. 60세 이상은 검사실 재량(원문 각주) — 앱은 외삽하지 않음'],
    verify: [RCPA_PAGE_NOT_READ],
  }),

  // Calcium
  ...paeds('calcium', 'Calcium', 'mmol/L', 'mmol/L', [
    [0, W1, '0w to <1w', 1.85, 2.8],
    [W1, W26, '1w to <26w', 2.2, 2.8],
    [W26, 2 * YEAR, '26w to <2y', 2.2, 2.7],
    [2 * YEAR, 18 * YEAR, '2y to <18y', 2.2, 2.65],
  ], { verify: [RCPA_PAGE_NOT_READ] }),
  adult('calcium', 'Calcium', 2.1, 2.6, 'mmol/L', 'mmol/L', {
    notes: ['알부민 보정 칼슘의 성인 구간도 2.10–2.60 mmol/L 로 동일하게 공표됨'],
  }),

  // Phosphate — adult interval starts at 20y to align with paediatric bands.
  ...paeds('phosphate', 'Phosphate', 'mmol/L', 'mmol/L', [
    [0, W1, '0w to <1w', 1.25, 2.85],
    [W1, W4, '1w to <4w', 1.5, 2.75],
    [W4, W26, '4w to <26w', 1.45, 2.5],
    [W26, 1 * YEAR, '26w to <1y', 1.3, 2.3],
    [1 * YEAR, 4 * YEAR, '1y to <4y', 1.1, 2.2],
    [4 * YEAR, 15 * YEAR, '4y to <15y', 0.9, 2.0],
    [15 * YEAR, 18 * YEAR, '15y to <18y', 0.8, 1.85],
    [18 * YEAR, 20 * YEAR, '18y to <20y', 0.75, 1.65],
  ], { verify: [RCPA_PAGE_NOT_READ] }),
  adult('phosphate', 'Phosphate', 0.75, 1.5, 'mmol/L', 'mmol/L', {
    ageMinDays: 20 * YEAR,
    ageLabel: '20y to <120y',
    notes: ['성인 구간은 소아 구간과 맞추기 위해 20세부터 시작(원문 각주)'],
  }),

  // Magnesium
  ...paeds('magnesium', 'Magnesium', 'mmol/L', 'mmol/L', [
    [0, W1, '0w to <1w', 0.6, 1.0],
    [W1, 18 * YEAR, '1w to <18y', 0.65, 1.1],
  ], { verify: [RCPA_PAGE_NOT_READ] }),
  adult('magnesium', 'Magnesium', 0.7, 1.1, 'mmol/L', 'mmol/L'),

  // Alkaline phosphatase — adult interval starts at 22y.
  ...paeds('alp', 'Alkaline phosphatase', 'U/L', 'U/L', [
    [0, W1, '0w to <1w', 80, 380],
    [W1, W4, '1w to <4w', 120, 550],
    [W4, W26, '4w to <26w', 120, 650],
    [W26, 2 * YEAR, '26w to <2y', 120, 450],
    [2 * YEAR, 6 * YEAR, '2y to <6y', 120, 370],
    [6 * YEAR, 10 * YEAR, '6y to <10y', 120, 440],
  ], { verify: [RCPA_PAGE_NOT_READ] }),
  ...(
    [
      ['M', 10, 14, 130, 530], ['M', 14, 15, 105, 480], ['M', 15, 17, 80, 380], ['M', 17, 19, 50, 220], ['M', 19, 22, 45, 150],
      ['F', 10, 13, 100, 460], ['F', 13, 14, 70, 330], ['F', 14, 15, 50, 280], ['F', 15, 16, 45, 170], ['F', 16, 22, 35, 140],
    ] as const
  ).map(([sex, a, b, low, high]) => ({
    analyteId: 'alp',
    label: 'Alkaline phosphatase',
    sex,
    specimens: ['serum', 'plasma'] as Specimen[],
    ageMinDays: a * YEAR,
    ageMaxDays: b * YEAR,
    ageLabel: `${a}y to <${b}y`,
    low,
    high,
    unit: 'U/L',
    unitId: 'U/L',
    sources: RCPA_PAEDS,
    verify: [RCPA_PAGE_NOT_READ],
  })),
  adult('alp', 'Alkaline phosphatase', 30, 110, 'U/L', 'U/L', {
    ageMinDays: 22 * YEAR,
    ageLabel: '22y to <120y',
    notes: [
      '성인 구간은 소아 구간과 맞추기 위해 22세부터 시작(원문 각주)',
      'AACB 가 2025-08 초안에서 측정 온도(30→37 °C) 변경에 따른 ALP 구간 개정을 제안함 — 확정 여부 미확인',
    ],
    verify: [RCPA_PAGE_NOT_READ, 'TODO(verify): AACB 2025 ALP 개정 초안이 RCPA Table 6 에 반영되었는지'],
  }),

  // Adult-only analytes (Koerbin 2019 Table 1).
  adult('ld', 'Lactate dehydrogenase [L to P] (IFCC)', 120, 250, 'U/L', 'U/L', {
    notes: ['IFCC lactate→pyruvate 방법 기준'],
    verify: [RCPA_PAGE_NOT_READ],
  }),
  adult('total-protein', 'Total protein', 60, 80, 'g/L', 'g/L', { verify: [RCPA_PAGE_NOT_READ] }),
  adult('bilirubin', 'Total bilirubin', 1, 20, 'µmol/L', 'umol/L', { sources: ['rcpaTable6', 'koerbin2019'], verify: [RCPA_PAGE_NOT_READ] }),
  adult('ck', 'Creatine kinase', 45, 250, 'U/L', 'U/L', {
    sex: 'M',
    ageMaxDays: 60 * YEAR,
    ageLabel: '18y to <60y',
    sources: ['rcpaTable6', 'koerbin2019'],
    verify: [RCPA_PAGE_NOT_READ],
  }),
  adult('ck', 'Creatine kinase', 40, 200, 'U/L', 'U/L', {
    sex: 'M',
    ageMinDays: 60 * YEAR,
    ageLabel: '60y+',
    sources: ['rcpaTable6', 'koerbin2019'],
    verify: [RCPA_PAGE_NOT_READ],
  }),
  adult('ck', 'Creatine kinase', 30, 150, 'U/L', 'U/L', {
    sex: 'F',
    sources: ['rcpaTable6', 'koerbin2019'],
    verify: [
      RCPA_PAGE_NOT_READ,
      'TODO(verify): 원문 표에서 여성 CK 는 나이 구분 없이 한 값만 있음 — 18세 이상 전체에 적용되는지',
    ],
  }),
  ...(
    [
      ['alt', 'Alanine transaminase (no pyridoxal 5-phosphate)', 5, 40, 5, 35],
      ['ast', 'Aspartate transaminase (no pyridoxal 5-phosphate)', 5, 35, 5, 30],
      ['ggt', 'γ-Glutamyl transferase', 5, 50, 5, 35],
    ] as const
  ).flatMap(([id, label, mLow, mHigh, fLow, fHigh]) => [
    adult(id, label, mLow, mHigh, 'U/L', 'U/L', { sex: 'M', sources: ['rcpaTable6', 'koerbin2019'], verify: [RCPA_PAGE_NOT_READ] }),
    adult(id, label, fLow, fHigh, 'U/L', 'U/L', { sex: 'F', sources: ['rcpaTable6', 'koerbin2019'], verify: [RCPA_PAGE_NOT_READ] }),
  ]),
  adult('lipase', 'Serum lipase', 10, 60, 'U/L', 'U/L', {
    specimens: ['serum'],
    sources: ['rcpaTable6', 'koerbin2019'],
    notes: [
      'Siemens Dimension, Ortho Clinical Vitros 측정법은 제외(원문 각주)',
      "원문 환산식: 'Harmonized' = Dimension × 0.21 − 0.6; 'Harmonized' = Vitros × 0.27 + 12",
    ],
  }),
];

// 앱이 참고구간을 제공하지 않는 분석물과 그 이유 (README 의 데이터 공백 표와 같은 내용).
export const NO_INTERVAL_REASON: Record<string, string> = {
  glucose: 'RCPA 조화 구간 표에 없음 — 원문 각주: 공복혈당은 당뇨 진단 결정 한계로 다룸',
  cholesterol: 'RCPA 조화 구간 표에 없음 — 원문 각주: 지질은 호주·뉴질랜드 가이드라인의 결정 한계로 다룸',
  triglycerides: 'RCPA 조화 구간 표에 없음 — 원문 각주: 지질은 결정 한계로 다룸',
  hba1c: 'RCPA 조화 구간 표에 없음',
  urea: 'RCPA 조화 구간 후보(2017)였으나 확정 구간을 확인하지 못함',
  albumin: '측정법(BCG/BCP) 간 편향으로 조화 구간이 확정되지 않음(Koerbin 2019)',
  'uric-acid': 'RCPA 조화 구간 표에서 확인하지 못함',
  iron: 'RCPA 조화 구간 표에서 확인하지 못함',
  hemoglobin: '혈액학 항목 — RCPA 화학병리 Table 6 범위 밖',
  uacr: '참고구간이 아닌 KDIGO 알부민뇨 범주(A1–A3)로 해석',
  upcr: '참고구간이 아닌 KDIGO 단백뇨 범주로 해석',
};
