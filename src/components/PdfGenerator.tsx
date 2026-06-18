import React, { useState } from 'react';
import { Printer, FileText, Sparkles, Download } from 'lucide-react';

export const PdfGenerator: React.FC = () => {
  const [content, setContent] = useState(
    `# Project Development Summary\n\nGenerated with DevFlow Studio.\n\nDate: ${new Date().toLocaleDateString()}\n\n## Overview\nThis document describes the workspace enhancements, API endpoints, database schemas, and tool specifications.\n\n## Team Members\n- Lead Architect: Vishan Chathuranga\n- Core Engineer: Antigravity AI\n\n## Next Steps\n1. Launch the SQLite connector modules.\n2. Verify cross-platform builds.\n`
  );

  const handlePrint = () => {
    // Open a print window or print container
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow popups to generate print previews');
      return;
    }
    printWindow.document.write(`
      <html>
        <head>
          <title>DevFlow PDF Print Document</title>
          <style>
            body {
              font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
              padding: 40px;
              color: #1e293b;
              line-height: 1.6;
            }
            h1 {
              border-bottom: 2px solid #2563eb;
              padding-bottom: 8px;
              color: #1e3a8a;
              font-size: 24px;
            }
            h2 {
              color: #2563eb;
              font-size: 18px;
              margin-top: 24px;
            }
            ul {
              padding-left: 20px;
            }
            li {
              margin-bottom: 8px;
            }
            pre {
              background: #f8fafc;
              border: 1px solid #dbeafe;
              padding: 12px;
              border-radius: 6px;
              font-family: monospace;
            }
          </style>
        </head>
        <body>
          <div style="white-space: pre-wrap;">${content}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Delay slightly to ensure parsing finished
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden p-4 gap-4 theme-bg-primary">
      <div className="border-b theme-border pb-3 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">PDF Generator & Printer</h3>
        <button
          onClick={handlePrint}
          className="px-4 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <Printer size={13} />
          Print / Save PDF
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden min-h-[350px]">
        {/* Editor Pane */}
        <div className="flex flex-col gap-2 min-w-0">
          <label className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Document Text</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write document text here..."
            className="flex-1 p-4 rounded-xl bg-[var(--bg-secondary)] border theme-border text-xs font-sans theme-text-primary focus:outline-none resize-none overflow-auto"
          />
        </div>

        {/* Live Preview Panel */}
        <div className="flex flex-col gap-2 min-w-0">
          <label className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Live Preview</label>
          <div className="flex-1 p-6 rounded-xl border theme-border bg-white overflow-y-auto select-text font-sans text-xs theme-text-primary leading-relaxed whitespace-pre-wrap">
            {content || <em className="text-zinc-500">Document is empty.</em>}
          </div>
        </div>
      </div>
    </div>
  );
};
export default PdfGenerator;
