export const TODAY = '2026-10-02';

export function shortDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
}

export function longDate(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(y, m - 1, d));
}

export function money(amount: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

export function clockTime(iso: string) {
  const [, clock] = iso.split('T');
  if (!clock) return '';
  const [h, min] = clock.split(':').map(Number);
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour = h % 12 || 12;
  return `${hour}:${String(min).padStart(2, '0')} ${suffix}`;
}

export function timeLabel(iso: string) {
  const clock = clockTime(iso);
  if (!clock) return shortDate(iso);
  return `${shortDate(iso)} · ${clock}`;
}

export function addHours(iso: string, hours: number) {
  const [date, clock = '09:00'] = iso.split('T');
  const [h, min] = clock.split(':').map(Number);
  const total = h * 60 + min + hours * 60;
  const nextH = Math.floor(total / 60) % 24;
  const nextM = total % 60;
  return `${date}T${String(nextH).padStart(2, '0')}:${String(nextM).padStart(2, '0')}`;
}

export function weekdayLabel(iso: string) {
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
}
