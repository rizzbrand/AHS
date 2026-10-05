'use client';

import type { ReactNode } from 'react';

export type Slice = { label: string; value: number; color: string };

export function Donut({
  slices,
  size = 188,
  thickness = 24,
  center
}: {
  slices: Slice[];
  size?: number;
  thickness?: number;
  center?: ReactNode;
}) {
  const total = slices.reduce((sum, item) => sum + item.value, 0) || 1;
  const radius = (size - thickness) / 2;
  const circ = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden>
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#f0ebe3" strokeWidth={thickness} />
        {slices
          .filter((item) => item.value > 0)
          .map((item) => {
            const dash = (item.value / total) * circ;
            const circle = (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={thickness}
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={-offset}
              />
            );
            offset += dash;
            return circle;
          })}
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">{center}</div>
    </div>
  );
}

export function Legend({
  slices,
  unit = 'jobs',
  format
}: {
  slices: Slice[];
  unit?: string;
  format?: (value: number) => string;
}) {
  const total = slices.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <ul className="min-w-0 flex-1 space-y-2">
      {slices.map((item) => (
        <li key={item.label} className="flex items-center justify-between gap-3 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-[#4a443d]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.color }} />
            <span className="truncate">{item.label}</span>
          </span>
          <span className="shrink-0 tabular text-[#6f6a62]">
            <span className="font-semibold text-ink">{format ? format(item.value) : item.value}</span>
            <span className="ml-1.5 text-[12px]">{Math.round((item.value / total) * 100)}%</span>
          </span>
        </li>
      ))}
      <li className="pt-1 text-[12px] text-[#9a9187]">{unit}</li>
    </ul>
  );
}

export function Columns({ rows, height = 140 }: { rows: Slice[]; height?: number }) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {rows.map((row) => (
        <div key={row.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          <span className="text-[12px] font-semibold tabular text-ink">{row.value}</span>
          <div className="flex w-full flex-1 items-end justify-center">
            <div
              className="w-full max-w-10 rounded-t-lg"
              style={{
                height: `${Math.max(row.value ? 8 : 0, (row.value / max) * 100)}%`,
                background: row.color
              }}
            />
          </div>
          <span className="text-center text-[11px] leading-4 text-[#8a8278]">{row.label}</span>
        </div>
      ))}
    </div>
  );
}

export function HBars({
  rows,
  color = '#d9a05b',
  format,
  scale = 'max',
  ranked = false
}: {
  rows: Slice[];
  color?: string;
  format?: (value: number) => string;
  scale?: 'max' | 'share';
  ranked?: boolean;
}) {
  const max = Math.max(1, ...rows.map((row) => row.value));
  const total = rows.reduce((sum, row) => sum + row.value, 0) || 1;
  return (
    <ul className="space-y-3.5">
      {rows.map((row, index) => {
        const share = (row.value / total) * 100;
        const width = scale === 'share' ? share : (row.value / max) * 100;
        return (
          <li key={row.label}>
            <div className="flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-baseline gap-2.5 text-[#3f3a34]">
                {ranked ? <span className="w-3 shrink-0 text-[11px] tabular text-[#b5ada2]">{index + 1}</span> : null}
                <span className="truncate">{row.label}</span>
              </span>
              <span className="shrink-0 tabular">
                <span className="font-semibold text-ink">{format ? format(row.value) : row.value}</span>
                <span className="ml-1.5 text-[12px] text-[#9a9187]">{Math.round(share)}%</span>
              </span>
            </div>
            <div className={`mt-1.5 h-2 overflow-hidden rounded-full bg-[#f3efe8] ${ranked ? 'ml-[22px]' : ''}`}>
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(row.value ? 6 : 0, width)}%`, background: row.color || color }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

export function Stacked({ slices }: { slices: Slice[] }) {
  const total = slices.reduce((sum, item) => sum + item.value, 0) || 1;
  return (
    <div>
      <div className="flex h-3 overflow-hidden rounded-full bg-[#f0ebe3]">
        {slices
          .filter((item) => item.value > 0)
          .map((item) => (
            <div key={item.label} title={`${item.label}: ${item.value}`} style={{ width: `${(item.value / total) * 100}%`, background: item.color }} />
          ))}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {slices.map((item) => (
          <li key={item.label} className="flex items-center gap-1.5 text-[12px] text-[#6f6a62]">
            <span className="h-2 w-2 rounded-full" style={{ background: item.color }} />
            {item.label}
            <span className="font-semibold tabular text-ink">{item.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function ChartCard({ title, lede, children, wide }: { title: string; lede?: string; children: ReactNode; wide?: boolean }) {
  return (
    <section className={`rounded-2xl border border-[#ece6dc] bg-white p-5 ${wide ? 'lg:col-span-2' : ''}`}>
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      {lede ? <p className="mt-0.5 text-[12px] text-[#8a8278]">{lede}</p> : null}
      <div className="mt-4">{children}</div>
    </section>
  );
}
