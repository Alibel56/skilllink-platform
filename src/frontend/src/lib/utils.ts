import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { formatDistanceToNow, format, parseISO } from 'date-fns';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string, surname?: string) {
  const a = (name || '').trim().charAt(0);
  const b = (surname || '').trim().charAt(0);
  return (a + b).toUpperCase() || '?';
}

export function formatPrice(p: number, currency = '₸') {
  return `${Math.round(p).toLocaleString('en-US')} ${currency}`;
}

export function formatRelative(iso?: string | null) {
  if (!iso) return '';
  try {
    return formatDistanceToNow(parseISO(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export function formatDate(iso?: string | null, pattern = 'MMM d, yyyy') {
  if (!iso) return '';
  try {
    return format(parseISO(iso), pattern);
  } catch {
    return iso;
  }
}

export function formatDateTime(iso?: string | null) {
  return formatDate(iso, 'MMM d, yyyy · HH:mm');
}

export function shortId(id: string, length = 6) {
  return id.slice(0, length);
}

export const DEFAULT_LAT = 50.2839;
export const DEFAULT_LON = 57.166;

export function getGPS(timeoutMs = 3000): Promise<{ lat: number; lon: number }> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lon: p.coords.longitude }),
      () => resolve({ lat: DEFAULT_LAT, lon: DEFAULT_LON }),
      { enableHighAccuracy: false, timeout: timeoutMs },
    );
  });
}
