import React from 'react';
import { useStore } from '../../store';

export const AuthEditor: React.FC = () => {
  const { tabs, activeTabId, updateActiveTabRequest } = useStore();
  const activeTab = tabs.find(t => t.id === activeTabId);

  if (!activeTab) return null;
  const { auth_type, auth_config } = activeTab.request;

  const handleAuthTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateActiveTabRequest((req) => ({
      ...req,
      auth_type: e.target.value as any,
      auth_config: {}
    }));
  };

  const handleConfigChange = (key: string, value: string) => {
    updateActiveTabRequest((req) => ({
      ...req,
      auth_config: {
        ...req.auth_config,
        [key]: value
      }
    }));
  };

  return (
    <div className="w-full flex flex-col gap-4 py-1">
      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Auth Type</label>
        <select
          value={auth_type}
          onChange={handleAuthTypeChange}
          className="w-full md:w-60 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none cursor-pointer"
        >
          <option value="none">No Auth</option>
          <option value="bearer">Bearer Token</option>
          <option value="basic">Basic Auth</option>
          <option value="apikey">API Key</option>
        </select>
      </div>

      <div className="border-t theme-border pt-3 flex flex-col gap-3">
        {auth_type === 'none' && (
          <p className="text-xs text-zinc-500 italic">This request does not use authorization headers.</p>
        )}

        {auth_type === 'bearer' && (
          <div className="flex flex-col gap-2">
            <label className="text-xs theme-text-secondary">Token</label>
            <input
              type="password"
              placeholder="Bearer Token"
              value={auth_config.token || ''}
              onChange={(e) => handleConfigChange('token', e.target.value)}
              className="w-full px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
          </div>
        )}

        {auth_type === 'basic' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs theme-text-secondary">Username</label>
              <input
                type="text"
                placeholder="Username"
                value={auth_config.username || ''}
                onChange={(e) => handleConfigChange('username', e.target.value)}
                className="w-full px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs theme-text-secondary">Password</label>
              <input
                type="password"
                placeholder="Password"
                value={auth_config.password || ''}
                onChange={(e) => handleConfigChange('password', e.target.value)}
                className="w-full px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              />
            </div>
          </div>
        )}

        {auth_type === 'apikey' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <label className="text-xs theme-text-secondary">Key</label>
              <input
                type="text"
                placeholder="X-API-Key"
                value={auth_config.key || ''}
                onChange={(e) => handleConfigChange('key', e.target.value)}
                className="w-full px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs theme-text-secondary">Value</label>
              <input
                type="password"
                placeholder="Key Value"
                value={auth_config.value || ''}
                onChange={(e) => handleConfigChange('value', e.target.value)}
                className="w-full px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs theme-text-secondary">Add to</label>
              <select
                value={auth_config.addTo || 'headers'}
                onChange={(e) => handleConfigChange('addTo', e.target.value)}
                className="w-full px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none cursor-pointer"
              >
                <option value="headers">Headers</option>
                <option value="params">Query Params</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AuthEditor;
