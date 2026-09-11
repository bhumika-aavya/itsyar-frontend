import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import InAppPdfViewer from '@/components/pdf/InAppPdfViewer';
import { PdfService } from '@/services/pdf.service';
import { Loader2 } from 'lucide-react';
import { CourseService } from '@/services/course.service';

export default function PdfViewerPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const urlParam = searchParams.get('url');
  const titleParam = searchParams.get('title') || 'Document Viewer';
  const subtitleParam = searchParams.get('subtitle') || '';
  const courseId = searchParams.get('courseId');
  const moduleId = searchParams.get('moduleId');
  const topicId = searchParams.get('topicId') || undefined;
  const docType = (searchParams.get('type') as 'documentation' | 'interview') || 'documentation';

  const [pdfUrl, setPdfUrl] = useState<string>(urlParam || '');
  const [loading, setLoading] = useState<boolean>(!urlParam);

  useEffect(() => {
    document.title = `${titleParam} - ForgeInsight`;
  }, [titleParam]);

  useEffect(() => {
    const resolveUrl = async () => {
      if (urlParam) {
        setPdfUrl(urlParam);
        setLoading(false);
        return;
      }

      if (courseId && moduleId) {
        setLoading(true);
        try {
          const resolved = await PdfService.resolvePdfUrl(courseId, moduleId, topicId, docType);
          setPdfUrl(resolved);
        } catch (err) {
          console.error("Failed to resolve PDF URL:", err);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    resolveUrl();
  }, [urlParam, courseId, moduleId, topicId, docType]);


  // ─── PDF viewed tracking ───────────────────────────────────────────────────
  // Mark the PDF as viewed (= completed) the moment this page loads.
  // This fires once per unique topic+pdf-type combination.
  useEffect(() => {
    if (!courseId || !moduleId || !topicId) return;
    CourseService.markPdfViewed(courseId, moduleId, topicId, docType);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, moduleId, topicId, docType]);
  const handleClose = () => {
    // If opened in a new tab, close it. Otherwise navigate back.
    if (window.opener) {
      window.close();
    } else {
      navigate(-1);
    }
  };

  if (loading) {
    return (
      <div className="w-screen h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3">
        <Loader2 size={36} className="animate-spin text-indigo-400" />
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Opening Document...</p>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen overflow-hidden bg-slate-900">
      <InAppPdfViewer
        url={pdfUrl}
        title={titleParam}
        subtitle={subtitleParam}
        isFullscreenTab={true}
        onClose={handleClose}
      />
    </div>
  );
}
