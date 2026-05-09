import { useState } from 'react';
import StockOption from './component/option';
import LineChart from './component/LineChart';

export default function App() {
  const [selected, setSelected] = useState<string>('AAPL');

  return (
    <div className="h-full w-full flex flex-col">
      <header className="bg-slate-900 text-slate-100 px-6 py-3 flex items-center justify-between">
        <div className="text-base font-semibold">Homework 3 · Stock Explorer</div>
        <StockOption value={selected} onChange={setSelected} />
      </header>

      <main className="flex-1 min-h-0 p-4 grid grid-cols-12 gap-4">
        <section className="col-span-12 lg:col-span-7 bg-white rounded border border-slate-200 p-3 flex flex-col min-h-[320px] lg:min-h-0">
          <LineChart ticker={selected} />
        </section>

        <section className="col-span-12 lg:col-span-5 lg:row-span-2 bg-white rounded border border-slate-200 p-3 flex items-center justify-center text-slate-400 min-h-[320px] lg:min-h-0">
          View 3 (news) — coming next
        </section>

        <section className="col-span-12 lg:col-span-7 bg-white rounded border border-slate-200 p-3 flex items-center justify-center text-slate-400 min-h-[320px] lg:min-h-0">
          View 2 (t-SNE) — coming next
        </section>
      </main>
    </div>
  );
}