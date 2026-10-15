import { useMemo, useState } from 'react';
import { ANALYTES, OTHER_UNITS, findUnit, type Analyte } from '../data/analytes';
import { convert, fmt } from '../lib/convert';
import { AnalytePicker } from './AnalytePicker';

function UnitSelect({ id, label, analyte, value, onChange }: {
  id: string;
  label: string;
  analyte: Analyte;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        <optgroup label={`${analyte.ko} 보고 단위`}>
          {analyte.units.map((u) => (
            <option key={u.id} value={u.id}>{u.label}</option>
          ))}
        </optgroup>
        <optgroup label="기타 단위 (근거 검사용)">
          {OTHER_UNITS.map((u) => (
            <option key={u.id} value={u.id}>{u.label}</option>
          ))}
        </optgroup>
      </select>
    </div>
  );
}

export function ConvertTab() {
  const [analyte, setAnalyte] = useState<Analyte>(ANALYTES[0]);
  const [raw, setRaw] = useState('100');
  const [from, setFrom] = useState(ANALYTES[0].units[0].id);
  const [to, setTo] = useState(ANALYTES[0].units[1].id);
  const [copied, setCopied] = useState(false);

  const pick = (a: Analyte) => {
    setAnalyte(a);
    setFrom(a.units[0].id);
    setTo(a.units[1]?.id ?? a.units[0].id);
  };

  const value = raw.trim() === '' ? Number.NaN : Number(raw.replace(',', '.'));
  const result = useMemo(() => convert(analyte.id, value, from, to), [analyte.id, value, from, to]);
  const toUnit = findUnit(analyte, to);
  const fromUnit = findUnit(analyte, from);

  const swap = () => {
    if (result.ok) setRaw(fmt(result.value, 6));
    setFrom(to);
    setTo(from);
  };

  const resultText = result.ok ? `${fmt(result.value, 4)} ${toUnit?.label ?? ''}` : '';
  const copy = async () => {
    if (!result.ok) return;
    const text = `${analyte.en}: ${raw} ${fromUnit?.label} = ${resultText}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt('복사할 텍스트', text);
    }
  };

  return (
    <section aria-labelledby="convert-heading">
      <h2 id="convert-heading" className="sr-only">단위 변환</h2>
      <AnalytePicker value={analyte} onChange={pick} />

      <div className="row">
        <div className="field">
          <label htmlFor="value">값</label>
          <input id="value" inputMode="decimal" value={raw} onChange={(e) => setRaw(e.target.value)} />
        </div>
        <UnitSelect id="from" label="원본 단위" analyte={analyte} value={from} onChange={setFrom} />
        <button type="button" className="icon-btn" onClick={swap} aria-label="원본·대상 단위 바꾸기" title="양방향 스왑">
          ⇄
        </button>
        <UnitSelect id="to" label="대상 단위" analyte={analyte} value={to} onChange={setTo} />
      </div>

      {result.ok ? (
        <div className="result" aria-live="polite">
          <div className="result-main">
            <span className="big">{fmt(result.value, 4)}</span>
            <span className="unit">{toUnit?.label}</span>
            <button type="button" className="copy-btn" onClick={copy}>{copied ? '복사됨' : '복사'}</button>
          </div>
          <div className="muted small">정밀값: {fmt(result.value, 10)}</div>

          <div className="basis">
            <h3>계산 근거</h3>
            <dl>
              <dt>방법</dt>
              <dd>{result.method}</dd>
              {result.factor !== undefined && (
                <>
                  <dt>계수</dt>
                  <dd><code>{fmt(result.factor, 6)}</code></dd>
                </>
              )}
              <dt>수식</dt>
              <dd><code>{result.formula}</code></dd>
              <dt>계산 과정</dt>
              <dd>
                <ol>
                  {result.steps.map((s) => <li key={s}>{s}</li>)}
                </ol>
              </dd>
              {result.assumptions.length > 0 && (
                <>
                  <dt>가정</dt>
                  <dd>
                    <ul>
                      {result.assumptions.map((s) => <li key={s}>{s}</li>)}
                    </ul>
                  </dd>
                </>
              )}
              <dt>출처</dt>
              <dd>
                <ul>
                  {result.sources.map((s) => (
                    <li key={s.id}>
                      <a href={s.url} target="_blank" rel="noreferrer">{s.title}</a>
                      {s.note && <span className="muted"> — {s.note}</span>}
                    </li>
                  ))}
                </ul>
              </dd>
            </dl>
          </div>
        </div>
      ) : (
        <div className="result rejected" role="alert">
          <strong>변환 거부</strong>
          <p>{result.reason}</p>
          {result.detail && <p className="muted">{result.detail}</p>}
        </div>
      )}
    </section>
  );
}
