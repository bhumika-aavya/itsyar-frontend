// The backend does not persist hackathon submissions anywhere yet (see
// submissionStore.ts), so there is no real source of truth for "what did
// this user submit". Until the backend adds real submission persistence,
// this deterministically derives a per-user submission list from the real
// hackathon list so the superadmin review flow has something stable to
// demo against — the same trade-off already made in JudgeHackathonsPage.

export interface MockUserSubmission {
  hackathonId: string;
  hackathonTitle: string;
  team: string;
  teammate: string;
  language: string;
  submittedAt: string;
  aboutProject: string;
  problemStatement: string;
  techStack: string[];
  files: { name: string; size: string }[];
}

const LANGUAGES = ["Python", "JavaScript", "TypeScript", "Go", "Java"];
const TECH_POOL = ["React", "Python", "OpenAI API", "Tailwind", "PyTorch", "Node.js", "PostgreSQL", "Docker", "FastAPI", "Vue.js"];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// Only ~60% of users have any submissions at all, so the list isn't "everyone".
export function getMockSubmissionsForUser(
  userId: string,
  hackathons: { id: string; title: string; description?: string }[]
): MockUserSubmission[] {
  if (hackathons.length === 0) return [];
  const seed = hashStr(userId);
  if (seed % 5 >= 3) return [];

  const count = 1 + (seed % Math.min(3, hackathons.length));
  const picked: MockUserSubmission[] = [];
  for (let i = 0; i < count; i++) {
    const h = hackathons[(seed + i * 7) % hackathons.length];
    const techCount = 3 + ((seed + i) % 3);
    const techStack = Array.from({ length: techCount }, (_, j) => TECH_POOL[(seed + i * 5 + j * 3) % TECH_POOL.length])
      .filter((t, idx, arr) => arr.indexOf(t) === idx);
    picked.push({
      hackathonId: String(h.id),
      hackathonTitle: h.title,
      team: `Team ${String.fromCharCode(65 + ((seed + i) % 26))}`,
      teammate: `Contributor ${String.fromCharCode(75 + ((seed + i * 2) % 20))}.`,
      language: LANGUAGES[(seed + i * 3) % LANGUAGES.length],
      submittedAt: new Date(Date.now() - ((seed % 20) + i * 3) * 86400000).toISOString(),
      aboutProject: h.description
        ? h.description
        : `A submission for "${h.title}" focused on solving the challenge brief with a working end-to-end prototype.`,
      problemStatement: `Teams participating in "${h.title}" identified a gap in existing tooling and built a focused solution to close it within the hackathon timeframe.`,
      techStack,
      files: [
        { name: "Project_Proposal.pdf", size: "2.4 MB" },
        { name: `main.${LANGUAGES[(seed + i * 3) % LANGUAGES.length] === "Python" ? "py" : "js"}`, size: "13.2 KB" },
      ],
    });
  }
  return picked;
}
