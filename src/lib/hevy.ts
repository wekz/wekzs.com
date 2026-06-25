// Build-time data layer for the Hevy workout API.
// Runs only during `astro build` (Node.js environment) — never in the browser.
// Cache strategy: disk file (.hevy-cache.json) keyed by month+version, so the
// API is called at most once per calendar month. Each deploy on Vercel refetches.
import fs from 'node:fs';
import path from 'node:path';

export type Bucket   = { label: string; year: number; month: number; volume: number; count: number };
export type HevyData = { monthlyVolume: Bucket[] };

const CACHE_VERSION = 3;
const monthNames    = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const CACHE_FILE    = path.resolve('.hevy-cache.json');
const MAX_PAGES     = 40;

const monthKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

function emptyBuckets(months: number): Bucket[] {
  const today = new Date();
  return Array.from({ length: months }, (_, i) => {
    const d = new Date(today.getFullYear(), today.getMonth() - (months - 1 - i), 1);
    return { label: monthNames[d.getMonth()], year: d.getFullYear(), month: d.getMonth(), volume: 0, count: 0 };
  });
}

function processWorkouts(workouts: any[], buckets: Bucket[]) {
  for (const w of workouts) {
    const d  = new Date(w.start_time);
    const mi = buckets.findIndex(b => b.year === d.getFullYear() && b.month === d.getMonth());
    if (mi < 0) continue;
    buckets[mi].count++;
    let vol = 0;
    for (const ex of w.exercises ?? [])
      for (const s of ex.sets ?? []) vol += (s.weight_kg ?? 0) * (s.reps ?? 0);
    buckets[mi].volume += vol;
  }
}

async function fetchPage(key: string, page: number) {
  const res = await fetch(`https://api.hevyapp.com/v1/workouts?page=${page}&pageSize=10`, {
    headers: { 'api-key': key, Accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Hevy page ${page}: ${res.status}`);
  return res.json();
}

// In-memory singleton — one fetch per build regardless of how many components call this
let buildPromise: Promise<HevyData> | null = null;

export function getHevyData(months: number): Promise<HevyData> {
  if (buildPromise) return buildPromise;
  buildPromise = _fetch(months);
  return buildPromise;
}

async function _fetch(months: number): Promise<HevyData> {
  const currentMonth = monthKey();
  try {
    const cached = JSON.parse(fs.readFileSync(CACHE_FILE, 'utf-8'));
    if (cached.v === CACHE_VERSION && cached.months === months && cached.month === currentMonth) {
      return { monthlyVolume: cached.buckets };
    }
  } catch { /* cache miss */ }

  const buckets = emptyBuckets(months);
  const key     = import.meta.env.HEVY_API_KEY;
  let haveReal  = false;

  if (key) {
    try {
      const first = await fetchPage(key, 1);
      processWorkouts(first.workouts ?? [], buckets);
      const pageCount = Math.min(first.page_count ?? 1, MAX_PAGES);
      const rest = await Promise.all(
        Array.from({ length: Math.max(0, pageCount - 1) }, (_, i) => fetchPage(key, i + 2))
      );
      for (const p of rest) processWorkouts(p.workouts ?? [], buckets);
      haveReal = buckets.some(b => b.volume > 0);
    } catch (e) {
      console.warn('[hevy] fetch failed, using mock data:', e);
    }
  }

  if (!haveReal) {
    buckets.forEach((b, i) => {
      b.volume = Math.round(4000 + i * 800 + Math.random() * 3000);
      b.count  = Math.round(8 + Math.random() * 10);
    });
  }

  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify({ v: CACHE_VERSION, month: currentMonth, months, buckets }));
  } catch { /* best-effort */ }

  return { monthlyVolume: buckets };
}
