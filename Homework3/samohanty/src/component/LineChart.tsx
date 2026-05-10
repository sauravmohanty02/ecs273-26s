import { useEffect, useMemo, useRef, useState } from 'react';
import * as d3 from 'd3';

type Row = {
  Date: Date;
  Open: number;
  High: number;
  Low: number;
  Close: number;
  Volume: number;
};

type Props = { ticker: string };

const SERIES: { key: keyof Row; label: string; color: string }[] = [
  { key: 'Open', label: 'Open', color: '#2563eb' },
  { key: 'High', label: 'High', color: '#10b981' },
  { key: 'Low', label: 'Low', color: '#ef4444' },
  { key: 'Close', label: 'Close', color: '#f59e0b' },
];

const Y_AXIS_WIDTH = 56;
const RIGHT_PAD = 16;
const TOP_PAD = 16;
const BOTTOM_PAD = 32;

export default function LineChart({ ticker }: Props) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const chartSvgRef = useRef<SVGSVGElement | null>(null);
  const yAxisSvgRef = useRef<SVGSVGElement | null>(null);

  const [data, setData] = useState<Row[] | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [viewportWidth, setViewportWidth] = useState<number>(600);
  const [viewportHeight, setViewportHeight] = useState<number>(300);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setZoom(1);

    d3.csv(`${import.meta.env.BASE_URL}data/stockdata/${ticker}.csv`, (raw) => {
      const dateStr = (raw.Date ?? '').toString().slice(0, 10);
      return {
        Date: new Date(dateStr),
        Open: +raw.Open!,
        High: +raw.High!,
        Low: +raw.Low!,
        Close: +raw.Close!,
        Volume: +raw.Volume!,
      } as Row;
    }).then((rows) => {
      if (cancelled) return;
      setData(rows.filter((r) => !Number.isNaN(r.Open)).sort((a, b) => +a.Date - +b.Date));
    });

    return () => { cancelled = true; };
  }, [ticker]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setViewportWidth(Math.max(280, rect.width));
      setViewportHeight(Math.max(200, rect.height));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const yExtent = useMemo<[number, number] | null>(() => {
    if (!data || !data.length) return null;
    let lo = Infinity, hi = -Infinity;
    for (const r of data) {
      lo = Math.min(lo, r.Open, r.High, r.Low, r.Close);
      hi = Math.max(hi, r.Open, r.High, r.Low, r.Close);
    }
    const pad = (hi - lo) * 0.05 || 1;
    return [lo - pad, hi + pad];
  }, [data]);

  const xExtent = useMemo<[Date, Date] | null>(() => {
    if (!data || !data.length) return null;
    return [data[0].Date, data[data.length - 1].Date];
  }, [data]);

  useEffect(() => {
    if (!data || !yExtent || !xExtent || !chartSvgRef.current || !yAxisSvgRef.current) return;

    const totalWidth = Math.max(viewportWidth, viewportWidth * zoom);
    const innerWidth = totalWidth - RIGHT_PAD;
    const innerHeight = viewportHeight - TOP_PAD - BOTTOM_PAD;

    const chartSvg = d3.select(chartSvgRef.current);
    chartSvg.selectAll('*').remove();
    chartSvg.attr('width', totalWidth).attr('height', viewportHeight);

    const g = chartSvg.append('g').attr('transform', `translate(0,${TOP_PAD})`);

    const x = d3.scaleTime().domain(xExtent).range([0, innerWidth]);
    const y = d3.scaleLinear().domain(yExtent).range([innerHeight, 0]).nice();

    const xAxisG = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(Math.max(4, Math.floor(innerWidth / 90))).tickFormat((d) => d3.timeFormat('%b %Y')(d as Date)));
    xAxisG.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
    xAxisG.selectAll('path,line').attr('stroke', '#9ca3af');

    g.append('text')
      .attr('x', innerWidth / 2).attr('y', innerHeight + 28)
      .attr('text-anchor', 'middle').attr('fill', '#374151').style('font-size', '11px')
      .text('Date');

    for (const s of SERIES) {
      const line = d3.line<Row>().x((d) => x(d.Date)).y((d) => y(d[s.key] as number)).curve(d3.curveMonotoneX);
      g.append('path').datum(data).attr('fill', 'none').attr('stroke', s.color).attr('stroke-width', 1.5).attr('d', line);
    }

    const yaxSvg = d3.select(yAxisSvgRef.current);
    yaxSvg.selectAll('*').remove();
    yaxSvg.attr('width', Y_AXIS_WIDTH).attr('height', viewportHeight);
    const yg = yaxSvg.append('g').attr('transform', `translate(${Y_AXIS_WIDTH},${TOP_PAD})`);
    const yAxisG = yg.call(d3.axisLeft(y).ticks(6).tickFormat((d) => `$${d}`));
    yAxisG.selectAll('text').attr('fill', '#374151').style('font-size', '11px');
    yAxisG.selectAll('path,line').attr('stroke', '#9ca3af');

    yaxSvg.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -(TOP_PAD + innerHeight / 2)).attr('y', 14)
      .attr('text-anchor', 'middle').attr('fill', '#374151').style('font-size', '11px')
      .text('Price (USD)');
  }, [data, yExtent, xExtent, viewportWidth, viewportHeight, zoom]);

  return (
    <div className="relative w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-semibold text-slate-700">{ticker}</div>
        <div className="flex items-center gap-2 text-xs text-slate-600">
          <span>Zoom</span>
          <input
            type="range" min={1} max={6} step={0.25} value={zoom}
            onChange={(e) => setZoom(parseFloat(e.target.value))}
            className="w-32"
          />
        </div>
      </div>

      <div className="flex-1 min-h-[200px] border border-slate-200 rounded bg-white overflow-hidden flex">
        {!data ? (
          <div className="p-4 text-sm text-slate-500">Loading…</div>
        ) : (
          <>
            <svg ref={yAxisSvgRef} className="block flex-shrink-0" style={{ width: Y_AXIS_WIDTH }} />
            <div ref={scrollRef} className="flex-1 overflow-x-auto overflow-y-hidden">
              <svg ref={chartSvgRef} className="block" />
            </div>
          </>
        )}
      </div>

      <div className="mt-2 flex items-center gap-4 text-xs text-slate-600">
        {SERIES.map((s) => (
          <div key={s.key} className="flex items-center gap-1.5">
            <span className="inline-block w-3 h-0.5" style={{ background: s.color }} />
            <span>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}