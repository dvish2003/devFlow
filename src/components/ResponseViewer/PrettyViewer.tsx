import React from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store';

interface PrettyViewerProps {
  body: string;
}

export const PrettyViewer: React.FC<PrettyViewerProps> = ({ body }) => {
  const { theme } = useStore();
  let formattedBody = body;
  let language = 'plaintext';

  try {
    // Attempt formatting if it's JSON
    const parsed = JSON.parse(body);
    formattedBody = JSON.stringify(parsed, null, 2);
    language = 'json';
  } catch {
    // If body contains HTML elements
    if (body.trim().startsWith('<')) {
      language = 'html';
    }
  }

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs')
    : (theme === 'dark' ? 'vs-dark' : 'vs');

  return (
    <div className="w-full h-full rounded-xl overflow-hidden border theme-border bg-[var(--bg-primary)]">
      <Editor
        height="100%"
        language={language}
        theme={resolvedTheme}
        value={formattedBody}
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollbar: { vertical: 'auto', horizontal: 'auto' },
          lineNumbers: 'on',
          fontSize: 12,
          fontFamily: 'Fira Code, Monaco, monospace',
          padding: { top: 8, bottom: 8 },
          automaticLayout: true
        }}
      />
    </div>
  );
};
export default PrettyViewer;
