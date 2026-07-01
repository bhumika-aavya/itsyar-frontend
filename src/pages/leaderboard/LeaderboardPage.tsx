import React, { useEffect, useState } from 'react';
import { Search, Loader2, ChevronDown } from 'lucide-react';
import { LeaderboardService, LeaderboardFilter } from '@/services/leaderboard.service';

const AVATAR_COLORS = [
  'bg-indigo-100 text-indigo-600',
  'bg-amber-100 text-amber-600',
  'bg-rose-100 text-rose-600',
  'bg-emerald-100 text-emerald-600',
];

function PodiumCard({ entry, position }: { entry: any; position: 'left' | 'center' | 'right' }) {
  const isCenter = position === 'center';
  return (
    <div className={`flex flex-col items-center gap-2 ${isCenter ? 'pb-0' : 'pt-8'}`}>
      <div className="relative">
        {isCenter && (
          <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-amber-400 text-white text-xs font-black flex items-center justify-center shadow-lg z-10">
            1
          </span>
        )}
        {!isCenter && (
          <span className={`absolute -top-2 -right-2 w-5 h-5 rounded-full text-white text-[10px] font-black flex items-center justify-center z-10 ${entry.rank === 2 ? 'bg-slate-400' : 'bg-orange-400'}`}>
            {entry.rank}
          </span>
        )}
        <div className={`rounded-full flex items-center justify-center font-black text-white ${isCenter ? 'w-20 h-20 text-xl' : 'w-14 h-14 text-base'} bg-[#4F39F6]`}>
          {entry.initials}
        </div>
      </div>
      <p className={`font-black text-slate-900 ${isCenter ? 'text-base' : 'text-sm'}`}>{entry.username}</p>
      <div className="text-center">
        <p className={`font-black text-[#4F39F6] ${isCenter ? 'text-2xl' : 'text-lg'}`}>{entry.points.toLocaleString()}</p>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</p>
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const [filter, setFilter] = useState<LeaderboardFilter>('month');
  const [search, setSearch] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showFilterMenu, setShowFilterMenu] = useState(false);

  useEffect(() => {
    setLoading(true);
    LeaderboardService.getLeaderboard(filter)
      .then(setData)
      .finally(() => setLoading(false));
  }, [filter]);

  const filtered = data?.rankings?.filter((r: any) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.handle.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const filterLabel: Record<LeaderboardFilter, string> = {
    today: 'Today',
    week: 'This Week',
    month: 'This Month',
  };

  const podiumOrder = data?.top3?.slice().sort((a: any, b: any) => {
    const order: Record<number, number> = { 2: 0, 1: 1, 3: 2 };
    return order[a.rank] - order[b.rank];
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">Leaderboard</h1>
          <p className="text-slate-400 font-medium mt-1">Top performers across all hackathons.</p>
        </div>
        {/* Filter */}
        <div className="relative">
          <button
            onClick={() => setShowFilterMenu(!showFilterMenu)}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            {filterLabel[filter]} <ChevronDown size={14} className={`transition-transform ${showFilterMenu ? 'rotate-180' : ''}`} />
          </button>
          {showFilterMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-lg border border-slate-100 py-1.5 z-20 w-36">
              {(['today', 'week', 'month'] as LeaderboardFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setShowFilterMenu(false); }}
                  className={`w-full text-left px-4 py-2 text-sm font-bold transition-colors ${filter === f ? 'text-[#4F39F6] bg-indigo-50' : 'text-slate-600 hover:bg-slate-50'}`}
                >
                  {filterLabel[f]}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
        </div>
      ) : (
        <div className="bg-white rounded-[28px] border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
          {/* Search */}
          <div className="p-6 border-b border-slate-100">
            <div className="relative max-w-sm">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search participants..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-10 bg-slate-50 border-none rounded-xl pl-10 pr-4 text-sm focus:ring-2 focus:ring-[#4F39F6]/20 transition-all"
              />
            </div>
          </div>

          {/* Podium */}
          <div className="px-8 pt-6 pb-2">
            <div className="flex items-end justify-center gap-6">
              {podiumOrder?.map((entry: any) => (
                <div
                  key={entry.rank}
                  className={`flex-1 max-w-[180px] rounded-2xl border p-5 ${
                    entry.rank === 1
                      ? 'border-[#4F39F6] bg-indigo-50/60 shadow-lg shadow-indigo-100'
                      : 'border-slate-100 bg-white'
                  }`}
                >
                  <PodiumCard
                    entry={entry}
                    position={entry.rank === 1 ? 'center' : entry.rank === 2 ? 'left' : 'right'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Rankings Table */}
          <div className="p-6">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3 w-16">Rank</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">Participant</th>
                  <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-3">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map((r: any, idx: number) => (
                  <tr
                    key={r.rank}
                    className={`${r.isCurrentUser ? 'bg-indigo-50/50' : 'hover:bg-slate-50'} transition-colors`}
                  >
                    <td className="py-4 text-sm font-black text-slate-500">{r.rank}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${AVATAR_COLORS[idx % AVATAR_COLORS.length]}`}
                        >
                          {r.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-black text-slate-900">{r.name}</p>
                            {r.isCurrentUser && (
                              <span className="px-2 py-0.5 bg-[#4F39F6] text-white text-[9px] font-black rounded-full uppercase">You</span>
                            )}
                          </div>
                          <p className="text-[11px] font-medium text-slate-400">{r.handle} · {r.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-right">
                      <span className="text-sm font-black text-[#4F39F6]">{r.points.toLocaleString()}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 text-center">
              <button className="text-sm font-bold text-[#4F39F6] hover:underline">
                Load More Rankings →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
