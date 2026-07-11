// The backend has no login-streak field or endpoint anywhere (confirmed: no
// `/dashboard/overview`, no `/profile`, no login-history table). "Day Streak"
// was previously a hardcoded mock number. This tracks real login activity
// per user in localStorage — an honest, working streak, scoped per browser
// (same trade-off as submissionStore.ts) until the backend adds real
// persistence.

const STORAGE_KEY = "loginActiveDays";

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function readAll(): Record<string, string[]> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    return {};
  }
}

export function recordActiveDay(userId?: string | null): void {
  if (!userId) return;
  const all = readAll();
  const days = all[userId] ?? [];
  const today = dateKey(new Date());
  if (!days.includes(today)) {
    all[userId] = [...days, today].sort();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  }
}

export function getActiveDays(userId?: string | null): string[] {
  if (!userId) return [];
  return (readAll()[userId] ?? []).sort();
}

export function getCurrentStreak(userId?: string | null): number {
  if (!userId) return 0;
  const days = new Set(getActiveDays(userId));
  const cursor = new Date();
  if (!days.has(dateKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (days.has(dateKey(cursor))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

// Day-of-month numbers active in the current calendar month, for a 1-31 grid.
export function getActiveDaysThisMonth(userId?: string | null): number[] {
  if (!userId) return [];
  const now = new Date();
  const prefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-`;
  return getActiveDays(userId)
    .filter(d => d.startsWith(prefix))
    .map(d => parseInt(d.slice(prefix.length), 10));
}
