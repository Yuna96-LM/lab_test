# 임상검사 단위 변환 · 참고구간 (lab_test)

**사이트: https://yuna96-lm.github.io/lab_test/**

React + TypeScript + Vite 로 만든 정적 웹앱입니다. GitHub Actions 가 `main` 에 push 될 때마다 테스트·빌드 후 GitHub Pages 로 배포합니다.

> 교육·참고용입니다. 진단에 사용하지 마세요. 결과 해석은 소속 검사실의 참고구간을 우선합니다.

## 기능

### 1. 변환 탭
- 분석물 검색: 영문·한글·동의어 (예: `BUN`, `혈당`, `A1c`, `ACR`)
- 값 · 원본 단위 · 대상 단위 입력 → 결과를 크게 표시하고 바로 아래에 **계산 근거**(방법, 계수, 수식, 계산 과정, 가정, 출처 링크)를 붙여 보여줌
- 원본·대상 단위 스왑(⇄), 결과 복사 버튼
- 근거가 없는 변환은 이유와 함께 거부함. 예: mg/dL→U/L(차원이 다름), 알부민 g/dL→mmol/L(분자량 관례 없음), 인 mmol/L→mEq/L(전하가 pH에 따라 달라짐), 포도당 %→mmol/mol

### 2. 참고구간 탭
- 분석물 + 나이(일/주/개월/세) + 성별 + 검체(혈청/혈장)를 고르면 **공표된 구간만** 그대로 보여줌. 공표된 나이 구간이 없으면 외삽하지 않고 "해당 구간 없음"과 공표된 구간 목록을 표시
- 결과 값을 넣으면(다른 단위로 넣어도 변환 엔진으로 환산) LOW / NORMAL / HIGH 를 판정하고 출처·검체·나이 구간·원문 각주를 함께 표시
- 18세 미만이면 CALIPER(caliperproject.ca)를 안내

## 데이터 출처 (역할별)

| 역할 | 출처 | 앱에서의 사용 |
|---|---|---|
| 변환 엔진 | UCUM (`@lhncbc/ucum-lhc`) | 차원 검사, 스케일 변환, 분자량·전하 기반 질량↔물질량↔당량 변환 |
| 분자량 | IUPAC CIAAW 표준 원자량 | 화학식에서 분자량을 직접 계산 (`src/lib/molarMass.ts`). 변환 계수는 표에서 복사하지 않음 |
| 특수 변환 | NGSP master equation (ngsp.org/ifcc.asp) | HbA1c: `NGSP = 0.09148 × IFCC + 2.152` 와 그 역식 |
| 특수 변환 | KDIGO 2024 CKD 가이드라인 변환표 | uACR·uPCR mg/g ↔ mg/mmol (크레아티닌 분자량으로 계산하고 KDIGO 계수 0.113 과 대조) |
| 특수 변환 | (관례, 가정으로 표시) | BUN ↔ 요소: 요소 1 mol = 질소 2 mol / 중성지방: triolein(C57H104O6) 분자량 |
| 참고구간 | RCPA Harmonised Reference Intervals Table 6 | 아래 "데이터 공백" 참고 |
| 소아 안내 | CALIPER | 링크로 안내만 함 (수치는 앱에 없음) |
| 교차 검증 전용 | Labcorp SI Unit Conversion Table, NBME Laboratory Reference Values, KDIGO 변환표 | `src/lib/crossval.test.ts` 에서만 사용. 앱 코드에는 없음 |

## 개발

```bash
npm ci
npm test        # Vitest: 변환 엔진, 참고구간 조회, 교차 검증
npm run dev
npm run build   # tsc + vite build → dist/
```

## 데이터 공백과 확인하지 못한 사항

억지로 채우지 않고 비워 둔 항목입니다.

| 항목 | 상태 | 이유 |
|---|---|---|
| RCPA Table 6 원문 페이지 | **TODO(verify)** | rcpa.edu.au 가 Cloudflare 봇 차단으로 자동 접근(curl, 헤드리스 브라우저, 웹 아카이브)을 모두 막음. 그래서 RCPA 가 승인한 같은 표를 실은 문헌 **Tate 2014 Clin Biochem Rev Table 1·2** 와 **Koerbin 2019 CCLM Table 1** 에서 값을 옮김. 웹 검색 스니펫으로 RCPA 페이지와 일치가 확인된 행: 나트륨, 칼륨(소아 혈청·혈장, 성인), 염화물, 중탄산염(성인), 칼슘(성인), 마그네슘(성인), 인(20세 이상, 0일–1주 미만), 리파아제. 나머지 행에는 앱에서 "확인 필요" 표시가 붙음 |
| ALP 성인 구간 | TODO(verify) | AACB 가 2025-08 초안에서 측정 온도 변경(30→37 °C)에 따른 개정을 제안함. RCPA Table 6 에 반영되었는지 확인하지 못함 |
| CK 여성 구간의 나이 구분 | TODO(verify) | 원문 표에 남성은 <60 / 60+ 로 나뉘고 여성은 한 값(30–150 U/L)만 있음. 앱은 18세 이상 여성 전체에 적용 |
| 성인 혈장 칼륨 별도 구간 | 없음 | 원문 각주: 성인 3.5–5.2 를 혈청·혈장 모두에 사용, 헤파린 혈장만 쓰는 검사실은 더 낮은 구간 선택 가능. 별도 수치는 공표되지 않음 |
| 60세 이상 크레아티닌 | 없음 (외삽 안 함) | 조화 구간은 60세 미만 성인에만 공표됨 |
| ALT·AST·GGT·LD·총단백·총빌리루빈·CK·리파아제의 소아 구간 | 없음 | RCPA 조화 소아 구간이 없음 → CALIPER 안내 |
| 포도당·지질·HbA1c 참고구간 | 없음 | 조화 구간 표에 없음. 원문 각주: 지질·공복혈당은 결정 한계(decision limit)로 다룸 |
| 요소·알부민 참고구간 | 없음 | 2017 년 조화 후보였으나 확정 구간을 확인하지 못함. 알부민은 BCG/BCP 측정법 간 편향 때문에 보류됨(Koerbin 2019) |
| 요산·철·혈색소 참고구간 | 없음 | RCPA 화학병리 조화 구간 표에서 확인하지 못함 (혈색소는 혈액학 항목) |
| CMEinfo 변환표 PDF | 교차 검증 못함 (`it.todo`) | cmeinfo.com 사이트맵과 웹 검색에서 해당 PDF 를 찾지 못함 |
| 앱 → RCPA 링크 | TODO(verify) | 링크 URL 은 웹 검색 결과에서 확인했으나 페이지 본문은 직접 열지 못함 |

교차 검증에서 발견한 출처 쪽 불일치(앱 버그 아님, 테스트에 기록):
- NBME 표는 마그네슘을 "1.5–2.0 mg/dL = 0.75–1.0 mmol/L" 로 적음. 이 숫자는 mEq/L 일 때만 맞음 (1.5 mg/dL = 0.617 mmol/L)
- NBME 표의 포도당 70 mg/dL = 3.8 mmol/L 는 버림 처리된 값 (계산값 3.885)
- KDIGO 2024 변환표는 크레아티닌 88.4 의 SI 단위를 "mmol/l" 로 적었으나 µmol/L 이 맞음
