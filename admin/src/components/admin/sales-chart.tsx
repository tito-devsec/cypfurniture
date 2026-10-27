'use client';

import { useMemo, useState } from 'react';
import type { CommerceSettings } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

type Point = { date: string; orders: number; revenue: number };

const W = 720;
const H = 220;
const PAD = { top: 16, right: 12, bottom: 28, left: 44 };
const fmtDay = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });

function niceMax(max: number) {
  if (max <= 0) return 1;
  const pow = Math.pow(10, Math.floor(Math.log10(max)));
  return Math.ceil(max / pow) * pow;
}

/**
 * Single-series daily revenue bars (last 30 days).
 * One hue, thin rounded marks, recessive grid, hover tooltip, optional table view.
 */
export function SalesChart({ data, commerce }: { data: Point[]; commerce: CommerceSettings }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  const top = useMemo(() => niceMax(Math.max(1, ...data.map((d) => d.revenue))), [data]);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(4, slot - 4);
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const orders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-2xl font-semibold leading-none tracking-tight text-ink">{formatPrice(total, commerce)}</p>
          <p className="mt-1 text-xs text-muted">from {orders} orders in the last 30 days</p>
        </div>
        <button type="button" onClick={() => setTable((v) => !v)} className="text-xs font-medium text-accent hover:underline">
          {table ? 'View chart' : 'View as table'}
        </button>
      </div>

      {table ? (
        <div className="max-h-64 overflow-y-auto rounded-md border border-line">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Date</th>
                <th className="text-right">Orders</th>
                <th className="text-right">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((d) => (
                <tr key={d.date}>
                  <td>{fmtDay(d.date)}</td>
                  <td className="text-right">{d.orders}</td>
                  <td className="text-right">{formatPrice(d.revenue, commerce)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Daily revenue for the last 30 days">
            {[0, 0.5, 1].map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(top * t)} y2={y(top * t)} stroke="var(--color-line)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(top * t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
                  {top * t >= 1000000 ? `${Math.round((top * t) / 100000) / 10}M` : top * t >= 1000 ? `${Math.round((top * t) / 1000)}k` : Math.round(top * t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = PAD.left + i * slot + (slot - barW) / 2;
              const yTop = y(d.revenue);
              const h = Math.max(0, PAD.top + innerH - yTop);
              const r = Math.min(4, barW / 2, h);
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                  {h > 0 ? (
                    <path
                      d={`M${x},${PAD.top + innerH} V${yTop + r} a${r},${r} 0 0 1 ${r},-${r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${PAD.top + innerH} Z`}
                      fill="var(--accent)"
                      opacity={hover === null || hover === i ? 1 : 0.4}
                    />
                  ) : (
                    <rect x={x} y={PAD.top + innerH - 2} width={barW} height={2} fill="var(--color-line-strong)" />
                  )}
                  {(i % 7 === 0 || i === data.length - 1) && (
                    <text x={PAD.left + i * slot + slot / 2} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                      {fmtDay(d.date)}
                    </text>
                  )}
                  <title>{`${fmtDay(d.date)}: ${formatPrice(d.revenue, commerce)} · ${d.orders} orders`}</title>
                </g>
              );
            })}
            <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--color-line-strong)" strokeWidth={1} />
          </svg>
          {hover !== null && data[hover] && <Tooltip index={hover} count={data.length} slot={slot} lines={[fmtDay(data[hover].date), formatPrice(data[hover].revenue, commerce), `${data[hover].orders} ${data[hover].orders === 1 ? 'order' : 'orders'}`]} />}
        </div>
      )}
    </div>
  );
}

/** Single-series line chart of orders per day (last 30 days). */
export function OrdersLineChart({ data }: { data: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const top = useMemo(() => Math.max(1, niceMax(Math.max(0, ...data.map((d) => d.orders)))), [data]);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const x = (i: number) => PAD.left + i * slot + slot / 2;
  const y = (v: number) => PAD.top + innerH - (v / top) * innerH;
  const total = data.reduce((s, d) => s + d.orders, 0);
  const path = data.map((d, i) => `${i === 0 ? 'M' : 'L'}${x(i).toFixed(1)},${y(d.orders).toFixed(1)}`).join(' ');
  const area = data.length ? `${path} L${x(data.length - 1).toFixed(1)},${PAD.top + innerH} L${x(0).toFixed(1)},${PAD.top + innerH} Z` : '';

  return (
    <div>
      <div className="mb-3">
        <p className="text-2xl font-semibold leading-none tracking-tight text-ink">{total}</p>
        <p className="mt-1 text-xs text-muted">orders in the last 30 days</p>
      </div>
      <div className="relative">
        <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Orders per day for the last 30 days">
          {[0, 0.5, 1].map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(top * t)} y2={y(top * t)} stroke="var(--color-line)" strokeWidth={1} />
              <text x={PAD.left - 8} y={y(top * t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
                {Math.round(top * t)}
              </text>
            </g>
          ))}
          {area && <path d={area} fill="var(--accent-2)" opacity={0.12} />}
          {path && <path d={path} fill="none" stroke="var(--accent-2)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />}
          {data.map((d, i) => (
            <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
              <circle cx={x(i)} cy={y(d.orders)} r={hover === i ? 5 : 4} fill="var(--accent-2)" stroke="#fff" strokeWidth={2} />
              {(i % 7 === 0 || i === data.length - 1) && (
                <text x={x(i)} y={H - 8} textAnchor="middle" fontSize={11} fill="var(--color-muted)">
                  {fmtDay(d.date)}
                </text>
              )}
              <title>{`${fmtDay(d.date)}: ${d.orders} ${d.orders === 1 ? 'order' : 'orders'}`}</title>
            </g>
          ))}
          <line x1={PAD.left} x2={W - PAD.right} y1={PAD.top + innerH} y2={PAD.top + innerH} stroke="var(--color-line-strong)" strokeWidth={1} />
        </svg>
        {hover !== null && data[hover] && <Tooltip index={hover} count={data.length} slot={slot} lines={[fmtDay(data[hover].date), `${data[hover].orders} ${data[hover].orders === 1 ? 'order' : 'orders'}`]} />}
      </div>
    </div>
  );
}

function Tooltip({ index, count, slot, lines }: { index: number; count: number; slot: number; lines: string[] }) {
  return (
    <div
      className={cn('pointer-events-none absolute top-2 rounded-md border border-line bg-white px-3 py-2 text-xs shadow-soft')}
      style={{ left: `${((PAD.left + index * slot + slot / 2) / W) * 100}%`, transform: `translateX(${index > count / 2 ? '-100%' : '0'})` }}
    >
      {lines.map((line, i) => (
        <p key={i} className={cn(i === 1 ? 'font-semibold text-ink' : 'text-muted')}>
          {line}
        </p>
      ))}
    </div>
  );
}
