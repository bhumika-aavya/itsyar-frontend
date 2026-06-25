import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Download, Zap, Loader2, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { CourseService } from '@/services/course.service';
import { CertificateData } from '@/schemas/course.schema';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

export default function CertificatePage() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const certificateRef = useRef<HTMLDivElement>(null);

    const [certData, setCertData] = useState<CertificateData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        const fetchCert = async () => {
            if (courseId) {
                const data = await CourseService.getCertificate(courseId);
                setCertData(data);
                setIsLoading(false);
            }
        };
        fetchCert();
    }, [courseId]);

    const handleDownload = async () => {
        if (!certificateRef.current) return;

        setIsDownloading(true);
        try {
            const element = certificateRef.current;

            // Use html2canvas to capture the element
            const canvas = await html2canvas(element, {
                scale: 2, // High quality but safe
                useCORS: true,
                logging: false,
                backgroundColor: "#ffffff",
                // THE CRITICAL FIX: Modify the clone to be "Capture Friendly"
                onclone: (clonedDoc) => {
                    const clonedElement = clonedDoc.getElementById('certificate-print-area');
                    if (clonedElement) {
                        // 1. Remove aspect-ratio and box-shadow (confuses html2canvas)
                        clonedElement.style.aspectRatio = 'auto';
                        clonedElement.style.width = '1122px'; // Fixed A4 width
                        clonedElement.style.height = '794px'; // Fixed A4 height
                        clonedElement.style.boxShadow = 'none';
                        clonedElement.style.border = 'none';

                        // 2. Hide all decorative blur elements (causes crashes)
                        const decorElements = clonedElement.querySelectorAll('.blur-\\[100px\\], .opacity-40, .opacity-\\[0\\.03\\]');
                        decorElements.forEach((el: any) => {
                            el.style.display = 'none';
                        });
                    }
                }
            });

            // Convert to JPEG (Faster and often more stable for jsPDF than PNG)
            const imgData = canvas.toDataURL('image/jpeg', 1.0);

            // Create PDF (Landscape, Millimeters, A4)
            const pdf = new jsPDF('l', 'mm', 'a4');
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();

            pdf.addImage(imgData, 'JPEG', 0, 0, pageWidth, pageHeight);
            pdf.save(`Certificate-${certData?.certificateId || 'ForgeInsight'}.pdf`);

        } catch (error) {
            console.error("PDF Generation Error:", error);
            alert("Digital generation failed. Opening print dialog as fallback.");
            window.print();
        } finally {
            setIsDownloading(false);
        }
    };

    if (isLoading) return (
        <div className="h-screen flex flex-col items-center justify-center gap-4">
            <Loader2 className="animate-spin text-[#4F39F6]" size={40} />
            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Generating Certificate...</p>
        </div>
    );

    return (
        <div className="max-w-6xl mx-auto p-6 text-left animate-in fade-in duration-700">
            {/* Action Header */}
            {/* <div className="flex justify-between items-center mb-10 no-print">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold text-sm hover:text-[#4F39F6] transition-colors">
                    <ChevronLeft size={20} /> Back to Course
                </button>
                <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-8 py-3 bg-[#4F39F6] text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-100 hover:bg-[#3f2dd1] transition-all active:scale-95 disabled:opacity-70"
                >
                    {isDownloading ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                    {isDownloading ? "Generating PDF..." : "Download Certificate (PDF)"}
                </button>
            </div> */}

            {/* The Certificate Canvas */}
            <div
                ref={certificateRef}
                id="certificate-print-area"
                className="relative w-full aspect-[1.414/1] bg-white rounded-[40px] shadow-2xl border-[16px] border-slate-50 flex flex-col items-center justify-center p-20 overflow-hidden"
            >
                {/* Background Decoration */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-50 rounded-full blur-[100px] -mr-48 -mt-48 opacity-40" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-50 rounded-full blur-[100px] -ml-48 -mb-48 opacity-40" />

                {/* Logo */}
                <div className="flex items-center gap-3 mb-12 relative">
                    <div className="bg-[#4F39F6] p-2.5 rounded-2xl shadow-lg">
                        <Zap className="text-white fill-white" size={32} />
                    </div>
                    <span className="text-3xl font-black tracking-tighter text-slate-900 uppercase">ForgeInsight</span>
                </div>

                <div className="text-center relative">
                    <p className="text-[#4F39F6] font-black uppercase tracking-[0.5em] text-[13px] mb-8">Certificate of Completion</p>
                    <h1 className="text-2xl font-medium text-slate-400 mb-8 italic">This is to certify that</h1>

                    <h2 className="text-6xl font-black text-slate-900 mb-10 tracking-tight">
                        {certData?.studentName.toUpperCase()}
                    </h2>

                    <p className="max-w-2xl text-lg font-medium text-slate-500 leading-relaxed mx-auto">
                        has successfully completed all requirements and assessments for the professional training course
                        <br />
                        <span className="text-slate-900 font-extrabold block mt-3 text-2xl uppercase tracking-tight">
                            {certData?.courseTitle}
                        </span>
                    </p>
                </div>

                {/* Footer Details */}
                <div className="mt-20 w-full flex justify-between items-end border-t border-slate-100 pt-10 px-10">
                    <div className="text-left">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Issue Date</p>
                        <p className="text-sm font-bold text-slate-700">{certData?.issueDate}</p>
                    </div>
                    <div className="text-center">
                        <div className="w-32 h-0.5 bg-slate-200 mb-3 mx-auto" />
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Authorized By</p>
                        <p className="text-sm font-bold text-slate-800">{certData?.instructorName}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Verify Authenticity</p>
                        <p className="text-sm font-mono font-bold text-slate-700 uppercase tracking-tighter">
                            {certData?.certificateId}
                        </p>
                    </div>
                </div>

                {/* Watermark */}
                <div className="absolute bottom-16 right-16 rotate-12 opacity-[0.03] pointer-events-none">
                    <Zap size={250} className="text-[#4F39F6]" />
                </div>
            </div>
        </div>
    );
}