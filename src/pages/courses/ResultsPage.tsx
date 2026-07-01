import React, { useState, useEffect } from 'react';
import { Award, Download, Info, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CourseService } from '@/services/course.service';

export default function ResultsPage() {
  const navigate = useNavigate();
  const [results, setResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    CourseService.getResults()
      .then(setResults)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  if (isLoading) return (
    <div className="h-64 flex items-center justify-center">
      <Loader2 className="animate-spin text-[#4F39F6]" size={32} />
    </div>
  );

  return (
    // <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 text-left">
    <>
      <div>
        <h1 className="text-3xl font-black text-slate-900">Results</h1>
        <p className="text-slate-400 font-medium mt-1">Track your learning milestones and academic achievements.</p>
      </div>

      <div className="bg-white rounded-[32px] border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
        {/* Card Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <Award className="text-[#4F39F6]" size={22} />
            <h2 className="text-base font-black text-slate-900">Completed Courses &amp; Certificates</h2>
          </div>
          <span className="px-4 py-1.5 bg-indigo-50 text-[#4F39F6] rounded-full text-xs font-black">
            {results.length} Total Certificates
          </span>
        </div>

        {/* Info Note */}
        <div className="mx-6 mt-5 flex items-center gap-3 bg-slate-50 border border-slate-100 rounded-2xl px-4 py-3">
          <Info size={16} className="text-slate-400 shrink-0" />
          <p className="text-[13px] font-medium text-slate-500">
            Only courses with a final exam score above 70% are shown.
          </p>
        </div>

        {/* Table */}
        <div className="p-6">
          {results.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-bold text-sm">
              No completed courses yet. Keep learning!
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Course Name</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Completion Date</th>
                  <th className="text-left text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Status</th>
                  <th className="text-right text-[10px] font-black text-slate-400 uppercase tracking-widest pb-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {results.map((r: any) => (
                  <tr key={r.id}>
                    <td className="py-5">
                      <p className="text-sm font-bold text-slate-900">{r.title}</p>
                      <p className="text-[11px] font-bold text-[#4F39F6] mt-0.5">{r.category}</p>
                    </td>
                    <td className="py-5 text-sm font-medium text-slate-500">{r.completionDate}</td>
                    <td className="py-5">
                      <span className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        Passed
                      </span>
                    </td>
                    <td className="py-5 text-right">
                      <button
                        onClick={() => navigate(`/courses/${r.courseId}/certificate`)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all"
                      >
                        <Download size={14} /> Download Certificate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div></>
    // </div>
  );
}
