import React, { useState, useRef } from 'react';
import { Printer, Upload, FileText, X, Download, Eye, Type, File } from 'lucide-react';

const SUPPORTED_EXTS = ['.txt', '.md', '.markdown', '.csv', '.json', '.xml', '.html', '.log', '.env', '.docx', '.doc', '.rtf'];

export const PdfGenerator: React.FC = () => {
  const [content, setContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileError, setFileError] = useState('');
  const [docTitle, setDocTitle] = useState('Untitled Document');
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      // For binary formats like .docx, warn and extract text as-is
      if (['.docx', '.doc', '.rtf'].includes(ext)) {
        // Read as text — docx is a zip, so we try basic text extraction
        const reader = new FileReader();
        reader.onload = (e) => {
          const raw = e.target?.result as string;
          // Try to strip XML/binary noise for docx — basic approach
          const cleaned = raw
            .replace(/<[^>]+>/g, ' ')                // strip XML tags
            .replace(/[^\x20-\x7E\n\r\t]/g, ' ')    // strip non-printable
            .replace(/\s{3,}/g, '\n')                 // collapse whitespace
            .trim();
          resolve(cleaned || `[Binary file: ${file.name}]\nThis file format may not render perfectly in text mode. Consider converting to .txt or .md for best results.`);
        };
        reader.onerror = reject;
        reader.readAsText(file, 'utf-8');
      } else {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = reject;
        reader.readAsText(file, 'utf-8');
      }
    });
  };

  const handleFile = async (file: File) => {
    setFileError('');
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    setFileName(file.name);
    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    try {
      const text = await readFileAsText(file);
      setContent(text);
    } catch {
      setFileError('Could not read file. Please try a plain text format.');
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const clearFile = () => {
    setContent('');
    setFileName('');
    setFileError('');
    setDocTitle('Untitled Document');
  };

  const renderMarkdownToPrintHtml = (text: string): string => {
    return text
      .split('\n')
      .map(line => {
        if (line.startsWith('# ')) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith('## ')) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith('### ')) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith('- ') || line.startsWith('* ')) return `<li>${line.slice(2)}</li>`;
        if (line.startsWith('> ')) return `<blockquote>${line.slice(2)}</blockquote>`;
        if (line.trim() === '') return '<br/>';
        // Bold **text**
        const boldLine = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
        // Italic *text*
        const italicLine = boldLine.replace(/\*(.+?)\*/g, '<em>$1</em>');
        return `<p>${italicLine}</p>`;
      })
      .join('\n');
  };

  const handlePrint = () => {
    if (!content.trim()) {
      alert('Please write or load content before printing.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Allow popups to generate print/PDF output.');
      return;
    }

    const isMarkdown = fileName.endsWith('.md') || fileName.endsWith('.markdown') || content.includes('# ') || content.includes('## ');
    const body = isMarkdown ? renderMarkdownToPrintHtml(content) : `<div style="white-space:pre-wrap;">${content}</div>`;

    printWindow.document.write(`<!DOCTYPE html>
<html>
  <head>
    <title>${docTitle}</title>
    <meta charset="utf-8"/>
    <style>
      *, *::before, *::after { box-sizing: border-box; }
      body {
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        padding: 48px 56px;
        color: #1e293b;
        line-height: 1.7;
        font-size: 13px;
        max-width: 900px;
        margin: 0 auto;
      }
      h1 {
        font-size: 28px;
        font-weight: 800;
        color: #1e3a8a;
        border-bottom: 3px solid #2563eb;
        padding-bottom: 10px;
        margin: 0 0 20px;
      }
      h2 {
        font-size: 20px;
        font-weight: 700;
        color: #1d4ed8;
        margin: 28px 0 12px;
      }
      h3 {
        font-size: 15px;
        font-weight: 700;
        color: #2563eb;
        margin: 20px 0 8px;
      }
      p { margin: 0 0 10px; }
      li { margin: 4px 0 4px 24px; list-style: disc; }
      blockquote {
        border-left: 4px solid #2563eb;
        padding: 8px 16px;
        color: #64748b;
        font-style: italic;
        margin: 12px 0;
        background: #f8faff;
      }
      strong { color: #1e3a8a; }
      pre {
        background: #f8fafc;
        border: 1px solid #dbeafe;
        padding: 12px;
        border-radius: 6px;
        font-size: 11px;
        overflow: auto;
      }
      .doc-header {
        border-bottom: 1px solid #dbeafe;
        margin-bottom: 32px;
        padding-bottom: 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 10px;
        color: #94a3b8;
      }
      @page { margin: 20mm; }
      @media print {
        body { padding: 0; }
        .no-print { display: none !important; }
      }
    </style>
  </head>
  <body>
    <div class="doc-header">
      <span><strong>DevFlow Studio</strong> — Document Export</span>
      <span>${new Date().toLocaleString()}</span>
    </div>
    ${body}
  </body>
</html>`);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 300);
  };

  const handleDownloadTxt = () => {
    if (!content.trim()) return;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden theme-bg-primary">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b theme-border gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-color)]/20 flex items-center justify-center">
            <Printer size={16} className="text-[var(--accent-color)]" />
          </div>
          <div>
            <h2 className="text-sm font-bold theme-text-primary">PDF / Document Generator</h2>
            <p className="text-[10px] text-zinc-500">Write text, upload files (.txt .md .docx .csv .json...) and export to PDF</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadTxt}
            disabled={!content.trim()}
            className="px-3 py-1.5 text-xs font-bold theme-text-secondary theme-bg-secondary border theme-border rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer hover:border-[var(--accent-color)]/50 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download size={13} /> Save .txt
          </button>
          <button
            onClick={handlePrint}
            disabled={!content.trim()}
            className="px-4 py-1.5 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Printer size={13} /> Print / Export PDF
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* Left editor pane */}
        <div className="flex-1 flex flex-col border-r theme-border overflow-hidden">
          {/* File upload zone or current file indicator */}
          <div className="px-4 pt-3 pb-2 flex-shrink-0">
            {fileName ? (
              <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-[var(--accent-bg)] border border-[var(--accent-color)]/20">
                <div className="flex items-center gap-2 min-w-0">
                  <File size={13} className="text-[var(--accent-color)] flex-shrink-0" />
                  <span className="text-xs font-semibold text-[var(--accent-color)] truncate">{fileName}</span>
                  <span className="text-[10px] text-zinc-500">loaded</span>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <label className="text-[10px] font-bold text-[var(--accent-color)] cursor-pointer hover:opacity-75 transition-opacity flex items-center gap-1">
                    <Upload size={11} /> Replace
                    <input type="file" accept={SUPPORTED_EXTS.join(',')} onChange={handleFileInput} className="hidden" ref={fileInputRef} />
                  </label>
                  <button onClick={clearFile} className="p-0.5 rounded hover:bg-rose-500/10 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer">
                    <X size={12} />
                  </button>
                </div>
              </div>
            ) : (
              <label
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  isDragging
                    ? 'border-[var(--accent-color)] bg-[var(--accent-bg)]'
                    : 'theme-border hover:border-[var(--accent-color)]/50 hover:bg-[var(--accent-bg)]/50'
                }`}
              >
                <Upload size={18} className="text-zinc-400 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-semibold theme-text-secondary">Upload a file or drag & drop</p>
                  <p className="text-[10px] text-zinc-500 truncate">{SUPPORTED_EXTS.join(' · ')}</p>
                </div>
                <input
                  type="file"
                  accept={SUPPORTED_EXTS.join(',')}
                  onChange={handleFileInput}
                  className="hidden"
                />
              </label>
            )}
            {fileError && (
              <p className="text-[11px] text-rose-500 mt-1.5 px-1">{fileError}</p>
            )}
          </div>

          {/* Doc title input */}
          <div className="px-4 pb-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <Type size={12} className="text-zinc-400 flex-shrink-0" />
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                placeholder="Document title..."
                className="flex-1 text-xs font-semibold theme-text-primary bg-transparent focus:outline-none border-b border-transparent focus:border-[var(--accent-color)]/40 py-0.5 transition-colors"
              />
            </div>
          </div>

          {/* Text editor */}
          <div className="flex-1 px-4 pb-4 min-h-0 overflow-hidden">
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write or paste your document content here... (Markdown is supported)&#10;&#10;# Heading 1&#10;## Heading 2&#10;- Bullet point&#10;**Bold** and *Italic* text&#10;> Blockquote"
              className="w-full h-full p-4 rounded-xl theme-bg-secondary border theme-border text-xs font-mono theme-text-primary focus:outline-none focus:border-[var(--accent-color)]/40 resize-none overflow-auto transition-colors leading-relaxed"
            />
          </div>
        </div>

        {/* Right preview pane */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b theme-border flex items-center gap-2 flex-shrink-0">
            <Eye size={13} className="text-zinc-400" />
            <span className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Document Preview</span>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="m-4 p-8 rounded-xl bg-white border border-gray-200 shadow-sm min-h-full select-text">
              {/* Doc header preview */}
              <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-6">
                <span className="text-[10px] text-gray-400 font-semibold">DevFlow Studio</span>
                <span className="text-[10px] text-gray-400">{new Date().toLocaleDateString()}</span>
              </div>
              {content ? (
                <div className="text-gray-800 font-sans leading-relaxed">
                  {content.split('\n').map((line, i) => {
                    if (line.startsWith('# ')) return (
                      <h1 key={i} className="text-2xl font-extrabold text-blue-900 border-b-2 border-blue-500 pb-2 mb-4 mt-0">{line.slice(2)}</h1>
                    );
                    if (line.startsWith('## ')) return (
                      <h2 key={i} className="text-lg font-bold text-blue-700 mt-5 mb-2">{line.slice(3)}</h2>
                    );
                    if (line.startsWith('### ')) return (
                      <h3 key={i} className="text-base font-bold text-blue-600 mt-4 mb-1.5">{line.slice(4)}</h3>
                    );
                    if (line.startsWith('- ') || line.startsWith('* ')) return (
                      <li key={i} className="ml-5 mb-1 text-gray-700 text-sm">{line.slice(2)}</li>
                    );
                    if (line.startsWith('> ')) return (
                      <blockquote key={i} className="border-l-4 border-blue-400 pl-3 py-1 my-2 text-gray-500 italic text-sm bg-blue-50 rounded-r">{line.slice(2)}</blockquote>
                    );
                    if (line.trim() === '') return <div key={i} className="h-3" />;
                    const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
                    const italic = bold.replace(/\*(.+?)\*/g, '<em>$1</em>');
                    return <p key={i} className="text-sm text-gray-700 mb-1.5" dangerouslySetInnerHTML={{ __html: italic }} />;
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <FileText size={32} className="text-gray-300" />
                  <p className="text-sm text-gray-400">Start writing or upload a file to see the preview</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default PdfGenerator;
