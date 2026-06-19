/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import Editor from '@monaco-editor/react';
import { useStore } from '../../store';

export const BodyEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTabRequest, theme } = useStore();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) return null;
  const { body_type, body_content } = activeTab.request;

  const resolvedTheme = theme === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'vs-dark' : 'vs')
    : (theme === 'dark' ? 'vs-dark' : 'vs');

  const handleBodyTypeChange = (type: any) => {
    updateActiveTabRequest((req) => ({ ...req, body_type: type }));
  };

  const handleEditorChange = (value: string | undefined) => {
    updateActiveTabRequest((req) => ({ ...req, body_content: value || '' }));
  };

  const bodyTypes = [
    { id: 'none', label: 'None' },
    { id: 'json', label: 'JSON' },
    { id: 'x-www-form-urlencoded', label: 'Form Urlencoded' },
    { id: 'raw text', label: 'Raw Text' },
  ];

  return (
    <div className="w-full flex flex-col gap-3 h-full min-h-[200px]">
      <div className="flex gap-2 border-b theme-border pb-2">
        {bodyTypes.map((type) => (
          <button
            key={type.id}
            onClick={() => handleBodyTypeChange(type.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              body_type === type.id
                ? 'bg-[var(--accent-color)] text-white'
                : 'theme-text-secondary hover:bg-[var(--bg-secondary)]'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-[180px] bg-[var(--bg-primary)] rounded-xl overflow-hidden border theme-border relative">
        {body_type === 'none' ? (
          <div className="absolute inset-0 flex items-center justify-center text-xs text-zinc-500 font-medium select-none">
            This request does not have a body
          </div>
        ) : (
          <Editor
            height="100%"
            language={body_type === 'json' ? 'json' : 'plaintext'}
            theme={resolvedTheme}
            value={body_content}
            onChange={handleEditorChange}
            options={{
              minimap: { enabled: false },
              scrollbar: { vertical: 'auto', horizontal: 'auto' },
              lineNumbers: 'on',
              fontSize: 12,
              fontFamily: 'Fira Code, Monaco, monospace',
              padding: { top: 8, bottom: 8 },
              automaticLayout: true
            }}
          />
        )}
      </div>
    </div>
  );
};
export default BodyEditor;
