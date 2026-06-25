// Build-time data layer for the Hevy workout API.
// Runs only during `astro build` (Node.js environment) — never in the browser.
// Cache strategy: disk file (.hevy-cache.json) keyed by month, so the API is
// called at most once per calendar month on local builds. On Vercel, the cache
// file doesn't survive between deploys, so each deploy fetches fresh data.
import fs from 'node:fs';
import path from 'node:path';

export type Bucket = { label: string; year: number; month: number; volume: number };

const monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CACHE_FILE = path.resolve('.hevy-cache.json');
const MAX_PAGES = 40;

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function emptyBuckets(months: number): Bucket[] {
  const today = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
    return { label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), volume: 0 };
  });
}

function addWorkouts(buckets: Bucket[], workouts: any[]) {
  for (const w of workouts) {
    const d = new Date(w.start_time);
    const i = buckets.findIndex(b => b.year === d.getFullYear() && b.month === d.getMonth());
    if (i < 0) continue;
    let vol = 0;
    for (const ex of w.exercises ?? [])
      for (const s of ex.sets ?? []) vol += (s.weight_kg ?? 0) * (s.reps ?? 0);
    buckets[i].volume += vol;
  }
}

async function fetchPage(key: string, page: number) {
  const res = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=10`, {
    headers: { 'api-key': key, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Hevy page ${page}: ${res.status}`);
  return res.json();
}

export async function getMonthlyVolume(months: number): Promise<Bucket[]> {
  // Serve from disk cache — refetch at most once per calendar month
  const currentMonth = monthKey();
  try {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    if (cached.months === months && cached.month === currentMonth) {
      return cached.buckets;
    }
  } catch { /* no/invalid cache → fetch */ }

  const buckets = emptyBuckets(months);
  const key = import.meta.env.HEVY_API_KEY;
  let haveReal = false;

  if (key) {
    try {
      const first = await fetchPage(key, 1);
      addWorkouts(buckets, first.workouts ?? []);
      const pageCount = Math.min(first.page_count ?? 1, MAX_PAGES);
      // Fetch the remaining pages in parallel instead of one-by-one
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => fetchPage(key, i + 2))
      );
      for (const p of rest) addWorkouts(buckets, p.workouts ?? []);
      haveReal = buckets.some(b => b.volume > 0);
    } catch (e) {
      console.warn('[hevy] fetch failed, using mock data:', e);
    }
  }

  if (!haveReal) {
    buckets.forEach((b, i) => { b.volume = Math.round(4000 + i * 700 + Math.random() * 3000); });
  }

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ month: currentMonth, months, buckets }));
  } catch { /* cache write best-effort */ }

  return buckets;
}
