// 앱에 표시되는 출처 목록. 교차 검증 전용 출처(Labcorp, NBME, CMEinfo)는
// 앱에 넣지 않고 src/lib/crossval.test.ts 에서만 사용한다.

export interface Source {
  id: string;
  title: string;
  url: string;
  note?: string;
}

export const SOURCES = {
  ucum: {
    id: 'ucum',
    title: 'UCUM (Unified Code for Units of Measure) — @lhncbc/ucum-lhc',
    url: 'https://ucum.org/',
    note: '차원 검사·스케일 변환·분자량/전하 기반 질량↔물질량 변환',
  },
  iupac: {
    id: 'iupac',
    title: 'IUPAC CIAAW — Standard atomic weights (abridged / conventional values)',
    url: 'https://www.ciaaw.org/atomic-weights.htm',
    note: '분자량은 이 원자량으로 화학식에서 직접 계산',
  },
  ngsp: {
    id: 'ngsp',
    title: 'NGSP — IFCC Standardization of HbA1c (master equation)',
    url: 'https://ngsp.org/ifcc.asp',
    note: 'NGSP = [0.09148 × IFCC] + 2.152',
  },
  kdigo2024: {
    id: 'kdigo2024',
    title: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation and Management of CKD — Conversion factors (Kidney Int 2024;105(4S):S126)',
    url: 'https://kdigo.org/guidelines/ckd-evaluation-and-management/',
    note: 'ACR·PCR: mg/g × 0.113 = mg/mmol',
  },
  rcpaTable6: {
    id: 'rcpaTable6',
    title: 'RCPA Manual — Table 6: Harmonised reference intervals for chemical pathology',
    url: 'https://www.rcpa.edu.au/Manuals/RCPA-Manual/General-Information/IG/Table-6-Harmonised-reference-intervals-for-chem',
  },
  aacb2014: {
    id: 'aacb2014',
    title: 'Tate JR et al. Harmonising adult and paediatric reference intervals in Australia and New Zealand. Clin Biochem Rev 2014;35:213–35 (Table 1·2)',
    url: 'https://www.aacb.asn.au/common/Uploaded%20files/aacb/guidelines%20and%20position%20statements/position%20statements/supporting%20documentation/20200211%20GPS%20Adult%20and%20paediatric%20common%20reference%20intervals%20for%20a%20first%20panel%20.pdf',
  },
  koerbin2019: {
    id: 'koerbin2019',
    title: 'Koerbin G et al. An update report on the harmonization of adult reference intervals in Australasia. Clin Chem Lab Med 2019;57(1):38–41 (Table 1)',
    url: 'https://doi.org/10.1515/cclm-2017-0920',
  },
  caliper: {
    id: 'caliper',
    title: 'CALIPER — Canadian Laboratory Initiative on Pediatric Reference Intervals',
    url: 'https://caliperproject.ca',
    note: '소아·청소년 참고구간 데이터베이스 (앱에는 수치를 넣지 않고 안내만 함)',
  },
} satisfies Record<string, Source>;

export type SourceId = keyof typeof SOURCES;
