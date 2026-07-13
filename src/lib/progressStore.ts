const STORAGE_KEY = 'hackathonProgress';

// Client-side safety net for in-progress hackathon solutions: the backend
// progress endpoint may be unavailable, so a copy is always kept here too.
// Scoped per logged-in user by default, or per-team when a teamId is passed
// (team-scoped entries are what let this same browser's "resume" flow match
// what a teammate saved — actual cross-device/cross-teammate sharing still
// requires the backend `/hackathons/{id}/progress` endpoint to key by team).
function currentUserId(): string {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw)?.id ?? 'anon' : 'anon';
    } catch {
        return 'anon';
    }
}

function scopeKey(teamId?: string): string {
    return teamId ? `team:${teamId}` : `user:${currentUserId()}`;
}

type SavedProgress = { language: string; code: string; savedAt: string };

function readAll(): Record<string, Record<string, SavedProgress>> {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
        return {};
    }
}

export function getLocalProgress(hackathonId: string, teamId?: string): SavedProgress | null {
    const all = readAll();
    return all[scopeKey(teamId)]?.[hackathonId] ?? null;
}

export function saveLocalProgress(hackathonId: string, language: string, code: string, teamId?: string): void {
    const all = readAll();
    const key = scopeKey(teamId);
    all[key] = { ...(all[key] ?? {}), [hackathonId]: { language, code, savedAt: new Date().toISOString() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearLocalProgress(hackathonId: string, teamId?: string): void {
    const all = readAll();
    const key = scopeKey(teamId);
    if (!all[key]?.[hackathonId]) return;
    const { [hackathonId]: _removed, ...rest } = all[key];
    all[key] = rest;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}
