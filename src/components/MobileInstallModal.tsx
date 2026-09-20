import React from 'react';
import { 
  Download, 
  Share, 
  PlusSquare, 
  X, 
  Smartphone, 
  ShieldCheck, 
  Zap, 
  WifiOff, 
  CheckCircle2 
} from 'lucide-react';
import { ThemeMode } from '../types';

interface MobileInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => Promise<boolean>;
  isInstallable: boolean;
  isIOS: boolean;
  theme: ThemeMode;
}

export const MobileInstallModal: React.FC<MobileInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isInstallable,
  isIOS,
  theme
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/92 backdrop-blur-2xl animate-fade-in"
      onClick={onClose}
      id="mobile-install-pwa-backdrop"
    >
      <div 
        className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl border shadow-2xl overflow-hidden animate-slide-up flex flex-col"
        style={{
          backgroundColor: theme === 'deep-space' ? '#181a30' : '#ffffff',
          borderColor: theme === 'deep-space' ? 'rgba(217, 180, 58, 0.3)' : 'rgba(217, 180, 58, 0.35)',
          color: theme === 'deep-space' ? '#F8FAFC' : '#1d1f3a'
        }}
        onClick={(e) => e.stopPropagation()}
        id="mobile-install-pwa-card"
      >
        {/* Modal Header */}
        <div className="p-4 sm:p-5 flex items-start justify-between border-b border-white/10 relative">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 rounded-2xl overflow-hidden border-2 border-[#d9b43a]/40 shadow-md bg-[#141629] p-1.5 shrink-0 flex items-center justify-center">
              <img 
                src="/favicon.svg" 
                alt="NEO-PeriGee Icon" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer" 
              />
              <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none"></div>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-headline font-bold text-base sm:text-lg tracking-tight">
                  NEO-PeriGee
                </h3>
                <span className="px-1.5 py-0.5 rounded text-[9px] font-telemetry uppercase tracking-wider font-bold bg-[#d9b43a]/20 text-[#d9b43a] border border-[#d9b43a]/30">
                  WEB APP
                </span>
              </div>
              <p className="text-xs opacity-70 font-headline mt-0.5">
                Planetary Defense &amp; Orbital Radar
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-current opacity-70 hover:opacity-100 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center"
            aria-label="Close install prompt"
            id="closeInstallModalBtn"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body & Benefits */}
        <div className="p-4 sm:p-5 space-y-4">
          <div className="text-xs sm:text-sm opacity-80 leading-relaxed font-body">
            Install NEO-PeriGee on your home screen for the full-screen mission experience with zero browser address bar obstruction.
          </div>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 gap-2.5 font-telemetry text-xs">
            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="p-1.5 rounded-lg bg-[#d9b43a]/15 text-[#d9b43a]">
                <Smartphone size={16} />
              </div>
              <div className="min-w-0">
                <span className="font-bold block text-current">Full-Screen Radar Scope</span>
                <span className="text-[10px] opacity-60 block">Maximized viewport for 360° flyby inspection</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-400">
                <Zap size={16} />
              </div>
              <div className="min-w-0">
                <span className="font-bold block text-current">Instant Home Screen Launch</span>
                <span className="text-[10px] opacity-60 block">One-tap direct access with native app performance</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.04] border border-white/10">
              <div className="p-1.5 rounded-lg bg-[#f47b7b]/15 text-[#f47b7b]">
                <WifiOff size={16} />
              </div>
              <div className="min-w-0">
                <span className="font-bold block text-current">Offline Telemetry Caching</span>
                <span className="text-[10px] opacity-60 block">Retains kinetic impact models and orbit data offline</span>
              </div>
            </div>
          </div>

          {/* Installation Instructions / Trigger */}
          {isIOS ? (
            /* iOS Safari Step-by-Step Instructions */
            <div className="p-3.5 rounded-2xl bg-[#d9b43a]/10 border border-[#d9b43a]/30 text-xs font-telemetry space-y-2">
              <span className="font-bold text-[#d9b43a] flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <Share size={13} />
                How to install on iOS Safari:
              </span>
              <ol className="space-y-1.5 text-[11px] opacity-90 pl-1 list-decimal list-inside">
                <li>
                  Tap the <strong className="text-current inline-flex items-center gap-1"><Share size={11} className="inline" /> Share</strong> icon in the Safari navigation bar.
                </li>
                <li>
                  Scroll down the share sheet and tap <strong className="text-current inline-flex items-center gap-1"><PlusSquare size={11} className="inline" /> Add to Home Screen</strong>.
                </li>
                <li>
                  Tap <strong className="text-[#d9b43a]">Add</strong> in the top-right corner.
                </li>
              </ol>
            </div>
          ) : isInstallable ? (
            /* Android / Chrome / Samsung Internet Instant Prompt */
            <div className="space-y-2 pt-1">
              <button
                onClick={() => onInstall()}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-headline font-bold text-sm bg-[#d9b43a] text-[#141629] hover:bg-[#e6c24d] active:scale-98 transition-all shadow-lg min-h-[46px]"
                id="pwaInstallDirectBtn"
              >
                <Download size={17} />
                <span>Install NEO-PeriGee App</span>
              </button>
            </div>
          ) : (
            /* Generic Chromium / Mobile Browser Instructions */
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-xs font-telemetry space-y-1">
              <span className="font-bold opacity-90 block">To install from browser:</span>
              <p className="text-[11px] opacity-70">
                Tap your browser menu (<strong>&vellip;</strong> or <strong>Share</strong>) and select <strong>&ldquo;Install App&rdquo;</strong> or <strong>&ldquo;Add to Home screen&rdquo;</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 pt-2 border-t border-white/10 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-headline font-semibold opacity-70 hover:opacity-100 hover:bg-white/5 transition-all text-center min-h-[40px]"
            id="dismissPwaModalBtn"
          >
            Maybe Later
          </button>
          
          {isInstallable && (
            <button
              onClick={() => onInstall()}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-headline font-bold bg-[#d9b43a]/20 text-[#d9b43a] border border-[#d9b43a]/40 hover:bg-[#d9b43a]/30 active:scale-98 transition-all flex items-center justify-center gap-1.5 min-h-[40px]"
              id="confirmPwaInstallBtn"
            >
              <Download size={14} />
              <span>Install</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
