import { useEffect, useId, useMemo, useRef, useState } from 'react';
import './Chart.css';

// Dependency-free SVG chart: line/area or bars, with gridlines, an optional reference line and a
// hover readout. The SVG is drawn at its container's measured pixel width so text never stretches.

const PAD = { top: 14, right: 12, bottom: 24, left: 40 };

function niceMax(v) {
  if (v <= 0) return 1;
  const mag = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / mag;
  const step = [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s);
  return step * mag;
}

export default function Chart({
  values,
  height = 180,
  type = 'area',
  color = 'var(--accent)',
  yMax,
  reference,
  referenceLabel,
  formatY = (v) => String(Math.round(v)),
  formatX = (i) => String(i + 1),
  xLabel,
  highlight,
}) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const wrapRef = useRef(null);
  const [W, setW] = useState(600);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return undefined;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(200, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const n = values.length;
  const innerW = W - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const max = useMemo(() => yMax ?? niceMax(Math.max(...values, reference ?? 0, 0) * 1.1), [values, yMax, reference]);
  const x = (i) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v) => PAD.top + innerH - (Math.max(0, v) / max) * innerH;
  const barW = n ? (innerW / n) * 0.68 : 0;
  const barX = (i) => PAD.left + (i + 0.5) * (innerW / n) - barW / 2;

  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max);
  const linePath = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const areaPath = n ? `${linePath} L${x(n - 1)},${PAD.top + innerH} L${x(0)},${PAD.top + innerH} Z` : '';
  const labelEvery = Math.max(1, Math.ceil(n / Math.max(3, Math.floor(innerW / 60))));

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * W;
    let i;
    if (type === 'bar') i = Math.floor(((px - PAD.left) / innerW) * n);
    else i = Math.round(((px - PAD.left) / innerW) * (n - 1));
    setHover(i >= 0 && i < n ? i : null);
  };

  if (!n) {
    return (
      <div className="chart" ref={wrapRef}>
        <div className="chart-empty">No data yet</div>
      </div>
    );
  }

  return (
    <div className="chart" ref={wrapRef}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width={W}
        height={height}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
      >
        <defs>
          <linearGradient id={`g${id}`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} className="chart-grid" />
            <text x={PAD.left - 8} y={y(t) + 3.5} className="chart-axis" textAnchor="end">
              {formatY(t)}
            </text>
          </g>
        ))}

        {type === 'bar' ? (
          values.map((v, i) => (
            <rect
              key={i}
              x={barX(i)}
              y={y(v)}
              width={barW}
              height={PAD.top + innerH - y(v)}
              rx={Math.min(4, barW / 4)}
              fill={highlight?.(v, i) ?? color}
              opacity={hover == null || hover === i ? 1 : 0.45}
            />
          ))
        ) : (
          <>
            <path d={areaPath} fill={`url(#g${id})`} />
            <path d={linePath} fill="none" stroke={color} strokeWidth="2.2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          </>
        )}

        {reference != null && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(reference)} y2={y(reference)} className="chart-ref" />
            {referenceLabel && (
              <text x={W - PAD.right} y={y(reference) - 5} className="chart-ref-label" textAnchor="end">
                {referenceLabel}
              </text>
            )}
          </g>
        )}

        {values.map((_, i) =>
          i % labelEvery === 0 || i === n - 1 ? (
            <text key={i} x={type === 'bar' ? barX(i) + barW / 2 : x(i)} y={height - 6} className="chart-axis" textAnchor="middle">
              {formatX(i)}
            </text>
          ) : null,
        )}

        {hover != null && type !== 'bar' && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} className="chart-cursor" />
            <circle cx={x(hover)} cy={y(values[hover])} r="4" fill={color} stroke="var(--bg)" strokeWidth="2" />
          </g>
        )}
      </svg>
      {hover != null && (
        <div
          className="chart-tip"
          style={{ left: `${((type === 'bar' ? barX(hover) + barW / 2 : x(hover)) / W) * 100}%` }}
        >
          <span className="muted">
            {xLabel ? `${xLabel} ` : ''}
            {formatX(hover)}
          </span>
          <b>{formatY(values[hover])}</b>
        </div>
      )}
    </div>
  );
}
