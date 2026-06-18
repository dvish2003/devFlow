import React from 'react';

interface PreviewViewerProps {
  body: string;
}

export const PreviewViewer: React.FC<PreviewViewerProps> = ({ body }) => {
  const srcDoc = body;

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border border-[#1a1a24] bg-white">
      <iframe
        title="HTML Preview"
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="w-full h-full border-none"
      />
    </div>
  );
};
export default PreviewViewer;
