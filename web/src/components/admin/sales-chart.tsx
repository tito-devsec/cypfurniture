'use client';

import { useMemo, useState } from 'react';
import type { CommerceSettings } from '@/lib/types';
import { cn, formatPrice } from '@/lib/utils';

type Point = { date: string; orders: number; revenue: number };

/**
 * Single-series daily revenue bars (last 30 days).
 * One hue, thin rounded marks, recessive grid, hover tooltip, optional table view.
 */
export function SalesChart({ data, commerce }: { data: Point[]; commerce: CommerceSettings }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);

  const W = 720;
  const H = 220;
  const PAD = { top: 16, right: 8, bottom: 28, left: 44 };
  const max = Math.max(1, ...data.map((d) => d.revenue));
  const niceMax = useMemo(() => {
    const pow = Math.pow(10, Math.floor(Math.log10(max)));
    return Math.ceil(max / pow) * pow;
  }, [max]);
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const slot = innerW / Math.max(1, data.length);
  const barW = Math.max(4, slot - 4);
  const y = (v: number) => PAD.top + innerH - (v / niceMax) * innerH;
  const ticks = [0, 0.5, 1].map((t) => niceMax * t);
  const fmtDay = (iso: string) => new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const total = data.reduce((s, d) => s + d.revenue, 0);
  const orders = data.reduce((s, d) => s + d.orders, 0);

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-muted">Revenue · last 30 days</p>
          <p className="mt-1 font-display text-2xl text-ink">
            {formatPrice(total, commerce)} <span className="font-sans text-sm text-muted">from {orders} orders</span>
          </p>
        </div>
        <button type="button" onClick={() => setTable((v) => !v)} className="text-xs text-muted underline underline-offset-4 hover:text-ink">
          {table ? 'View chart' : 'View as table'}
        </button>
      </div>

      {table ? (
        <div className="max-h-64 overflow-y-auto rounded-sm border border-line">
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
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--color-line)" strokeWidth={1} />
                <text x={PAD.left - 8} y={y(t) + 4} textAnchor="end" fontSize={11} fill="var(--color-muted)">
                  {t >= 1000 ? `${Math.round(t / 1000)}k` : Math.round(t)}
                </text>
              </g>
            ))}
            {data.map((d, i) => {
              const x = PAD.left + i * slot + (slot - barW) / 2;
              const top = y(d.revenue);
              const h = Math.max(0, PAD.top + innerH - top);
              const r = Math.min(4, barW / 2, h);
              const active = hover === i;
              return (
                <g key={d.date} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
                  <rect x={PAD.left + i * slot} y={PAD.top} width={slot} height={innerH} fill="transparent" />
                  {h > 0 ? (
                    <path
                      d={`M${x},${PAD.top + innerH} V${top + r} a${r},${r} 0 0 1 ${r},-${r} h${barW - 2 * r} a${r},${r} 0 0 1 ${r},${r} V${PAD.top + innerH} Z`}
                      fill="var(--accent)"
                      opacity={hover === null || active ? 1 : 0.45}
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
          {hover !== null && data[hover] && (
            <div
              className={cn('pointer-events-none absolute top-2 rounded-sm border border-line bg-white px-3 py-2 text-xs shadow-soft')}
              style={{ left: `${((PAD.left + hover * slot + slot / 2) / W) * 100}%`, transform: `translateX(${hover > data.length / 2 ? '-100%' : '0'})` }}
            >
              <p className="text-muted">{fmtDay(data[hover].date)}</p>
              <p className="font-medium text-ink">{formatPrice(data[hover].revenue, commerce)}</p>
              <p className="text-muted">
                {data[hover].orders} {data[hover].orders === 1 ? 'order' : 'orders'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
