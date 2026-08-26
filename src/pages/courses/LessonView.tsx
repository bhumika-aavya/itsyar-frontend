import React, { useState, useEffect, useMemo } from 'react';
import {
  PlayCircle, FileText, ChevronDown, ChevronUp, Zap, ChevronLeft,
  Loader2, CheckCircle2, Download
} from 'lucide-react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CourseService } from '@/services/course.service';
import { ApiModuleDetail, ApiTopic, ApiAsset } from '@/services/course-detail.schema';

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
        topicId: paramTopicId || null,
        assetType: paramAssetType || null
      };
    }
    if (lessonId) {
      const parts = lessonId.split('__');
      return {
        targetModuleId: parts[0] || null,
        topicId: parts[1] || null,
        assetType: parts[2] || null
      };
    }
    return { targetModuleId: null, topicId: null, assetType: null };
  }, [paramModuleId, paramTopicId, paramAssetType, lessonId]);

  useEffect(() => {
    const loadContent = async () => {
      if (!courseId || !targetModuleId) return;
      if (moduleData) setIsUpdatingVideo(true);
      else setIsInitialLoading(true);

      setVideoEnded(false);

      try {
        // Call GET /api/courses/{courseId}/{targetModuleId}
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

  const handleVideoEnded = async () => {
    setVideoEnded(true);
    try {
      await CourseService.completeCourse(courseId!);
    } catch (e) { }
  };

  // Next asset link calculation
  const nextAssetLink = useMemo(() => {
    if (!currentTopic || !currentAsset || !targetModuleId) return null;
    const assetIdx = currentTopic.assets.findIndex(a => a.type === currentAsset.type);
    if (assetIdx >= 0 && assetIdx < currentTopic.assets.length - 1) {
      const nAsset = currentTopic.assets[assetIdx + 1];
      const tId = currentTopic.topic_id || currentTopic.topicId;
      return paramModuleId
        ? `/course/${courseId}/module/${targetModuleId}/topic/${tId}?asset=${nAsset.type}`
        : `/courses/${courseId}/lessons/${targetModuleId}__${tId}__${nAsset.type}`;
    }
    const topicIdx = activeTopics.findIndex(t => (t.topic_id || t.topicId) === (currentTopic.topic_id || currentTopic.topicId));
    if (topicIdx >= 0 && topicIdx < activeTopics.length - 1) {
      const nTopic = activeTopics[topicIdx + 1];
      if (nTopic.assets?.[0]) {
        const nTId = nTopic.topic_id || nTopic.topicId;
        return paramModuleId
          ? `/course/${courseId}/module/${targetModuleId}/topic/${nTId}?asset=${nTopic.assets[0].type}`
          : `/courses/${courseId}/lessons/${targetModuleId}__${nTId}__${nTopic.assets[0].type}`;
      }
    }
    return null;
  }, [currentTopic, currentAsset, targetModuleId, activeTopics, courseId, paramModuleId]);

  const token = localStorage.getItem("token") || "";

  if (isInitialLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#F9FAFD]">
        <Loader2 className="animate-spin text-[#4F46E5]" size={40} />
      </div>
    );
  }

  const isDocument = currentAsset?.type === 'documentation' ||
    currentAsset?.type === 'interview_pdf';
  // Build video streaming URL or fallback
  const videoSrc = `${import.meta.env.VITE_API_URL}${currentAsset?.url}`
    ;
  const moduleTitle = moduleData?.title || moduleData?.moduleTitle || "Module";
  const assetTitle = currentAsset?.title || currentTopic?.title || "";
  // Header title format: "Module Name - Video Name"
  const displayTitle = assetTitle ? `${moduleTitle} - ${assetTitle}` : moduleTitle;

  return (
    <div className="min-h-screen bg-[#F9FAFD] flex flex-col text-left">
      {/* Top Bar Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => targetModuleId ? navigate(`/courses/${courseId}/modules/${targetModuleId}`) : navigate(`/courses/${courseId}`)}
              className="p-2 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="h-8 w-px bg-slate-100 hidden md:block" />
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                {displayTitle}
              </h2>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Viewer Area */}
          <div className="lg:col-span-8 space-y-8">
            <div className="relative w-full aspect-video bg-slate-900 rounded-[32px] overflow-hidden shadow-2xl shadow-indigo-900/10 border border-slate-800">
              {isUpdatingVideo && (
                <div className="absolute inset-0 z-20 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center">
                  <Loader2 className="animate-spin text-white" size={36} />
                </div>
              )}

              {isDocument ? (
                <div className="w-full h-full min-h-[500px] flex flex-col bg-white">
                  {currentAsset?.url ? (
                    <iframe
                      src={currentAsset.url.startsWith('http') ? currentAsset.url : `${import.meta.env.VITE_API_URL || ''}${currentAsset.url}?token=${token}`}
                      className="w-full h-full min-h-[500px] border-0"
                      title={currentAsset.title}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center">
                      <FileText size={48} className="mb-3 opacity-40" />
                      <p className="font-bold text-sm">No Document URL Available</p>
                    </div>
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
                    <a
                      key={idx}
                      href={docAsset.url ? (docAsset.url.startsWith('http') ? docAsset.url : `${import.meta.env.VITE_API_URL || ''}${docAsset.url}?token=${token}`) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3.5 bg-white border border-slate-100 rounded-2xl hover:border-[#4F46E5] group transition-all shadow-sm"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-[#4F46E5]">
                          <FileText size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-800 group-hover:text-[#4F46E5] transition-colors">{docAsset.title}</h4>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">PDF Document</p>
                        </div>
                      </div>
                      <Download size={14} className="text-slate-400 group-hover:text-[#4F46E5]" />
                    </a>
                  )) || <p className="text-xs text-slate-400 font-medium">No additional materials available.</p>}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar: Topics Hierarchy */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-[32px] p-5 flex flex-col h-[calc(100vh-140px)] sticky top-28 shadow-xl shadow-slate-100/50">
            <h3 className="font-extrabold text-slate-900 text-base px-2 mb-4">Course Content</h3>
            <div className="flex-1 overflow-y-auto pr-1 space-y-3">
              {activeTopics.map((topic: ApiTopic, topicIdx: number) => {
                const tId = topic.topic_id || topic.topicId || `t-${topicIdx}`;
                const isOpen = openTopicId === tId;
                const isCurrentTopic = (currentTopic?.topic_id || currentTopic?.topicId) === tId;

                return (
                  <div
                    key={tId}
                    className={`rounded-2xl overflow-hidden border transition-all duration-300 ${isCurrentTopic ? "border-[#4F46E5] shadow-sm" : "border-slate-100"
                      }`}
                  >
                    <button
                      onClick={() => setOpenTopicId(isOpen ? null : tId)}
                      className={`w-full p-4 flex items-center justify-between transition-colors ${isCurrentTopic ? "bg-[#4F46E5] text-white" : "bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                    >
                      <div className="text-left">
                        <p className={`text-[10px] font-extrabold uppercase tracking-widest mb-0.5 ${isCurrentTopic ? "text-indigo-200" : "text-slate-400"
                          }`}>
                          Topic {topicIdx + 1}
                        </p>
                        <p className="text-sm font-extrabold leading-tight">{topic.title}</p>
                      </div>
                      {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>

                    {isOpen && (
                      <div className="bg-white p-3 space-y-2">
                        {topic.assets?.filter((asset: ApiAsset) => asset.type === 'video' || asset.type === 'practical_video' || asset.type.includes('video')).map((asset: ApiAsset, aIdx: number) => {
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
                                ? "bg-[#EEF0FF] text-[#4F46E5] font-extrabold border border-indigo-100 shadow-xs"
                                : "text-slate-700 font-bold hover:bg-slate-50"
                                }`}
                            >
                              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${isCurrentAsset ? "bg-white text-[#4F46E5] shadow-xs" : "bg-slate-50 text-slate-400"
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
