import { useMemo, useState } from 'react';
import { searchAnalytes, type Analyte } from '../data/analytes';

interface Props {
  value: Analyte;
  onChange: (a: Analyte) => void;
  filter?: (a: Analyte) => boolean;
}

export function AnalytePicker({ value, onChange, filter }: Props) {
  const [query, setQuery] = useState('');
  const matches = useMemo(
    () => searchAnalytes(query).filter((a) => (filter ? filter(a) : true)),
    [query, filter],
  );

  return (
    <div className="field">
      <label htmlFor="analyte-search">분석물 검색 (영문·한글·동의어)</label>
      <input
        id="analyte-search"
        type="search"
        placeholder="예: glucose, 혈당, BUN, A1c, ACR"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="chips" role="listbox" aria-label="분석물">
        {matches.length === 0 && <span className="muted">일치하는 분석물이 없습니다.</span>}
        {matches.map((a) => (
          <button
            key={a.id}
            type="button"
            role="option"
            aria-selected={a.id === value.id}
            className={a.id === value.id ? 'chip active' : 'chip'}
            onClick={() => onChange(a)}
          >
            {a.ko} <span className="muted">{a.en}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
