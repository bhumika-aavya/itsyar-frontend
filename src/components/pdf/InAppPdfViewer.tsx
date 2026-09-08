import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import * as pdfjsLib from "pdfjs-dist";
import pdfWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import {
  ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2,
  RotateCw, AlertCircle, Loader2, X, FileText, ExternalLink,
  ShieldAlert, ShieldCheck
} from "lucide-react";
import api from "@/lib/axios";

// Configure worker
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export interface InAppPdfViewerProps {
  /** PDF URL (either signed GCS URL or backend API path) */
  url?: string;
  /** Optional pre-fetched raw bytes */
  data?: ArrayBuffer | Uint8Array;
  /** Document title */
  title?: string;
  /** Course / Module subtitle */
  subtitle?: string;
  /** Optional callback to close or go back */
  onClose?: () => void;
  /** Optional callback to open in new tab */
  onOpenNewTab?: () => void;
  /** Custom container class */
  className?: string;
  /** Whether the viewer is embedded in a modal */
  isModal?: boolean;
  /** Whether the viewer is occupying a dedicated standalone browser tab */
  isFullscreenTab?: boolean;
}

interface PageMeta {
  pageNumber: number;
  width: number;
  height: number;
}

export default function InAppPdfViewer({
  url,
  data,
  title = "Document",
  subtitle,
  onClose,
  onOpenNewTab,
  className = "",
  isModal = false,
  isFullscreenTab = false,
}: InAppPdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({});

  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pagesMeta, setPagesMeta] = useState<PageMeta[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInputValue, setPageInputValue] = useState<string>("1");

  // Default Zoom 100% (1.0) as requested
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Anti-Screenshot & Screen Recording Protection State
  const [isCaptureProtected, setIsCaptureProtected] = useState<boolean>(false);
  const [securityNotice, setSecurityNotice] = useState<string | null>(null);



  // Track rendered state for each page: pageNum -> key `${scale}-${rotation}`
  const renderedCacheRef = useRef<Map<number, string>>(new Map());
  const renderTasksRef = useRef<Map<number, any>>(new Map());

  // Show transient security warning toast
  const triggerSecurityNotice = (msg: string) => {
    setSecurityNotice(msg);
    setTimeout(() => {
      setSecurityNotice((prev) => (prev === msg ? null : prev));
    }, 3500);
  };

  // Anti-Screenshot & Screen Recording Event Listeners
  useEffect(() => {
    // 1. Obscure canvas immediately when window loses focus (Snipping tool, external screen recorder, alt-tab)
    const handleBlur = () => {
      setIsCaptureProtected(true);
    };

    const handleFocus = () => {
      setIsCaptureProtected(false);
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsCaptureProtected(true);
      } else {
        setIsCaptureProtected(false);
      }
    };

    // 2. Intercept screenshot and print keyboard shortcuts
    const handleSecurityKeyDown = (e: KeyboardEvent) => {
      // PrintScreen Key
      if (e.key === "PrintScreen" || e.keyCode === 44) {
        e.preventDefault();
        try {
          navigator.clipboard?.writeText("");
        } catch {}
        setIsCaptureProtected(true);
        triggerSecurityNotice("Screen captures are restricted on protected course content.");
        setTimeout(() => setIsCaptureProtected(false), 2000);
        return;
      }

      // Ctrl+P / Cmd+P (Print)
      if ((e.ctrlKey || e.metaKey) && (e.key === "p" || e.key === "P")) {
        e.preventDefault();
        triggerSecurityNotice("Printing is disabled on protected course content.");
        return;
      }

      // Ctrl+S / Cmd+S (Save Page)
      if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        triggerSecurityNotice("Saving is disabled on protected course content.");
        return;
      }

      // Win+Shift+S / Ctrl+Shift+S / Cmd+Shift+3,4,5
      if (
        (e.ctrlKey || e.metaKey || e.shiftKey) &&
        (e.key === "S" || e.key === "s" || e.key === "3" || e.key === "4" || e.key === "5")
      ) {
        setIsCaptureProtected(true);
        setTimeout(() => setIsCaptureProtected(false), 1500);
      }
    };

    window.addEventListener("blur", handleBlur);
    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("keyup", handleSecurityKeyDown, true);
    window.addEventListener("keydown", handleSecurityKeyDown, true);

    return () => {
      window.removeEventListener("blur", handleBlur);
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("keyup", handleSecurityKeyDown, true);
      window.removeEventListener("keydown", handleSecurityKeyDown, true);
    };
  }, []);

  // Load PDF Document
  const loadPdf = useCallback(async () => {
    setLoading(true);
    setError(null);
    renderedCacheRef.current.clear();

    try {
      let loadingTask: any;

      if (data) {
        loadingTask = pdfjsLib.getDocument({ data });
      } else if (url) {
        const isExternalOrSigned =
          url.startsWith("https://storage.googleapis.com") ||
          url.startsWith("https://") ||
          url.startsWith("http://");

        if (isExternalOrSigned && !url.includes(window.location.hostname)) {
          loadingTask = pdfjsLib.getDocument({
            url,
            withCredentials: false,
          });
        } else {
          const cleanUrl = url.startsWith("http")
            ? url
            : `${import.meta.env.VITE_API_URL || ""}${url.startsWith("/") ? "" : "/"}${url}`;

          const res = await api.get(cleanUrl, {
            responseType: "arraybuffer",
          });
          const uint8 = new Uint8Array(res.data);
          loadingTask = pdfjsLib.getDocument({ data: uint8 });
        }
      } else {
        throw new Error("No PDF source provided");
      }

      const doc = await loadingTask.promise;
      setPdfDoc(doc);
      setNumPages(doc.numPages);
      setCurrentPage(1);
      setPageInputValue("1");

      // Pre-fetch page dimensions for scroll placeholders
      const metaList: PageMeta[] = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const p = await doc.getPage(i);
        const vp = p.getViewport({ scale: 1.0 });
        metaList.push({
          pageNumber: i,
          width: vp.width,
          height: vp.height,
        });
      }
      setPagesMeta(metaList);
    } catch (err: any) {
      console.error("[InAppPdfViewer] Failed to load PDF:", err);
      if (err?.status === 401 || err?.response?.status === 401) {
        setError("You don't have permission to access this document. Please log in.");
      } else if (err?.status === 403 || err?.response?.status === 403) {
        setError("You don't have permission to access this document.");
      } else if (err?.status === 404 || err?.response?.status === 404) {
        setError("Document not found.");
      } else {
        setError("Unable to load the document. Check your connection and try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [url, data]);

  useEffect(() => {
    loadPdf();
  }, [loadPdf]);

  // Render a specific page canvas
  const renderSinglePage = useCallback(
    async (pageNumber: number) => {
      if (!pdfDoc) return;
      const canvas = canvasRefs.current[pageNumber];
      if (!canvas) return;

      const cacheKey = `${scale}-${rotation}`;
      if (renderedCacheRef.current.get(pageNumber) === cacheKey) {
        return; // Already rendered at current scale & rotation
      }

      // Cancel existing render task for this page if running
      const existingTask = renderTasksRef.current.get(pageNumber);
      if (existingTask) {
        existingTask.cancel();
      }

      try {
        const page = await pdfDoc.getPage(pageNumber);
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const viewport = page.getViewport({ scale, rotation });
        const outputScale = window.devicePixelRatio || 1;

        canvas.width = Math.floor(viewport.width * outputScale);
        canvas.height = Math.floor(viewport.height * outputScale);
        canvas.style.width = `${Math.floor(viewport.width)}px`;
        canvas.style.height = `${Math.floor(viewport.height)}px`;

        const transform = outputScale !== 1 ? [outputScale, 0, 0, outputScale, 0, 0] : null;

        const renderContext = {
          canvasContext: ctx,
          transform: transform || undefined,
          viewport,
        };

        const renderTask = page.render(renderContext);
        renderTasksRef.current.set(pageNumber, renderTask);
        await renderTask.promise;

        renderedCacheRef.current.set(pageNumber, cacheKey);
      } catch (err: any) {
        if (err?.name !== "RenderingCancelledException") {
          console.error(`[InAppPdfViewer] Page ${pageNumber} render error:`, err);
        }
      }
    },
    [pdfDoc, scale, rotation]
  );

  // Clear render cache when scale or rotation changes
  useEffect(() => {
    renderedCacheRef.current.clear();
  }, [scale, rotation]);

  // IntersectionObserver for continuous scroll rendering and active page tracking
  useEffect(() => {
    if (!pdfDoc || pagesMeta.length === 0 || !scrollContainerRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageNum = Number(entry.target.getAttribute("data-page"));
          if (!pageNum) return;

          // If page enters visible area or nearby, render it
          if (entry.isIntersecting) {
            renderSinglePage(pageNum);

            // If entry covers a significant portion, update current page indicator
            if (entry.intersectionRatio >= 0.4) {
              setCurrentPage(pageNum);
              setPageInputValue(String(pageNum));
            }
          }
        });
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "300px 0px 300px 0px", // Preload buffer
        threshold: [0.0, 0.4, 0.8],
      }
    );

    const elements = scrollContainerRef.current.querySelectorAll(".pdf-page-container");
    elements.forEach((el) => observer.observe(el));

    return () => {
      observer.disconnect();
    };
  }, [pdfDoc, pagesMeta, renderSinglePage]);

  // Scroll smoothly to a specific page
  const scrollToPage = (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > numPages) return;
    const targetEl = document.getElementById(`pdf-page-container-${pageNumber}`);
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      const p = currentPage - 1;
      scrollToPage(p);
    }
  };

  const handleNextPage = () => {
    if (currentPage < numPages) {
      const p = currentPage + 1;
      scrollToPage(p);
    }
  };

  const handlePageInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseInt(pageInputValue, 10);
    if (!isNaN(val) && val >= 1 && val <= numPages) {
      scrollToPage(val);
    } else {
      setPageInputValue(String(currentPage));
    }
  };

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(2.5, Math.round((prev + 0.15) * 100) / 100));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(0.5, Math.round((prev - 0.15) * 100) / 100));
  };

  const handleResetZoom = () => {
    setScale(1.0); // Reset to default 100%
  };

  const handleFitWidth = () => {
    if (scrollContainerRef.current && pagesMeta.length > 0) {
      const containerWidth = scrollContainerRef.current.clientWidth - 80;
      const baseWidth = pagesMeta[0]?.width || 595;
      const newScale = Math.max(0.5, Math.min(2.5, containerWidth / baseWidth));
      setScale(Math.round(newScale * 100) / 100);
    } else {
      setScale(1.0);
    }
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "ArrowLeft" || e.key === "PageUp") handlePrevPage();
      if (e.key === "ArrowRight" || e.key === "PageDown") handleNextPage();
      if (e.key === "+" || e.key === "=") handleZoomIn();
      if (e.key === "-") handleZoomOut();
      if (e.key === "0") handleResetZoom();
      if (e.key === "Escape" && onClose && !document.fullscreenElement) onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handlePrevPage, handleNextPage, onClose]);

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => {
        e.preventDefault();
        triggerSecurityNotice("Right-click menu is disabled on protected content.");
      }}
      onCopy={(e) => {
        e.preventDefault();
        triggerSecurityNotice("Copying is disabled on protected content.");
      }}
      onDragStart={(e) => e.preventDefault()}
      className={`relative flex flex-col bg-slate-900 text-slate-100 select-none overflow-hidden transition-all duration-200 ${
        isFullscreen || isFullscreenTab
          ? "w-screen h-screen fixed inset-0 z-50 rounded-none"
          : "w-full min-h-[580px] h-full rounded-3xl border border-slate-800 shadow-2xl"
      } ${className}`}
    >
      {/* Print protection style sheet */}
      <style>{`
        @media print {
          body * { display: none !important; }
          body:after {
            content: "Protected Content: Printing is restricted.";
            display: block !important;
            font-size: 24pt;
            text-align: center;
            padding-top: 100pt;
            color: #ef4444;
          }
        }
      `}</style>

      {/* Security Toast Warning */}
      {securityNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-amber-500/90 text-slate-950 px-4 py-2 rounded-xl text-xs font-black shadow-2xl backdrop-blur-md animate-in fade-in slide-in-from-top-2 duration-150 flex items-center gap-2">
          <ShieldAlert size={16} />
          <span>{securityNotice}</span>
        </div>
      )}

      {/* Screen Capture / Alt-Tab / Snipping Tool Privacy Shield */}
      {isCaptureProtected && (
        <div className="absolute inset-0 z-40 bg-slate-950/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-8 transition-opacity duration-150 animate-in fade-in duration-100">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mb-4 shadow-xl shadow-indigo-500 dark:shadow-none/5">
            <ShieldAlert size={32} />
          </div>
          <h3 className="text-lg font-black text-white mb-2">Protected Course Material</h3>
          <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-5">
            Screen recording and capture tools are restricted on this material. Return focus to this tab to resume reading.
          </p>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-bold text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400" /> DRM & Content Protection Active
          </div>
        </div>
      )}

      {/* ================= TOP TOOLBAR ================= */}
      <header className="bg-slate-950/95 backdrop-blur-md px-4 sm:px-6 py-3 border-b border-slate-800 flex items-center justify-between gap-4 z-30 shrink-0 shadow-md">
        {/* Left: Document details & Back */}
        <div className="flex items-center gap-3 min-w-0">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
              title={isFullscreenTab ? "Close Tab" : "Close Document"}
            >
              {isModal || isFullscreenTab ? <X size={18} /> : <ChevronLeft size={18} />}
            </button>
          )}

          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0">
            <FileText size={16} />
          </div>

          <div className="min-w-0">
            <h3 className="text-xs sm:text-sm font-extrabold text-white truncate max-w-xs sm:max-w-md">
              {title}
            </h3>
            {subtitle && (
              <p className="text-[11px] font-bold text-slate-400 truncate max-w-xs sm:max-w-md">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Center / Right: Controls (Page nav, Zoom, Rotate, Fullscreen) - NO DOWNLOAD / NO PRINT */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Continuous Scroll Page Indicator & Navigation */}
          {numPages > 0 && (
            <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-1 text-xs">
              <button
                type="button"
                disabled={currentPage <= 1}
                onClick={handlePrevPage}
                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Scroll to Previous Page"
              >
                <ChevronLeft size={16} />
              </button>

              <form onSubmit={handlePageInputSubmit} className="flex items-center px-1">
                <input
                  type="text"
                  value={pageInputValue}
                  onChange={(e) => setPageInputValue(e.target.value)}
                  onBlur={() => setPageInputValue(String(currentPage))}
                  className="w-8 h-6 bg-slate-800 text-center font-bold text-white rounded text-xs outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <span className="text-slate-400 font-bold px-1.5">/ {numPages}</span>
              </form>

              <button
                type="button"
                disabled={currentPage >= numPages}
                onClick={handleNextPage}
                className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
                title="Scroll to Next Page"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Zoom Controls (Default 100%) */}
          <div className="hidden sm:flex items-center bg-slate-900 border border-slate-800 rounded-xl px-1.5 py-1 text-xs">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 0.5}
              className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut size={15} />
            </button>

            <span
              onClick={handleResetZoom}
              className="px-2 font-bold text-slate-300 text-[11px] hover:text-indigo-400 cursor-pointer"
              title="Click to Reset to 100%"
            >
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 2.5}
              className="p-1 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn size={15} />
            </button>

            <button
              type="button"
              onClick={handleFitWidth}
              className="ml-1 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold text-[10px] transition-colors"
              title="Fit to Container Width"
            >
              Fit Width
            </button>
          </div>

          {/* Rotate */}
          <button
            type="button"
            onClick={handleRotate}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer hidden md:flex"
            title="Rotate 90°"
          >
            <RotateCw size={15} />
          </button>

          {/* Open in New Tab (only shown if not already a standalone tab) */}
          {!isFullscreenTab && onOpenNewTab && (
            <button
              type="button"
              onClick={onOpenNewTab}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 hover:border-indigo-500/40 transition-colors cursor-pointer"
              title="Open in Fullscreen Tab"
            >
              <ExternalLink size={15} />
            </button>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
          >
            {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
          </button>
        </div>
      </header>

      {/* ================= CONTINUOUS VERTICAL SCROLL CANVAS ================= */}
      <div
        ref={scrollContainerRef}
        className="relative flex-1 overflow-y-auto overflow-x-auto bg-[#1a1d26] p-4 sm:p-8 flex flex-col items-center"
      >
        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 text-slate-400 py-32">
            <Loader2 size={36} className="animate-spin text-indigo-400" />
            <p className="text-xs font-extrabold uppercase tracking-wider">Loading document...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="flex flex-col items-center justify-center text-center p-8 max-w-md bg-slate-950/60 border border-red-500/20 rounded-2xl space-y-3 my-auto">
            <div className="w-12 h-12 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>
            <h4 className="text-sm font-black text-white">Document Unavailable</h4>
            <p className="text-xs font-medium text-slate-400 leading-relaxed">{error}</p>
            <button
              type="button"
              onClick={loadPdf}
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs transition-colors cursor-pointer"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Continuous Page Scroll Layout */}
        {!loading && !error && pagesMeta.length > 0 && (
          <div className="flex flex-col items-center gap-8 py-4 w-full">
            {pagesMeta.map((meta) => {
              const pNum = meta.pageNumber;
              const scaledWidth = Math.floor(meta.width * scale);
              const scaledHeight = Math.floor(meta.height * scale);

              return (
                <div
                  key={pNum}
                  id={`pdf-page-container-${pNum}`}
                  data-page={pNum}
                  className="pdf-page-container relative flex flex-col items-center transition-transform"
                  style={{
                    minWidth: `${scaledWidth}px`,
                    minHeight: `${scaledHeight}px`,
                  }}
                >
                  <div className="relative rounded-lg shadow-2xl overflow-hidden bg-white">
                    <canvas
                      ref={(el) => {
                        canvasRefs.current[pNum] = el;
                      }}
                      className="bg-white transition-shadow"
                      style={{
                        width: `${scaledWidth}px`,
                        height: `${scaledHeight}px`,
                        imageRendering: "auto",
                      }}
                    />
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 mt-2">
                    Page {pNum} of {numPages}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ================= BOTTOM MOBILE FOOTER ================= */}
      {numPages > 0 && !loading && !error && (
        <footer className="sm:hidden bg-slate-950 px-4 py-2 border-t border-slate-800 flex items-center justify-between text-xs shrink-0">
          <span className="text-[11px] font-bold text-slate-400">
            Page {currentPage} of {numPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrevPage}
              disabled={currentPage <= 1}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 disabled:opacity-30 font-bold"
            >
              Prev
            </button>
            <button
              type="button"
              onClick={handleNextPage}
              disabled={currentPage >= numPages}
              className="px-3 py-1 bg-slate-900 border border-slate-800 rounded-lg text-slate-200 disabled:opacity-30 font-bold"
            >
              Next
            </button>
          </div>
        </footer>
      )}
    </div>
  );
}
