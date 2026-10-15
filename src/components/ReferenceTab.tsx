import { useState } from 'react';
import { ANALYTES, type Analyte } from '../data/analytes';
import { NO_INTERVAL_REASON, YEAR, type Specimen } from '../data/referenceIntervals';
import { SOURCES } from '../data/sources';
import { convert, fmt } from '../lib/convert';
import { ageToDays, classify, coverage, hasAnyInterval, lookupIntervals, type AgeUnit, type Flag } from '../lib/referenceLookup';
import { AnalytePicker } from './AnalytePicker';

const FLAG_LABEL: Record<Flag, string> = { low: 'LOW (낮음)', normal: 'NORMAL (참고구간 내)', high: 'HIGH (높음)' };

export function ReferenceTab() {
  const [analyte, setAnalyte] = useState<Analyte>(ANALYTES.find((a) => a.id === 'sodium')!);
  const [age, setAge] = useState('40');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('years');
  const [sex, setSex] = useState<'M' | 'F'>('M');
  const [specimen, setSpecimen] = useState<Specimen>('serum');
  const [raw, setRaw] = useState('');
  const [resultUnit, setResultUnit] = useState<string | null>(null);

  const ageNum = Number(age);
  const ageValid = age.trim() !== '' && Number.isFinite(ageNum) && ageNum >= 0;
  const ageDays = ageValid ? ageToDays(ageNum, ageUnit) : Number.NaN;
  const rows = ageValid ? lookupIntervals({ analyteId: analyte.id, ageDays, sex, specimen }) : [];
  const published = hasAnyInterval(analyte.id);
  const isChild = ageValid && ageDays < 18 * YEAR;

  const pick = (a: Analyte) => {
    setAnalyte(a);
    setResultUnit(null);
  };

  const value = raw.trim() === '' ? Number.NaN : Number(raw.replace(',', '.'));
  const unitId = resultUnit ?? rows[0]?.unitId ?? analyte.units[0].id;

  return (
    <section aria-labelledby="ri-heading">
      <h2 id="ri-heading" className="sr-only">참고구간</h2>
      <AnalytePicker value={analyte} onChange={pick} />

      <div className="row">
        <div className="field">
          <label htmlFor="age">나이</label>
          <div className="inline">
            <input id="age" inputMode="decimal" value={age} onChange={(e) => setAge(e.target.value)} />
            <select aria-label="나이 단위" value={ageUnit} onChange={(e) => setAgeUnit(e.target.value as AgeUnit)}>
              <option value="days">일</option>
              <option value="weeks">주</option>
              <option value="months">개월</option>
              <option value="years">세</option>
            </select>
          </div>
        </div>
        <div className="field">
          <label htmlFor="sex">성별</label>
          <select id="sex" value={sex} onChange={(e) => setSex(e.target.value as 'M' | 'F')}>
            <option value="M">남</option>
            <option value="F">여</option>
          </select>
        </div>
        <div className="field">
          <label htmlFor="specimen">검체</label>
          <select id="specimen" value={specimen} onChange={(e) => setSpecimen(e.target.value as Specimen)}>
            <option value="serum">혈청 (serum)</option>
            <option value="plasma">혈장 (plasma)</option>
          </select>
        </div>
      </div>

      {!ageValid && <div className="result rejected">나이를 0 이상의 숫자로 입력하세요.</div>}

      {ageValid && !published && (
        <div className="result rejected">
          <strong>공표된 참고구간 없음</strong>
          <p>{NO_INTERVAL_REASON[analyte.id] ?? 'RCPA 조화 참고구간 표에서 확인하지 못함'}</p>
        </div>
      )}

      {ageValid && published && rows.length === 0 && (
        <div className="result rejected">
          <strong>이 조건에 해당하는 공표 구간이 없습니다 (외삽하지 않음)</strong>
          <p className="muted">
            공표된 나이 구간 ({sex === 'M' ? '남' : '여'}, {specimen}):{' '}
            {coverage(analyte.id, sex, specimen).join(', ') || '없음'}
          </p>
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="row">
            <div className="field">
              <label htmlFor="ri-value">결과 값 (선택)</label>
              <input id="ri-value" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} placeholder="예: 142" />
            </div>
            <div className="field">
              <label htmlFor="ri-unit">결과 단위</label>
              <select id="ri-unit" value={unitId} onChange={(e) => setResultUnit(e.target.value)}>
                {analyte.units.map((u) => (
                  <option key={u.id} value={u.id}>{u.label}</option>
                ))}
              </select>
            </div>
          </div>

          {rows.map((r) => {
            const conv = Number.isFinite(value) ? convert(analyte.id, value, unitId, r.unitId) : null;
            const flag = conv?.ok ? classify(conv.value, r) : null;
            return (
              <div key={`${r.label}-${r.ageLabel}-${r.sex}`} className="result">
                <div className="ri-head">
                  <span className="ri-label">{r.label}</span>
                  <span className="big">
                    {r.low ?? '–'}–{r.high ?? '–'}
                  </span>
                  <span className="unit">{r.unit}</span>
                </div>
                {flag && conv?.ok && (
                  <div className={`flag flag-${flag}`}>
                    {FLAG_LABEL[flag]} — {fmt(conv.value, 4)} {r.unit}
                    {unitId !== r.unitId && <span className="muted small"> (입력값을 {r.unit} 로 변환: × {fmt(conv.factor!, 6)})</span>}
                  </div>
                )}
                {conv && !conv.ok && <div className="flag flag-error">판정 불가: {conv.reason}</div>}
                <dl className="meta">
                  <dt>나이 구간</dt>
                  <dd>{r.ageLabel}</dd>
                  <dt>성별</dt>
                  <dd>{r.sex === 'any' ? '공통' : r.sex === 'M' ? '남' : '여'}</dd>
                  <dt>검체</dt>
                  <dd>{r.specimens.join(', ')}</dd>
                  <dt>출처</dt>
                  <dd>
                    <ul>
                      {r.sources.map((id) => (
                        <li key={id}>
                          <a href={SOURCES[id].url} target="_blank" rel="noreferrer">{SOURCES[id].title}</a>
                        </li>
                      ))}
                    </ul>
                  </dd>
                  {r.notes && (
                    <>
                      <dt>원문 주석</dt>
                      <dd>
                        <ul>{r.notes.map((n) => <li key={n}>{n}</li>)}</ul>
                      </dd>
                    </>
                  )}
                  {r.verify && (
                    <>
                      <dt>확인 필요</dt>
                      <dd>
                        <ul className="verify">{r.verify.map((n) => <li key={n}>{n}</li>)}</ul>
                      </dd>
                    </>
                  )}
                </dl>
              </div>
            );
          })}
        </>
      )}

      {isChild && (
        <aside className="note">
          <strong>소아·청소년</strong>: 이 앱은 RCPA 조화 구간 중 공표된 소아 구간만 보여줍니다. 더 세분화된 나이·성별별
          소아 참고구간은{' '}
          <a href={SOURCES.caliper.url} target="_blank" rel="noreferrer">CALIPER 데이터베이스</a>를 참고하세요
          (측정 플랫폼별 구간이므로 검사실 장비에 맞는 값을 선택해야 함).
        </aside>
      )}

      <aside className="note small">
        참고구간은 측정법·검사실에 따라 다릅니다. RCPA 조화 구간은 JCTLM 등재 참조물질·방법에 소급되는 측정법을 쓰는
        검사실용입니다. 결과 해석은 소속 검사실의 참고구간을 우선하세요.
      </aside>
    </section>
  );
}
