const STORAGE_KEY = 'submittedHackathons';

// NOTE: the backend does not persist hackathon submissions anywhere yet
// (POST /hackathons/{id}/submit just returns a random submissionId), so
// there is no server-side source of truth for "did this user submit?".
// This is a client-side stopgap, scoped per logged-in user, until the
// backend adds real submission persistence.
function currentUserId(): string {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw)?.id ?? 'anon' : 'anon';
    } catch {
        return 'anon';
    }
}

function readAll(): Record<string, string[]> {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
    } catch {
        return {};
    }
}

export function isHackathonSubmitted(hackathonId: string): boolean {
    const all = readAll();
    return (all[currentUserId()] ?? []).includes(hackathonId);
}

export function markHackathonSubmitted(hackathonId: string): void {
    const all = readAll();
    const userId = currentUserId();
    const list = all[userId] ?? [];
    if (!list.includes(hackathonId)) {
        all[userId] = [...list, hackathonId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
    }
}
