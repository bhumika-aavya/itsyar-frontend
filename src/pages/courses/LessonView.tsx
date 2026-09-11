  import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  PlayCircle, FileText, ChevronDown, ChevronUp, Zap, ChevronLeft,
  Loader2, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { ApiModuleDetail, ApiTopic, ApiAsset } from '@/services/course-detail.schema';
import InAppPdfViewer from '@/components/pdf/InAppPdfViewer';
import { PdfService } from '@/services/pdf.service';
import { capitalizeTitle } from '@/lib/utils';
import { toast } from 'sonner';

export default function LessonView() {
  const navigate = useNavigate();
  const { courseId, lessonId, moduleId: paramModuleId, topicId: paramTopicId } = useParams();
  const [searchParams] = useSearchParams();
  const paramAssetType = searchParams.get('asset');

  const [moduleData, setModuleData] = useState<ApiModuleDetail | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isUpdatingVideo, setIsUpdatingVideo] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [openTopicId, setOpenTopicId] = useState<string | null>(null);

  // Extract targetModuleId, topicId, assetType
  const { targetModuleId, topicId, assetType } = useMemo(() => {
    if (paramModuleId) {
      return {
        targetModuleId: paramModuleId,
        topicId: paramTopicId || '',
        assetType: paramAssetType || 'video',
      };
    }
    if (lessonId && lessonId.includes('__')) {
      const parts = lessonId.split('__');
      return {
        targetModuleId: parts[0] || '',
        topicId: parts[1] || '',
        assetType: parts[2] || 'video',
      };
    }
    return {
      targetModuleId: lessonId || '',
      topicId: '',
      assetType: 'video',
    };
  }, [lessonId, paramModuleId, paramTopicId, paramAssetType]);

  // Fetch Module Details
  useEffect(() => {
    if (!courseId || !targetModuleId) return;

    const loadContent = async () => {
      try {
        setIsUpdatingVideo(true);
        const detail = await CourseService.getModuleTopics(courseId, targetModuleId);
        setModuleData(detail);
      } catch (err) {
        console.error("Failed to load module topics", err);
      } finally {
        setIsInitialLoading(false);
        setIsUpdatingVideo(false);
      }
    };

    loadContent();
  }, [courseId, targetModuleId]);

  const activeTopics = moduleData?.topics || [];

  const currentTopic = useMemo(() => {
    if (!activeTopics || activeTopics.length === 0) return null;
    if (topicId) {
      return activeTopics.find(t => (t.topic_id || t.topicId) === topicId) || activeTopics[0];
    }
    return activeTopics[0];
  }, [activeTopics, topicId]);

  // Keep open topic in sync with current active topic
  useEffect(() => {
    if (currentTopic) {
      const tId = currentTopic.topic_id || currentTopic.topicId;
      if (tId) setOpenTopicId(tId);
    }
  }, [currentTopic]);

  const currentAsset = useMemo(() => {
    if (!currentTopic || !currentTopic.assets || currentTopic.assets.length === 0) return null;
    if (assetType) {
      return currentTopic.assets.find(a => a.type === assetType) || currentTopic.assets[0];
    }
    return currentTopic.assets[0];
  }, [currentTopic, assetType]);

  // ─── Video progress tracking (90% threshold heartbeat) ──────────────────────
  // Tracks last time (in seconds) we sent a progress ping so we do not flood the API.
  const lastProgressPingRef = useRef<number>(0);
  // Once the backend acknowledges crossing the 90% threshold, stop sending further pings.
  const thresholdCrossedRef = useRef<boolean>(false);

  // Reset tracking state whenever the topic or asset changes (new video loaded).
  useEffect(() => {
    lastProgressPingRef.current = 0;
    thresholdCrossedRef.current = false;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTopic?.topic_id, currentTopic?.topicId, currentAsset?.type]);

  const handleTimeUpdate = useCallback(
    async (e: React.SyntheticEvent<HTMLVideoElement>) => {
      if (thresholdCrossedRef.current) return;
      const video = e.currentTarget;
      if (!video.duration || video.duration <= 0) return;
      const played = video.currentTime;
      const total = video.duration;
      if (played - lastProgressPingRef.current < 10) return; // only ping every ~10 s
      lastProgressPingRef.current = played;
      const cId = courseId || '';
      const mId = targetModuleId || '';
      const tId = currentTopic?.topic_id || currentTopic?.topicId || '';
      if (!cId || !mId || !tId) return;
      const videoType = (currentAsset?.type === 'practical' || currentAsset?.type === 'practical_video') ? 'practical' : 'topic';
      const result = await CourseService.trackVideoProgress(cId, mId, tId, videoType, played, total);
      if (result?.crossed_threshold) thresholdCrossedRef.current = true;
    },
    [courseId, targetModuleId, currentTopic, currentAsset],
  );

  const handleVideoEnded = useCallback(async () => {
    setVideoEnded(true);
    const cId = courseId || '';
    const mId = targetModuleId || '';
    const tId = currentTopic?.topic_id || currentTopic?.topicId || '';
    if (cId && mId && tId) {
      // Final 100 % ping so the backend always registers the asset even if
      // the 10 s heartbeat did not fire close enough to the end of the video.
      const videoType = (currentAsset?.type === 'practical' || currentAsset?.type === 'practical_video') ? 'practical' : 'topic';
      await CourseService.trackVideoProgress(cId, mId, tId, videoType, 1, 1);
    }
  }, [courseId, targetModuleId, currentTopic, currentAsset]);

  // Next asset link calculation
  const nextAssetLink = useMemo(() => {
    if (!currentTopic || !currentAsset || !moduleData) return null;
    const tId = currentTopic.topic_id || currentTopic.topicId;
    const assetIdx = currentTopic.assets.findIndex(a => a.type === currentAsset.type);
    if (assetIdx >= 0 && assetIdx < currentTopic.assets.length - 1) {
      const nAsset = currentTopic.assets[assetIdx + 1];
      return paramModuleId
        ? `/course/${courseId}/module/${targetModuleId}/topic/${tId}?asset=${nAsset.type}`
        : `/courses/${courseId}/lessons/${targetModuleId}__${tId}__${nAsset.type}`;
    }
    const topicIdx = activeTopics.findIndex(t => (t.topic_id || t.topicId) === tId);
    if (topicIdx >= 0 && topicIdx < activeTopics.length - 1) {
      const nTopic = activeTopics[topicIdx + 1];
      const nTId = nTopic.topic_id || nTopic.topicId;
      if (nTopic.assets?.[0]) {
        return paramModuleId
          ? `/course/${courseId}/module/${targetModuleId}/topic/${nTId}?asset=${nTopic.assets[0].type}`
          : `/courses/${courseId}/lessons/${targetModuleId}__${nTId}__${nTopic.assets[0].type}`;
      }
    }
    return null;
  }, [currentTopic, currentAsset, activeTopics, moduleData, courseId, targetModuleId, paramModuleId]);

  const isDocument =
    currentAsset?.type === 'documentation' ||
    currentAsset?.type === 'topic-documentation' ||
    currentAsset?.type === 'interview_pdf';

  const [resolvedPdfUrl, setResolvedPdfUrl] = useState<string>('');

  useEffect(() => {
    const resolveDoc = async () => {
      if (isDocument && currentAsset) {
        if (currentAsset.url) {
          setResolvedPdfUrl(currentAsset.url);
        } else if (courseId && targetModuleId) {
          const tId = currentTopic?.topic_id || currentTopic?.topicId;
          const docType = currentAsset.type.includes('interview') ? 'interview' : 'documentation';
          const u = await PdfService.resolvePdfUrl(courseId, targetModuleId, tId, docType);
          setResolvedPdfUrl(u);
        }
      }
    };
    resolveDoc();
  }, [isDocument, currentAsset, courseId, targetModuleId, currentTopic]);

  // ─── Inline PDF viewed tracking ─────────────────────────────────────────────
  // When the user views a PDF inline (inside LessonView), mark it as viewed once.
  useEffect(() => {
    if (!isDocument || !courseId || !targetModuleId) return;
    const tId = currentTopic?.topic_id || currentTopic?.topicId;
    if (!tId || !currentAsset) return;
    const pdfType = (currentAsset.type.includes('interview')) ? 'interview' : 'documentation';
    CourseService.markPdfViewed(courseId, targetModuleId, tId, pdfType);
  // Run once per topic+asset combination when the document view is active.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDocument, currentTopic?.topic_id, currentTopic?.topicId, currentAsset?.type, courseId, targetModuleId]);

  if (isInitialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9FAFD]">
        <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
      </div>
    );
  }
  // Build video streaming URL or fallback
  const videoSrc = currentAsset?.url ? `${import.meta.env.VITE_API_URL}${currentAsset.url}` : "";
  const moduleTitle = moduleData?.title || moduleData?.moduleTitle || "Module";
  const assetTitle = currentAsset?.title || currentTopic?.title || "";
  // Header title format: "Module Name - Video Name"
  const displayTitle = assetTitle ? `${moduleTitle} - ${assetTitle}` : moduleTitle;

  return (
    <div className="min-h-screen bg-[#F9FAFD] dark:bg-[#0b0c0e] text-slate-900 dark:text-white flex flex-col font-sans">
      {/* Top Header / Navbar */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#121316]/80 backdrop-blur-md border-b border-slate-100 dark:border-[#22232b] px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => targetModuleId ? navigate(`/courses/${courseId}/modules/${targetModuleId}`) : navigate(`/courses/${courseId}`)}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-[#252630] hover:bg-slate-50 dark:hover:bg-[#1c1d24] text-slate-600 dark:text-slate-300 transition-colors"
            >
              <ChevronLeft size={18} />
            </button>
            <div>
              <span className="text-[11px] font-extrabold text-[#4F46E5] uppercase tracking-wider block">
                {capitalizeTitle(moduleTitle)}
              </span>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">
                {capitalizeTitle(currentTopic?.title) || "Lesson"}
              </h2>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Viewer Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className={`relative w-full bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-900 dark:shadow-none border border-slate-800 ${isDocument ? "min-h-[640px] h-[75vh]" : "aspect-video"
              }`}>
              {isUpdatingVideo && (
                <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={36} />
                </div>
              )}

              {isDocument ? (
                <InAppPdfViewer
                  url={resolvedPdfUrl || currentAsset?.url}
                  title={currentAsset?.title || (currentAsset?.type === 'interview_pdf' ? "Interview Questions" : "Topic Documentation")}
                  subtitle={displayTitle}
                  className="w-full h-full rounded-none border-0"
                  onOpenNewTab={() => {
                    const tId = currentTopic?.topic_id || currentTopic?.topicId;
                    const docType = currentAsset?.type.includes('interview') ? 'interview' : 'documentation';
                    const params = new URLSearchParams({
                      url: resolvedPdfUrl || currentAsset?.url || '',
                      title: currentAsset?.title || (docType === 'interview' ? 'Interview Questions' : 'Topic Documentation'),
                      subtitle: displayTitle,
                      courseId: courseId || '',
                      moduleId: targetModuleId || '',
                      topicId: tId || '',
                      type: docType,
                    });
                    window.open(`/pdf-viewer?${params.toString()}`, '_blank');
                  }}
                />
              ) : !currentAsset?.url ? (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900 text-center px-6 py-12">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center text-rose-400 mb-1 border border-slate-700 shadow-inner">
                    <AlertCircle size={32} />
                  </div>
                  <p className="text-slate-400 text-lg font-extrabold mb-1">Video not found</p>
                  <p className="text-slate-400 text-xs max-w-md font-medium">
                    This video has not been uploaded yet for this lesson.
                  </p>
                  {nextAssetLink && (
                    <button
                      onClick={() => navigate(nextAssetLink)}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[#4F46E5] hover:bg-[#4338CA] text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-indigo-950 cursor-pointer mt-1"
                    >
                      <PlayCircle size={16} />
                      <span>Next Lesson</span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  <video
                    key={`${targetModuleId}-${currentTopic?.topic_id || currentTopic?.topicId}-${currentAsset?.type}`}
                    className="w-full h-full object-cover"
                    controls
                    autoPlay={false}
                    onEnded={handleVideoEnded}
                    onTimeUpdate={handleTimeUpdate}
                  >
                    {videoSrc && <source src={videoSrc} type="video/mp4" />}
                    Your browser does not support the video tag.
                  </video>

                  {videoEnded && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/75 backdrop-blur-sm z-10">
                      <div className="text-center space-y-6 px-8">
                        <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto">
                          <CheckCircle2 className="text-white" size={32} />
                        </div>
                        <div>
                          <p className="text-white font-extrabold text-xl mb-1">Lesson Complete!</p>
                          <p className="text-white/60 text-sm font-medium">
                            {nextAssetLink ? "Loading next lesson..." : "You've finished this module!"}
                          </p>
                        </div>
                        {nextAssetLink && (
                          <button
                            onClick={() => {
                              setVideoEnded(false);
                              navigate(nextAssetLink);
                            }}
                            className="flex items-center justify-center mx-auto gap-3 px-10 py-4 bg-white text-slate-900 rounded-2xl font-extrabold text-sm hover:bg-slate-100 transition-all"
                          >
                            <PlayCircle size={18} /> Next Lesson
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bottom Topic Details */}
            <div className="grid md:grid-cols-10 gap-8 pt-2">
              <div className="md:col-span-6 space-y-4">
                <div className="flex items-center gap-3 font-extrabold text-[#4F46E5] uppercase text-xs tracking-widest">
                  <FileText size={18} /> Summary
                </div>
                <p className="text-sm font-medium text-slate-600 leading-relaxed">
                  {currentTopic?.summary || currentTopic?.topicSummary || "Master the key concepts covered in this lesson. Review course materials below."}
                </p>
              </div>

              <div className="md:col-span-4 space-y-4">
                <div className="flex items-center gap-3 font-extrabold text-[#4F46E5] uppercase text-xs tracking-widest">
                  <Zap size={18} /> Course Materials
                </div>
                <div className="flex flex-col gap-3">
                  {currentTopic?.assets?.filter(a => a.type === 'documentation' || a.type === 'interview_pdf').map((docAsset, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        const tId = currentTopic.topic_id || currentTopic.topicId;
                        const docType = docAsset.type.includes('interview') ? 'interview' : 'documentation';
                        const params = new URLSearchParams({
                          url: docAsset.url || '',
                          title: docAsset.title || (docType === 'interview' ? 'Interview Questions' : 'Topic Documentation'),
                          subtitle: displayTitle,
                          courseId: courseId || '',
                          moduleId: targetModuleId || '',
                          topicId: tId || '',
                          type: docType,
                        });
                        window.open(`/pdf-viewer?${params.toString()}`, '_blank');
                      }}
                      className="flex items-center justify-between p-4 bg-white dark:bg-[#16171d] rounded-2xl border border-slate-100 dark:border-[#2e303a] hover:border-indigo-100 dark:hover:border-indigo-950 transition-all cursor-pointer group shadow-xs dark:shadow-none"
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-[#1e1b4b] text-[#4F46E5] dark:text-[#818cf8] flex items-center justify-center shrink-0">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#4F46E5] dark:group-hover:text-[#818cf8] transition-colors leading-snug">
                            {docAsset.title}
                          </p>
                          <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            PDF Document
                          </span>
                        </div>
                      </div>
                    </div>
                  )) || <p className="text-xs text-slate-400 font-medium">No additional materials available.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Topics Hierarchy */}
          <div className="lg:col-span-4 bg-white dark:bg-[#16171d] border border-slate-100 dark:border-[#2e303a] rounded-[32px] p-5 flex flex-col h-[calc(100vh-140px)] sticky top-28 shadow-xl shadow-slate-100 dark:shadow-none">
            <h3 className="font-extrabold text-slate-900 dark:text-white text-base px-2 mb-4">Course Content</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {activeTopics.map((topic: ApiTopic, topicIdx: number) => {
                const tId = topic.topic_id || topic.topicId || `t-${topicIdx}`;
                const isOpen = openTopicId === tId;
                const isCurrentTopic = (currentTopic?.topic_id || currentTopic?.topicId) === tId;

                return (
                  <div
                    key={tId}
                    className={`rounded-2xl overflow-hidden border transition-all duration-300 ${isCurrentTopic ? "border-[#4F46E5] shadow-sm dark:shadow-none" : "border-slate-100 dark:border-[#2e303a]"
                      }`}
                  >
                    <button
                      onClick={() => setOpenTopicId(isOpen ? null : tId)}
                      className={`w-full p-4 flex items-center justify-between transition-colors ${isCurrentTopic ? "bg-[#4F46E5] text-white" : "bg-white dark:bg-[#1c1d24] text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#252630]"
                        }`}
                    >
                      <div className="text-left">
                        <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-0.5 ${isCurrentTopic ? "text-indigo-200" : "text-slate-400"
                          }`}>
                          Topic {topicIdx + 1}
                        </p>
                        <p className="text-sm font-extrabold leading-tight">{capitalizeTitle(topic.title)}</p>
                      </div>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isOpen && (
                      <div className="bg-white dark:bg-[#16171d] p-3 space-y-2">
                        {topic.assets?.map((asset: ApiAsset, aIdx: number) => {
                          const isCurrentAsset = isCurrentTopic && currentAsset?.type === asset.type;
                          const isDoc = asset.type === 'documentation' || asset.type === 'interview_pdf';
                          return (
                            <div
                              key={aIdx}
                              onClick={() => {
                                if (paramModuleId) {
                                  navigate(`/course/${courseId}/module/${targetModuleId}/topic/${tId}?asset=${asset.type}`);
                                } else {
                                  navigate(`/courses/${courseId}/lessons/${targetModuleId}__${tId}__${asset.type}`);
                                }
                              }}
                              className={`flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${isCurrentAsset
                                ? "bg-[#EEF0FF] dark:bg-[#1e1b4b] text-[#4F46E5] dark:text-[#818cf8] font-extrabold border border-indigo-100 dark:border-indigo-950 shadow-xs dark:shadow-none"
                                : "text-slate-700 dark:text-slate-300 font-bold hover:bg-slate-50 dark:hover:bg-[#1c1d24]"
                                }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCurrentAsset
                                ? "bg-white dark:bg-[#252630] text-[#4F46E5] dark:text-[#818cf8] shadow-xs dark:shadow-none"
                                : "bg-slate-50 dark:bg-[#1c1d24] text-slate-400 dark:text-slate-500"
                                }`}>
                                {isDoc ? <FileText size={16} /> : <PlayCircle size={16} />}
                              </div>
                              <span className="text-xs leading-snug">{asset.title}</span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
