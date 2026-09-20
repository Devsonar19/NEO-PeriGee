import React from 'react';
import { 
  Radio, 
  RefreshCw, 
  Menu, 
  X, 
  ShieldAlert, 
  Satellite, 
  Key,
  Download
} from 'lucide-react';
import { ThemeMode, NavigationTab } from '../types';

interface HeaderProps {
  theme: ThemeMode;
  onRefresh: () => void;
  isRefreshing: boolean;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isMobileSidebarOpen: boolean;
  onToggleMobileSidebar: () => void;
  onOpenKineticLab: () => void;
  onOpenNasaKeyModal?: () => void;
  apiKeyType?: 'custom' | 'env' | 'demo';
  dataSource?: 'live' | 'cache' | 'offline_fallback';
  onOpenInstallModal?: () => void;
  isAppInstalled?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  theme,
  onRefresh,
  isRefreshing,
  isMobileSidebarOpen,
  onToggleMobileSidebar,
  onOpenKineticLab,
  onOpenNasaKeyModal,
  apiKeyType = 'demo',
  dataSource = 'live',
  onOpenInstallModal,
  isAppInstalled = false
}) => {
  return (
    <header 
      className="fixed top-0 left-0 w-full z-50 transition-all duration-300 border-b backdrop-blur-2xl"
      style={{
        backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.94)' : 'rgba(245, 247, 252, 0.94)',
        borderColor: 'rgba(124, 128, 156, 0.22)',
        boxShadow: theme === 'deep-space' 
          ? 'inset 0 -1px 0 0 rgba(255, 255, 255, 0.04), 0 8px 32px 0 rgba(10, 11, 24, 0.45)' 
          : 'inset 0 -1px 0 0 rgba(0, 0, 0, 0.02), 0 8px 32px 0 rgba(29, 31, 58, 0.06)'
      }}
    >
      <div className="h-16 w-full px-2.5 sm:px-6 flex items-center justify-between gap-1.5 sm:gap-4 max-w-[1700px] mx-auto min-w-0">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-shrink">
          <button
            onClick={onToggleMobileSidebar}
            className="md:hidden p-1.5 sm:p-2 rounded-xl text-current opacity-80 hover:opacity-100 hover:bg-white/10 transition-colors min-h-[40px] min-w-[40px] flex items-center justify-center active:scale-95 shrink-0"
            aria-label="Toggle navigation menu"
            id="mobileMenuToggle"
          >
            {isMobileSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <div 
            className="flex items-center gap-2 cursor-pointer select-none group min-w-0" 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <div 
              className="relative flex items-center justify-center w-8 h-8 rounded-xl sm:rounded-2xl overflow-hidden shrink-0 shadow-sm transition-transform duration-200 group-hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, #d9b43a, #4c4f7b)'
              }}
            >
              <Satellite className="text-white w-4 h-4" />
              <div className="absolute inset-0 border border-white/25 rounded-xl sm:rounded-2xl"></div>
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-headline font-bold text-sm sm:text-lg tracking-tight text-current truncate">
                  NEO-PeriGee
                </span>
                <span 
                  className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-full font-telemetry uppercase tracking-wider font-semibold border shrink-0"
                  style={{
                    backgroundColor: 'rgba(217, 180, 58, 0.12)',
                    borderColor: 'rgba(217, 180, 58, 0.3)',
                    color: '#d9b43a'
                  }}
                >
                  ASTROMETRIC
                </span>
              </div>
              <span className="text-[10px] font-headline uppercase tracking-wider opacity-60 -mt-0.5 hidden md:inline truncate">
                Orbital Threat Assessment
              </span>
            </div>
          </div>
        </div>

        {/* Center: Live Mission Status Badges (Apple subtle pills) */}
        <div className="hidden lg:flex items-center gap-2 text-xs font-telemetry">
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(76, 79, 123, 0.25)',
              borderColor: 'rgba(124, 128, 156, 0.25)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#d9b43a] animate-pulse"></span>
            <span className="opacity-80">DEFCON 4 NOMINAL</span>
          </div>
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(76, 79, 123, 0.25)',
              borderColor: 'rgba(124, 128, 156, 0.25)'
            }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span className="opacity-70">RADAR 360° SWEEP</span>
          </div>
          <div 
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border backdrop-blur-md"
            style={{
              backgroundColor: 'rgba(76, 79, 123, 0.25)',
              borderColor: 'rgba(124, 128, 156, 0.25)'
            }}
          >
            <Radio size={12} className="text-[#d9b43a]" />
            <span className="opacity-70">JPL SENTRY ONLINE</span>
          </div>
        </div>

        {/* Right: Quick Action Controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Install Web App Action Button */}
          {!isAppInstalled && onOpenInstallModal && (
            <button
              onClick={onOpenInstallModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-headline font-semibold border transition-all active:scale-95 min-h-[36px] sm:min-h-[38px] backdrop-blur-md shrink-0 shadow-sm"
              style={{
                backgroundColor: 'rgba(217, 180, 58, 0.16)',
                borderColor: 'rgba(217, 180, 58, 0.35)',
                color: '#d9b43a'
              }}
              title="Install NEO-PeriGee Web App on Device"
              id="headerInstallPwaBtn"
            >
              <Download size={13} className="shrink-0 animate-bounce" />
              <span className="font-telemetry text-xs font-bold">
                Install
              </span>
            </button>
          )}

          {/* NASA API Key Status Pill */}
          {onOpenNasaKeyModal && (
            <button
              onClick={onOpenNasaKeyModal}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-xl text-xs font-headline font-medium border transition-all active:scale-95 min-h-[36px] sm:min-h-[38px] backdrop-blur-md shrink-0"
              style={{
                backgroundColor: apiKeyType === 'custom' ? 'rgba(52, 211, 153, 0.14)' : 'rgba(217, 180, 58, 0.12)',
                borderColor: apiKeyType === 'custom' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(217, 180, 58, 0.3)',
                color: apiKeyType === 'custom' ? '#34d399' : '#d9b43a'
              }}
              title="NASA NeoWs API Connection & API Key Configuration"
              id="headerNasaApiKeyBtn"
            >
              <Key size={13} className="shrink-0" />
              <span className="hidden sm:inline font-telemetry text-xs font-semibold">
                {apiKeyType === 'custom' ? 'Key Active' : 'DEMO KEY'}
              </span>
              <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${dataSource === 'live' ? 'bg-[#d9b43a] animate-pulse' : 'bg-[#7c809c]'}`} />
            </button>
          )}

          {/* Quick Launch Impact Simulator */}
          <button
            onClick={onOpenKineticLab}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-headline font-semibold border transition-all active:scale-95 min-h-[38px] shrink-0"
            style={{
              backgroundColor: 'rgba(244, 123, 123, 0.12)',
              borderColor: 'rgba(244, 123, 123, 0.3)',
              color: '#f47b7b'
            }}
            title="Open Interactive Kinetic Impact Lab"
            id="openKineticLabBtn"
          >
            <ShieldAlert size={14} className="text-[#f47b7b]" />
            <span>Kinetic Lab</span>
          </button>

          {/* Refresh NASA Telemetry */}
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 rounded-xl border transition-all active:scale-95 disabled:opacity-50 min-h-[36px] min-w-[36px] sm:min-h-[38px] sm:min-w-[38px] flex items-center justify-center text-current shrink-0"
            style={{
              backgroundColor: 'rgba(76, 79, 123, 0.25)',
              borderColor: 'rgba(124, 128, 156, 0.25)'
            }}
            title="Refresh NASA NeoWs Telemetry"
            aria-label="Refresh Telemetry"
            id="refreshTelemetryBtn"
          >
            <RefreshCw size={14} className={`text-current ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>
    </header>
  );
};
