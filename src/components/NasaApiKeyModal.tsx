import React, { useState, useEffect } from 'react';
import { Key, ShieldCheck, ExternalLink, X, RefreshCw, AlertCircle, CheckCircle2, Zap } from 'lucide-react';
import { ThemeMode } from '../types';
import { getNasaApiKey, setCustomNasaApiKey, getNasaKeyInfo } from '../services/neoService';

interface NasaApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onKeyUpdated: () => void;
  rateLimitRemaining?: number;
  rateLimitTotal?: number;
  dataSource: 'live' | 'cache' | 'offline_fallback';
  lastUpdated: string;
}

export const NasaApiKeyModal: React.FC<NasaApiKeyModalProps> = ({
  isOpen,
  onClose,
  theme,
  onKeyUpdated,
  rateLimitRemaining,
  rateLimitTotal,
  dataSource,
  lastUpdated
}) => {
  const [inputKey, setInputKey] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [keyInfo, setKeyInfo] = useState(getNasaKeyInfo());

  useEffect(() => {
    if (isOpen) {
      const info = getNasaKeyInfo();
      setKeyInfo(info);
      setInputKey(info.type === 'custom' ? info.key : '');
      setSaveSuccess(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomNasaApiKey(inputKey.trim());
    setSaveSuccess(true);
    setKeyInfo(getNasaKeyInfo());
    onKeyUpdated();
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2500);
  };

  const handleResetToDemo = () => {
    setCustomNasaApiKey('');
    setInputKey('');
    setKeyInfo(getNasaKeyInfo());
    onKeyUpdated();
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="w-full max-w-lg rounded-2xl border p-5 sm:p-6 shadow-2xl flex flex-col gap-4 relative max-h-[90vh] overflow-y-auto"
        style={{
          backgroundColor: theme === 'deep-space' ? '#1d1f3a' : '#ffffff',
          borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
          color: theme === 'deep-space' ? '#f1f5f9' : '#0f172a'
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d9b43a]/15 text-[#d9b43a] border border-[#d9b43a]/30">
              <Key size={20} />
            </div>
            <div>
              <h2 className="font-headline text-lg font-bold tracking-tight">NASA NeoWs API Link</h2>
              <p className="text-xs opacity-60">Real-Time Near-Earth Object Telemetry Pipeline</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors"
            aria-label="Close API Modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Status Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-telemetry">
          <div>
            <span className="opacity-50 text-[10px] block uppercase">Feed Status</span>
            <div className="flex items-center gap-1.5 font-bold mt-0.5">
              <span className={`w-2 h-2 rounded-full ${
                dataSource === 'live' ? 'bg-[#d9b43a] animate-pulse' : dataSource === 'cache' ? 'bg-[#7c809c]' : 'bg-[#f47b7b]'
              }`} />
              <span className={dataSource === 'live' ? 'text-[#d9b43a]' : dataSource === 'cache' ? 'text-[#7c809c]' : 'text-[#f47b7b]'}>
                {dataSource === 'live' ? 'LIVE JPL' : dataSource === 'cache' ? 'CACHED' : 'OFFLINE'}
              </span>
            </div>
          </div>

          <div>
            <span className="opacity-50 text-[10px] block uppercase">Rate Quota</span>
            <div className="font-bold text-[#d9b43a] mt-0.5">
              {rateLimitRemaining !== undefined ? `${rateLimitRemaining} / ${rateLimitTotal || 30}` : keyInfo.type === 'custom' ? '1,000 / hr' : '30 / hr (Demo)'}
            </div>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <span className="opacity-50 text-[10px] block uppercase">Active Tier</span>
            <div className="font-semibold opacity-90 mt-0.5 capitalize">
              {keyInfo.type === 'custom' ? 'Personal Key' : keyInfo.type === 'env' ? 'Config Env' : 'NASA Demo Key'}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="text-xs leading-relaxed opacity-80 flex flex-col gap-1.5 p-3 rounded-xl bg-[#4c4f7b]/20 border border-[#4c4f7b]/40 text-white">
          <div className="flex items-center gap-1.5 font-semibold text-[#d9b43a]">
            <ShieldCheck size={15} />
            <span>Direct NASA Jet Propulsion Laboratory Feed</span>
          </div>
          <p>
            NEO-PeriGee connects directly to <code className="bg-black/30 px-1 py-0.5 rounded text-[#d9b43a]">api.nasa.gov/neo/rest/v1/feed</code>. By default, it operates with NASA's public <span className="font-bold">DEMO_KEY</span>. Providing your free personal key raises the request limit from 30/hr to 1,000/hr.
          </p>
        </div>

        {/* Input Form */}
        <form onSubmit={handleSaveKey} className="flex flex-col gap-3">
          <label className="text-xs font-semibold flex flex-col gap-1">
            <span>Enter NASA API Key</span>
            <div className="relative flex items-center">
              <input
                type="text"
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="e.g. DEMO_KEY or your 40-character NASA API Key"
                className="w-full px-3 py-2.5 rounded-xl border font-telemetry text-xs focus:outline-none focus:ring-2 focus:ring-[#d9b43a] transition-all"
                style={{
                  backgroundColor: theme === 'deep-space' ? '#1d1f3a' : '#f8fafc',
                  borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)'
                }}
              />
              {keyInfo.hasCustomKey && (
                <button
                  type="button"
                  onClick={handleResetToDemo}
                  className="absolute right-2 text-[11px] font-semibold text-[#f47b7b] hover:opacity-80 px-2 py-1 rounded bg-[#f47b7b]/10 hover:bg-[#f47b7b]/20 transition-colors"
                >
                  Reset to DEMO_KEY
                </button>
              )}
            </div>
          </label>

          <div className="flex items-center justify-between text-[11px] opacity-70">
            <span>Currently using: <strong className="font-telemetry text-[#d9b43a]">{keyInfo.maskedKey}</strong></span>
            <span>Last sync: {lastUpdated}</span>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-[#d9b43a] font-semibold p-2 rounded-lg bg-[#d9b43a]/10 border border-[#d9b43a]/30">
              <CheckCircle2 size={16} />
              <span>NASA API Key updated successfully! Live telemetry re-synchronized.</span>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-2">
            <a
              href="https://api.nasa.gov/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-[#d9b43a] hover:underline font-semibold"
            >
              <span>Get Free NASA API Key</span>
              <ExternalLink size={13} />
            </a>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-headline font-semibold opacity-70 hover:opacity-100 hover:bg-white/10 transition-all"
              >
                Close
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-headline font-bold bg-[#d9b43a] hover:bg-[#d9b43a]/90 text-[#1d1f3a] transition-all active:scale-95 shadow-md"
              >
                <RefreshCw size={13} />
                <span>Save &amp; Sync</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
