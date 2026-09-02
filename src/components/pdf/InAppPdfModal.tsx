import React from "react";
import InAppPdfViewer, { InAppPdfViewerProps } from "./InAppPdfViewer";

export interface InAppPdfModalProps extends InAppPdfViewerProps {
  isOpen: boolean;
}

export default function InAppPdfModal({
  isOpen,
  onClose,
  ...viewerProps
}: InAppPdfModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-6 animate-in fade-in-50 duration-200">
      <div className="w-full max-w-5xl h-[92vh] flex flex-col rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150">
        <InAppPdfViewer {...viewerProps} onClose={onClose} isModal={true} />
      </div>
    </div>
  );
}
