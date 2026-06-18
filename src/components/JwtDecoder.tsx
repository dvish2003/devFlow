import React, { useState } from 'react';
import { Calendar, Key, AlertCircle, CheckCircle, ShieldCheck } from 'lucide-react';

export const JwtDecoder: React.FC = () => {
  const [token, setToken] = useState('');
  const [header, setHeader] = useState<any>(null);
  const [payload, setPayload] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const decodeJwt = (jwt: string) => {
    setError(null);
    setHeader(null);
    setPayload(null);

    if (!jwt.trim()) return;

    const parts = jwt.trim().split('.');
    if (parts.length !== 3) {
      setError('JWT token must consist of exactly 3 parts separated by dots (.)');
      return;
    }

    try {
      // Decode helper (URL Safe base64)
      const base64Decode = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return decodeURIComponent(
          atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
      };

      const decodedHeader = JSON.parse(base64Decode(parts[0]));
      const decodedPayload = JSON.parse(base64Decode(parts[1]));

      setHeader(decodedHeader);
      setPayload(decodedPayload);
    } catch (err: any) {
      setError(err.message || 'Error decoding base64 payload segments');
    }
  };

  const handleInputChange = (val: string) => {
    setToken(val);
    decodeJwt(val);
  };

  const formatClaimsDate = (epoch: number) => {
    try {
      return new Date(epoch * 1000).toLocaleString();
    } catch {
      return 'Invalid Date';
    }
  };

  const isTokenExpired = () => {
    if (!payload || !payload.exp) return false;
    const now = Math.floor(Date.now() / 1000);
    return now > payload.exp;
  };

  return (
    <div className="flex-grow flex flex-col h-full overflow-hidden p-4 gap-4 theme-bg-primary">
      <div className="border-b theme-border pb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">JWT Decoder</h3>
      </div>

      <div className="flex flex-col gap-2">
        <label className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Paste JWT Token</label>
        <textarea
          placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyLCJleHAiOjE4MTYyMzkwMjJ9..."
          value={token}
          onChange={(e) => handleInputChange(e.target.value)}
          className="h-20 w-full p-3 text-xs font-mono theme-text-primary bg-[var(--bg-secondary)] border theme-border rounded-xl focus:border-[var(--accent-color)]/50 focus:outline-none resize-none overflow-y-auto"
        />
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-600 font-mono text-[11px] flex items-center gap-2">
          <AlertCircle size={15} />
          <span>{error}</span>
        </div>
      )}

      {payload && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 overflow-hidden min-h-[300px]">
          {/* Header Panel */}
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Header (Algorithm & Type)</span>
            <pre className="flex-1 p-4 rounded-xl bg-[var(--bg-secondary)] border theme-border text-[11px] font-mono theme-text-primary overflow-auto whitespace-pre-wrap select-text">
              {JSON.stringify(header, null, 2)}
            </pre>
          </div>

          {/* Payload Panel */}
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Payload (Claims)</span>
            <pre className="flex-1 p-4 rounded-xl bg-[var(--bg-secondary)] border theme-border text-[11px] font-mono theme-text-primary overflow-auto whitespace-pre-wrap select-text">
              {JSON.stringify(payload, null, 2)}
            </pre>
          </div>

          {/* Expiry / Summary Panel */}
          <div className="flex flex-col gap-2 min-w-0">
            <span className="text-[11px] font-bold theme-text-secondary uppercase tracking-wider">Decoded Claims Meta</span>
            <div className="flex-1 p-4 rounded-xl bg-white border theme-border overflow-y-auto flex flex-col gap-3">
              {/* Expiry indicator card */}
              <div className={`p-3 rounded-lg border flex items-center gap-3 ${
                isTokenExpired()
                  ? 'bg-rose-50 border-rose-200 text-rose-700'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-700'
              }`}>
                {isTokenExpired() ? <AlertCircle size={18} /> : <CheckCircle size={18} />}
                <div className="flex flex-col">
                  <span className="text-xs font-bold">{isTokenExpired() ? 'Token Expired' : 'Token Active / Valid'}</span>
                  {payload.exp && (
                    <span className="text-[10px] opacity-80">
                      Expires: {formatClaimsDate(payload.exp)}
                    </span>
                  )}
                </div>
              </div>

              {/* Table of standard claims */}
              <div className="flex flex-col gap-2 border-t theme-border pt-3">
                <div className="flex flex-col gap-0.5 text-[11px]">
                  <span className="font-mono font-bold text-zinc-500">subject (sub)</span>
                  <span className="theme-text-primary font-mono truncate">{payload.sub || 'Not specified'}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-[11px] border-t border-zinc-100 pt-1.5">
                  <span className="font-mono font-bold text-zinc-500">issuer (iss)</span>
                  <span className="theme-text-primary font-mono truncate">{payload.iss || 'Not specified'}</span>
                </div>
                <div className="flex flex-col gap-0.5 text-[11px] border-t border-zinc-100 pt-1.5">
                  <span className="font-mono font-bold text-zinc-500">issued at (iat)</span>
                  <span className="theme-text-primary font-mono">
                    {payload.iat ? formatClaimsDate(payload.iat) : 'Not specified'}
                  </span>
                </div>
                {payload.aud && (
                  <div className="flex flex-col gap-0.5 text-[11px] border-t border-zinc-100 pt-1.5">
                    <span className="font-mono font-bold text-zinc-500">audience (aud)</span>
                    <span className="theme-text-primary font-mono truncate">{String(payload.aud)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {!payload && !error && (
        <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 select-none gap-2">
          <ShieldCheck size={36} className="text-blue-500/40" />
          <span className="text-xs font-bold uppercase tracking-wider">No JWT Loaded</span>
          <span className="text-[11px]">Paste a valid bearer JWT token above to decode and audit claim variables.</span>
        </div>
      )}
    </div>
  );
};
export default JwtDecoder;
