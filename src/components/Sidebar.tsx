import React, { useEffect, useRef } from 'react';
import { 
  Radar, 
  AlertTriangle, 
  Orbit, 
  Flame, 
  Radio, 
  Compass, 
  Layers,
  X,
  Volume2,
  VolumeX,
  Sun,
  Moon
} from 'lucide-react';
import { NavigationTab, ThemeMode } from '../types';

interface SidebarProps {
  theme: ThemeMode;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  totalTracked: number;
  criticalCount: number;
  closestDistanceLD: number;
  onOpenNasaKeyModal?: () => void;
  apiKeyType?: 'custom' | 'env' | 'demo';
  dataSource?: 'live' | 'cache' | 'offline_fallback';
  isAudioMuted?: boolean;
  onToggleAudio?: () => void;
  onToggleTheme?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  theme,
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  totalTracked,
  criticalCount,
  closestDistanceLD,
  onOpenNasaKeyModal,
  apiKeyType = 'demo',
  dataSource = 'live',
  isAudioMuted = false,
  onToggleAudio,
  onToggleTheme
}) => {
  const sidebarRef = useRef<HTMLElement>(null);

  // Scroll persistence: restore saved scroll position after render/tab changes
  useEffect(() => {
    const savedScroll = sessionStorage.getItem('neo_perigee_sidebar_scroll');
    if (savedScroll && sidebarRef.current) {
      sidebarRef.current.scrollTop = parseInt(savedScroll, 10) || 0;
    }
  }, [activeTab]);

  const handleScroll = () => {
    if (sidebarRef.current) {
      sessionStorage.setItem('neo_perigee_sidebar_scroll', String(sidebarRef.current.scrollTop));
    }
  };

  // Mobile visibility: lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isOpenMobile) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpenMobile]);

  // Mobile visibility: handle Escape key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpenMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpenMobile, onCloseMobile]);

  // Mobile visibility: automatically dismiss mobile drawer when resized to desktop (>=768px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768 && isOpenMobile) {
        onCloseMobile();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpenMobile, onCloseMobile]);

  const navItems = [
    {
      id: 'telemetry-dashboard' as NavigationTab,
      label: 'Telemetry Dashboard',
      icon: Radar,
      badge: 'LIVE'
    },
    {
      id: 'hazard-perigee-monitor' as NavigationTab,
      label: 'Hazard Perigee Monitor',
      icon: AlertTriangle,
      badge: `${criticalCount} PHA`
    },
    {
      id: 'orbital-trajectory-visualizer' as NavigationTab,
      label: 'Trajectory Visualizer',
      icon: Orbit,
      badge: 'POLAR'
    },
    {
      id: 'impact-assessment' as NavigationTab,
      label: 'Kinetic Impact Lab',
      icon: Flame,
      badge: 'CALC'
    }
  ];

  return (
    <>
      {/* Mobile Backdrop with Blur Scrim */}
      {isOpenMobile && (
        <div 
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md md:hidden transition-opacity duration-200"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container: Dedicated 256px Lane with Apple Glass Styling */}
      <aside
        ref={sidebarRef}
        onScroll={handleScroll}
        aria-label="Mission Navigation"
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] w-64 md:w-64 z-[45] flex flex-col justify-between py-4 px-3 border-r transition-all duration-300 backdrop-blur-2xl overflow-y-auto ${
          isOpenMobile 
            ? 'translate-x-0 opacity-100 visible shadow-2xl pointer-events-auto' 
            : '-translate-x-full opacity-0 invisible pointer-events-none md:pointer-events-auto md:opacity-100 md:visible md:translate-x-0 md:shadow-none'
        }`}
        style={{
          backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(245, 247, 252, 0.95)',
          borderColor: 'rgba(124, 128, 156, 0.2)',
          boxShadow: theme === 'deep-space' 
            ? 'inset -1px 0 0 0 rgba(255, 255, 255, 0.04), 8px 0 32px 0 rgba(10, 11, 24, 0.45)' 
            : 'inset -1px 0 0 0 rgba(0, 0, 0, 0.02), 8px 0 32px 0 rgba(29, 31, 58, 0.04)'
        }}
      >
        <div className="flex flex-col gap-3">
          {/* Sidebar Top Header with Mobile Close Action */}
          <div className="px-2 pt-1 flex items-center justify-between">
            <span className="font-headline text-[10px] font-bold uppercase tracking-widest opacity-50">
              Mission Navigation
            </span>
            <div className="flex items-center gap-1.5">
              <span className="text-[9px] font-telemetry px-1.5 py-0.5 rounded-md bg-white/[0.05] border border-white/10 uppercase">
                {dataSource === 'live' ? 'JPL FEED' : 'OFFLINE'}
              </span>
              {/* Mobile Close Button (<768px) */}
              <button
                onClick={onCloseMobile}
                className="md:hidden p-1.5 rounded-lg text-current opacity-70 hover:opacity-100 hover:bg-white/10 transition-colors min-h-[36px] min-w-[36px] flex items-center justify-center -mr-1 active:scale-95"
                aria-label="Close navigation sidebar"
                id="sidebarCloseBtnMobile"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Navigation Items with Apple-Like Soft Glass Pills */}
          <nav className="flex flex-col gap-1.5" aria-label="Main Views">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  id={`nav-${item.id}`}
                  aria-current={isActive ? 'page' : undefined}
                  className={`group relative flex items-center justify-between px-3 py-2.5 rounded-2xl font-headline text-sm font-semibold transition-all duration-200 text-left min-h-[44px] ${
                    isActive
                      ? theme === 'deep-space'
                        ? 'bg-[#d9b43a]/15 text-[#d9b43a] border border-[#d9b43a]/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_16px_rgba(217,180,58,0.15)]'
                        : 'bg-[#d9b43a]/15 text-[#a88214] border border-[#d9b43a]/35 shadow-sm'
                      : 'border border-transparent opacity-70 hover:opacity-100 hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span 
                      className={`w-1 h-4 rounded-full shrink-0 transition-all duration-200 ${
                        isActive
                          ? 'bg-[#d9b43a] scale-100'
                          : 'bg-transparent scale-0'
                      }`}
                      aria-hidden="true"
                    />
                    <Icon 
                      size={18} 
                      className={`shrink-0 transition-colors ${
                        isActive 
                          ? 'text-[#d9b43a]' 
                          : 'opacity-70 group-hover:opacity-100'
                      }`} 
                    />
                    <span className="truncate">{item.label}</span>
                  </div>

                  {/* Badge */}
                  {item.badge && (
                    <span 
                      className={`text-[10px] font-telemetry px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 transition-all ${
                        isActive 
                          ? 'bg-[#d9b43a]/20 text-[#d9b43a] border border-[#d9b43a]/30'
                          : item.id === 'hazard-perigee-monitor'
                            ? 'bg-[#f47b7b]/15 text-[#f47b7b] border border-[#f47b7b]/25'
                            : 'bg-white/10 opacity-70'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Live Mission Telemetry Readouts, System Audio/Theme & NASA API Status */}
        <div className="flex flex-col gap-2.5 pt-4">
          {/* Sound & Theme Console Controls shifted to side panel */}
          <div 
            className="p-3 rounded-2xl border flex flex-col gap-2.5 backdrop-blur-xl"
            style={{
              backgroundColor: theme === 'deep-space' ? 'rgba(76, 79, 123, 0.22)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: 'rgba(124, 128, 156, 0.2)',
              boxShadow: theme === 'deep-space' ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <div className="flex items-center justify-between px-0.5">
              <span className="text-[10px] font-headline font-bold uppercase tracking-wider opacity-50">
                Console Preferences
              </span>
              <span className="text-[9px] font-telemetry px-1.5 py-0.5 rounded-full bg-[#d9b43a]/10 text-[#d9b43a] font-semibold border border-[#d9b43a]/20">
                AUDIO & THEME
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Sound Audio Toggle */}
              {onToggleAudio && (
                <button
                  onClick={onToggleAudio}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all active:scale-95 min-h-[44px] ${
                    !isAudioMuted
                      ? theme === 'deep-space'
                        ? 'bg-[#d9b43a]/15 border-[#d9b43a]/30 text-[#d9b43a] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]'
                        : 'bg-[#d9b43a]/15 border-[#d9b43a]/30 text-[#a88214] font-semibold'
                      : 'bg-white/[0.04] border-white/10 opacity-70 hover:opacity-100 text-current'
                  }`}
                  id="sidebarAudioToggleBtn"
                  title={isAudioMuted ? 'Acoustic Telemetry: Muted (Click to enable)' : 'Acoustic Telemetry: Active (Click to mute)'}
                >
                  <div className={`p-1.5 rounded-lg shrink-0 ${!isAudioMuted ? 'bg-[#d9b43a]/20 text-[#d9b43a]' : 'bg-white/10 opacity-60'}`}>
                    {!isAudioMuted ? <Volume2 size={15} /> : <VolumeX size={15} />}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-headline font-bold leading-tight truncate">
                      {!isAudioMuted ? 'Sound ON' : 'Muted'}
                    </span>
                    <span className="text-[9px] font-telemetry opacity-60 uppercase truncate">
                      {!isAudioMuted ? 'Telemetry' : 'Silent'}
                    </span>
                  </div>
                </button>
              )}

              {/* Theme Mode Toggle */}
              {onToggleTheme && (
                <button
                  onClick={onToggleTheme}
                  className={`flex items-center gap-2 p-2 rounded-xl border text-left transition-all active:scale-95 min-h-[44px] ${
                    theme === 'deep-space'
                      ? 'bg-white/[0.04] border-white/10 hover:border-[#d9b43a]/40 text-current'
                      : 'bg-white border-slate-200 text-slate-800 shadow-sm'
                  }`}
                  id="sidebarThemeToggleBtn"
                  title={`Switch to ${theme === 'deep-space' ? 'Frosted Atmosphere (Light)' : 'Deep Space (Dark)'} Theme`}
                >
                  <div className="p-1.5 rounded-lg shrink-0 bg-[#d9b43a]/20 text-[#d9b43a]">
                    {theme === 'deep-space' ? (
                      <Sun size={15} className="text-[#d9b43a]" />
                    ) : (
                      <Moon size={15} className="text-[#4c4f7b]" />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-headline font-bold leading-tight truncate">
                      {theme === 'deep-space' ? 'Deep Space' : 'Atmosphere'}
                    </span>
                    <span className="text-[9px] font-telemetry opacity-60 uppercase truncate">
                      {theme === 'deep-space' ? 'Dark' : 'Light'}
                    </span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* NASA API Key Status Button */}
          {onOpenNasaKeyModal && (
            <button
              onClick={onOpenNasaKeyModal}
              className="p-3 rounded-2xl border flex items-center justify-between text-left transition-all active:scale-98 hover:border-[#d9b43a]/40 backdrop-blur-xl"
              style={{
                backgroundColor: theme === 'deep-space' ? 'rgba(76, 79, 123, 0.22)' : 'rgba(255, 255, 255, 0.75)',
                borderColor: 'rgba(124, 128, 156, 0.2)',
                boxShadow: theme === 'deep-space' ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.05)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
              }}
              title="Configure NASA NeoWs API Key"
              id="sidebarNasaApiBtn"
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-headline uppercase font-bold opacity-50">NASA NeoWs API</span>
                <span className="text-xs font-telemetry font-bold text-[#d9b43a]">
                  {apiKeyType === 'custom' ? 'Personal Key (1k/hr)' : apiKeyType === 'env' ? 'Env Config Key' : 'DEMO KEY (30/hr)'}
                </span>
              </div>
              <span className="text-[10px] font-headline font-semibold px-2 py-0.5 rounded-full bg-[#d9b43a]/15 text-[#d9b43a] border border-[#d9b43a]/25">
                Configure
              </span>
            </button>
          )}

          {/* Monitored Metrics Widget */}
          <div 
            className="p-3 rounded-2xl border flex flex-col gap-2.5 backdrop-blur-xl"
            style={{
              backgroundColor: theme === 'deep-space' ? 'rgba(76, 79, 123, 0.18)' : 'rgba(255, 255, 255, 0.65)',
              borderColor: 'rgba(124, 128, 156, 0.2)',
              boxShadow: theme === 'deep-space' ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.04)' : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.8)'
            }}
          >
            <div className="flex justify-between items-center text-xs">
              <span className="font-headline text-[10px] uppercase font-bold opacity-60 flex items-center gap-1.5">
                <Layers size={13} className="text-[#d9b43a]" /> Monitored NEOs
              </span>
              <span className="font-telemetry font-bold text-emerald-400">
                {totalTracked.toLocaleString()}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-headline text-[10px] uppercase font-bold opacity-60 flex items-center gap-1.5">
                <AlertTriangle size={13} className="text-[#f47b7b]" /> Critical PHA
              </span>
              <span className="font-telemetry font-bold text-[#f47b7b]">
                {criticalCount}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs">
              <span className="font-headline text-[10px] uppercase font-bold opacity-60 flex items-center gap-1.5">
                <Compass size={13} className="text-[#d9b43a]" /> Closest Perigee
              </span>
              <span className="font-telemetry font-bold text-[#d9b43a]">
                {closestDistanceLD.toFixed(3)} LD
              </span>
            </div>
          </div>

          {/* DSN Ground Link Station Status */}
          <div className="px-2 py-1 flex items-center justify-between text-[11px] font-telemetry opacity-50">
            <span className="flex items-center gap-1.5">
              <Radio size={12} className="text-emerald-400" />
              GOLDSTONE DSS-14
            </span>
            <span>X-BAND</span>
          </div>
        </div>
      </aside>
    </>
  );
};
