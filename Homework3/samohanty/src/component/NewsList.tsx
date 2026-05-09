import { useEffect, useState } from 'react';

type NewsItem = {
  filename: string;
  title: string;
  date: string;
  url: string;
  content: string;
};

type Props = {
  ticker: string;
  /**
   * If provided and toggled, the first news item will be auto-expanded
   * to satisfy the "selecting in dropdown expands corresponding news" bonus.
   */
  expandTrigger?: number;
};

export default function NewsList({ ticker, expandTrigger }: Props) {
  const [news, setNews] = useState<NewsItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSet, setOpenSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    setNews(null);
    setError(null);
    setOpenSet(new Set());

    const url = `${import.meta.env.BASE_URL}data/stocknews/${ticker}.json`;
    fetch(url)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((rows: NewsItem[]) => {
        if (cancelled) return;
        setNews(rows);
      })
      .catch((err) => {
        if (!cancelled) setError(`Failed to load news: ${err.message}`);
      });

    return () => { cancelled = true; };
  }, [ticker]);

  // Auto-expand the most recent news on a fresh selection (bonus linking).
  useEffect(() => {
    if (expandTrigger === undefined) return;
    if (!news || news.length === 0) return;
    setOpenSet(new Set([news[0].filename]));
  }, [expandTrigger, news]);

  const toggle = (id: string) => {
    setOpenSet((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm text-slate-700">
          <span className="font-semibold">News for {ticker}</span>
          <span className="ml-2 text-slate-500">
            {news ? `${news.length} articles` : 'loading…'}
          </span>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto border border-slate-200 rounded bg-white">
        {error ? (
          <div className="p-4 text-sm text-red-600">{error}</div>
        ) : !news ? (
          <div className="p-4 text-sm text-slate-500">Loading news…</div>
        ) : news.length === 0 ? (
          <div className="p-4 text-sm text-slate-500">No news available.</div>
        ) : (
          <ul className="divide-y divide-slate-200">
            {news.map((item) => {
              const open = openSet.has(item.filename);
              return (
                <li key={item.filename} className="p-3 hover:bg-slate-50">
                  <button
                    type="button"
                    onClick={() => toggle(item.filename)}
                    className="w-full text-left flex items-start gap-2"
                  >
                    <span
                      className={`mt-1 inline-block w-2 h-2 rounded-full transition ${
                        open ? 'bg-emerald-500' : 'bg-slate-300'
                      }`}
                    />
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-800 leading-snug">
                        {item.title || '(untitled)'}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">{item.date}</div>
                    </div>
                    <span className="text-slate-400 text-xs select-none">
                      {open ? '▾' : '▸'}
                    </span>
                  </button>
                  {open && (
                    <div className="mt-2 pl-4 border-l-2 border-emerald-500/40 text-sm text-slate-700 whitespace-pre-line leading-relaxed">
                      {item.content || '(no content)'}
                      {item.url && (
                        <div className="mt-2">
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-emerald-700 underline hover:text-emerald-800"
                          >
                            Open original article ↗
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
