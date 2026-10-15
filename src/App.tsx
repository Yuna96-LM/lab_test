import { useState } from 'react';
import { ConvertTab } from './components/ConvertTab';
import { ReferenceTab } from './components/ReferenceTab';

type Tab = 'convert' | 'reference';

export default function App() {
  const [tab, setTab] = useState<Tab>('convert');
  return (
    <div className="app">
      <header>
        <h1>임상검사 단위 변환 · 참고구간</h1>
        <p className="muted small">
          변환 계수는 표에서 복사하지 않고 UCUM + IUPAC 원자량으로 계산합니다. 교육·참고용이며 진단 목적이 아닙니다.
        </p>
      </header>
      <nav className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === 'convert'} className={tab === 'convert' ? 'tab active' : 'tab'} onClick={() => setTab('convert')}>
          변환
        </button>
        <button role="tab" aria-selected={tab === 'reference'} className={tab === 'reference' ? 'tab active' : 'tab'} onClick={() => setTab('reference')}>
          참고구간
        </button>
      </nav>
      <main>{tab === 'convert' ? <ConvertTab /> : <ReferenceTab />}</main>
      <footer className="muted small">
        출처: UCUM · IUPAC CIAAW · NGSP · KDIGO 2024 · RCPA Harmonised Reference Intervals (Table 6) · CALIPER
      </footer>
    </div>
  );
}
