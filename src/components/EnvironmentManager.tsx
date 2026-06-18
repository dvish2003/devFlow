import React, { useState } from 'react';
import { Plus, Trash2, CheckCircle2 } from 'lucide-react';
import { useStore } from '../store';
import type { Variable } from '../types';

export const EnvironmentManager: React.FC = () => {
  const { environments, variables, createEnvironment, deleteEnvironment, setActiveEnvironment, createVariable, updateVariable, deleteVariable } = useStore();
  const [newEnvName, setNewEnvName] = useState('');
  const [selectedEnvId, setSelectedEnvId] = useState<string | null>(null);

  const [varKey, setVarKey] = useState('');
  const [varVal, setVarVal] = useState('');

  const handleCreateEnv = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnvName.trim()) return;
    await createEnvironment(newEnvName.trim());
    setNewEnvName('');
  };

  const handleAddVariable = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEnvId || !varKey.trim()) return;
    await createVariable(selectedEnvId, varKey.trim(), varVal);
    setVarKey('');
    setVarVal('');
  };

  const activeEnv = environments.find(e => e.is_active === 1);
  const selectedEnv = environments.find(e => e.id === selectedEnvId);
  const currentVariables = variables.filter(v => v.environment_id === selectedEnvId);

  return (
    <div className="flex flex-col gap-4 h-full p-4 theme-text-primary">
      <div className="border-b theme-border pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Environments</h3>
      </div>

      {/* Create Environment Form */}
      <form onSubmit={handleCreateEnv} className="flex gap-2">
        <input
          type="text"
          placeholder="Environment name..."
          value={newEnvName}
          onChange={(e) => setNewEnvName(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
        />
        <button
          type="submit"
          className="p-2 bg-[var(--accent-color)] hover:bg-[var(--accent-hover)] text-white rounded-lg transition-colors cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </form>

      {/* Environments listing */}
      <div className="max-h-[160px] overflow-y-auto flex flex-col gap-1 pr-1 border-b theme-border pb-3">
        {environments.map(env => {
          const isActive = env.is_active === 1;
          const isSelected = env.id === selectedEnvId;

          return (
            <div
              key={env.id}
              onClick={() => setSelectedEnvId(env.id)}
              className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-[var(--bg-secondary)] border theme-border' : 'hover:bg-[var(--bg-secondary)]/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveEnvironment(isActive ? null : env.id);
                  }}
                  title={isActive ? 'Deactivate Environment' : 'Activate Environment'}
                  className={`p-0.5 rounded transition-colors ${isActive ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'}`}
                >
                  <CheckCircle2 size={14} />
                </button>
                <span className="text-xs font-medium">{env.name}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteEnvironment(env.id);
                  if (selectedEnvId === env.id) setSelectedEnvId(null);
                }}
                className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
              >
                <Trash2 size={12} />
              </button>
            </div>
          );
        })}
        {environments.length === 0 && (
          <span className="text-xs text-zinc-500 italic text-center py-2">No environments</span>
        )}
      </div>

      {/* Selected Environment Variables CRUD */}
      {selectedEnv ? (
        <div className="flex-1 flex flex-col gap-3 overflow-hidden">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-indigo-400">Variables ({selectedEnv.name})</span>
          </div>

          <form onSubmit={handleAddVariable} className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Key"
              value={varKey}
              onChange={(e) => setVarKey(e.target.value)}
              className="px-2.5 py-1 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
            />
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Value"
                value={varVal}
                onChange={(e) => setVarVal(e.target.value)}
                className="flex-1 px-2.5 py-1 text-xs theme-text-primary bg-[var(--bg-primary)] border theme-border rounded-lg focus:border-[var(--accent-color)]/50 focus:outline-none"
              />
              <button
                type="submit"
                className="px-2.5 bg-white border theme-border hover:bg-[var(--bg-secondary)] text-[var(--accent-color)] rounded-lg transition-colors cursor-pointer text-xs font-bold"
              >
                Add
              </button>
            </div>
          </form>

          {/* Variables list */}
          <div className="flex-1 overflow-y-auto flex flex-col gap-2 pr-1">
            {currentVariables.map(v => (
              <div key={v.id} className="flex items-center gap-2 bg-[var(--bg-primary)] p-2 rounded-lg border theme-border">
                <input
                  type="checkbox"
                  checked={v.is_enabled === 1}
                  onChange={(e) => updateVariable({ ...v, is_enabled: e.target.checked ? 1 : 0 })}
                  className="w-3.5 h-3.5 accent-blue-500 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={v.key}
                  onChange={(e) => updateVariable({ ...v, key: e.target.value })}
                  className="w-1/3 bg-transparent text-xs theme-text-primary font-mono focus:outline-none border-b border-transparent focus:border-blue-300"
                />
                <input
                  type="text"
                  value={v.value}
                  onChange={(e) => updateVariable({ ...v, value: e.target.value })}
                  className="flex-1 bg-transparent text-xs theme-text-primary font-mono focus:outline-none border-b border-transparent focus:border-blue-300"
                />
                <button
                  onClick={() => deleteVariable(v.id)}
                  className="p-1 text-zinc-500 hover:text-rose-400 cursor-pointer"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
            {currentVariables.length === 0 && (
              <span className="text-[11px] text-zinc-500 italic text-center py-4">No variables configured. Use key double curly brackets `{{var_name}}` to map urls/headers.</span>
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center text-xs text-zinc-500 select-none text-center">
          Select an environment to manage its variables
        </div>
      )}
    </div>
  );
};
export default EnvironmentManager;
