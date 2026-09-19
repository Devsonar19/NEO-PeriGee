import React, { useState, useEffect, useCallback } from 'react';
import { 
  Header 
} from './components/Header';
import { 
  Sidebar 
} from './components/Sidebar';
import { 
  MetricCards 
} from './components/MetricCards';
import { 
  TrajectoryRadar 
} from './components/TrajectoryRadar';
import { 
  PerigeeScatterPlot 
} from './components/PerigeeScatterPlot';
import { 
  NeoTable 
} from './components/NeoTable';
import { 
  NeoDetailsPane 
} from './components/NeoDetailsPane';
import { 
  KineticCalculatorModal 
} from './components/KineticCalculatorModal';
import { 
  NasaApiKeyModal 
} from './components/NasaApiKeyModal';
import { 
  HazardPerigeeView 
} from './components/HazardPerigeeView';
import { 
  KineticLabView 
} from './components/KineticLabView';
import { 
  BottomNav 
} from './components/BottomNav';
import { 
  MissionStations 
} from './components/MissionStations';
import { 
  fetchTodayNeos, 
  FetchNeoResponse 
} from './services/neoService';
import { 
  NeoObject, 
  ThemeMode, 
  NavigationTab, 
  FilterCategory 
} from './types';
import { 
  Satellite, 
  Radio, 
  Orbit
} from 'lucide-react';

const VALID_TABS: NavigationTab[] = [
  'telemetry-dashboard',
  'hazard-perigee-monitor',
  'orbital-trajectory-visualizer',
  'impact-assessment'
];

function getTabFromLocation(): NavigationTab {
  if (typeof window === 'undefined') return 'telemetry-dashboard';
  const cleanHash = window.location.hash.replace('#', '').trim();
  if (VALID_TABS.includes(cleanHash as NavigationTab)) {
    return cleanHash as NavigationTab;
  }
  return 'telemetry-dashboard';
}

export default function App() {
  const [theme, setTheme] = useState<ThemeMode>('deep-space');
  const [activeTab, setActiveTab] = useState<NavigationTab>(getTabFromLocation);
  const [neos, setNeos] = useState<NeoObject[]>([]);
  const [selectedNeo, setSelectedNeo] = useState<NeoObject | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [telemetryMeta, setTelemetryMeta] = useState<{
    source: 'live' | 'cache' | 'offline_fallback';
    lastUpdated: string;
    totalTracked: number;
    criticalCount: number;
    rateLimitRemaining?: number;
    rateLimitTotal?: number;
    apiKeyType?: 'custom' | 'env' | 'demo';
  }>({
    source: 'cache',
    lastUpdated: '00:00:00',
    totalTracked: 1482,
    criticalCount: 7,
    apiKeyType: 'demo'
  });

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState<boolean>(false);
  const [isKineticLabOpen, setIsKineticLabOpen] = useState<boolean>(false);
  const [isNasaKeyModalOpen, setIsNasaKeyModalOpen] = useState<boolean>(false);
  const [isMobileDetailsOpen, setIsMobileDetailsOpen] = useState<boolean>(false);

  // Sync theme with document element
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'deep-space') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  // Load telemetry data from NASA NeoWs or cache
  const loadTelemetry = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const response: FetchNeoResponse = await fetchTodayNeos(forceRefresh);
      setNeos(response.objects);
      setTelemetryMeta({
        source: response.source,
        lastUpdated: response.lastUpdated,
        totalTracked: response.totalTracked,
        criticalCount: response.criticalCount,
        rateLimitRemaining: response.rateLimitRemaining,
        rateLimitTotal: response.rateLimitTotal,
        apiKeyType: response.apiKeyType
      });

      // Default select the most critical hazardous object or the closest object
      if (response.objects.length > 0) {
        const apophis = response.objects.find((n) => n.name.includes('Apophis'));
        setSelectedNeo(apophis || response.objects[0]);
      }
      // Never throw the details drawer on mobile on initial load or on refresh
      setIsMobileDetailsOpen(false);
    } catch {
      // Handled in neoService fallback
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadTelemetry();
  }, [loadTelemetry]);

  // Handle asteroid selection
  const handleSelectNeo = (neo: NeoObject) => {
    setSelectedNeo(neo);
    setIsMobileDetailsOpen(true);
  };

  // Toggle theme between Deep Space and Frosted Atmosphere
  const handleToggleTheme = () => {
    setTheme((prev) => (prev === 'deep-space' ? 'frosted-atmosphere' : 'deep-space'));
  };

  // Synchronize browser URL hash and history state with activeTab state
  useEffect(() => {
    const handleLocationChange = () => {
      const currentTab = getTabFromLocation();
      setActiveTab(currentTab);
    };

    window.addEventListener('hashchange', handleLocationChange);
    window.addEventListener('popstate', handleLocationChange);

    // If no route hash was provided, set default cleanly without jumping
    if (!window.location.hash) {
      window.history.replaceState(null, '', '#telemetry-dashboard');
    }

    return () => {
      window.removeEventListener('hashchange', handleLocationChange);
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);

  // Navigation tab switcher (syncs hash, closes mobile sidebar, and scrolls smoothly)
  const handleNavigateTab = (tab: NavigationTab) => {
    setActiveTab(tab);
    setIsMobileDetailsOpen(false);
    if (window.location.hash !== `#${tab}`) {
      window.history.pushState(null, '', `#${tab}`);
    }
    setIsMobileSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Compute minimum lunar distance in the dataset
  const closestDistanceLD = neos.reduce((min, n) => {
    const ld = parseFloat(n.close_approach_data?.[0]?.miss_distance?.lunar || '999');
    return ld < min ? ld : min;
  }, 999);

  return (
    <div 
      className="min-h-screen flex flex-col selection:bg-[#d9b43a]/30 selection:text-[#d9b43a] transition-colors duration-400"
      style={{
        backgroundColor: theme === 'deep-space' ? '#1d1f3a' : '#F0F4F8',
        color: theme === 'deep-space' ? '#DFE1F4' : '#1E293B'
      }}
    >
      {/* Fixed Top Glassmorphic Navigation Header */}
      <Header
        theme={theme}
        onRefresh={() => loadTelemetry(true)}
        isRefreshing={isRefreshing}
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        isMobileSidebarOpen={isMobileSidebarOpen}
        onToggleMobileSidebar={() => setIsMobileSidebarOpen((prev) => !prev)}
        onOpenKineticLab={() => handleNavigateTab('impact-assessment')}
        onOpenNasaKeyModal={() => setIsNasaKeyModalOpen(true)}
        apiKeyType={telemetryMeta.apiKeyType}
        dataSource={telemetryMeta.source}
      />

      {/* Main Framework Container */}
      <div className="flex flex-1 pt-16 min-h-screen">
        {/* Responsive Left Mission Navigation Sidebar */}
        <Sidebar
          theme={theme}
          activeTab={activeTab}
          onSelectTab={handleNavigateTab}
          isOpenMobile={isMobileSidebarOpen}
          onCloseMobile={() => setIsMobileSidebarOpen(false)}
          totalTracked={telemetryMeta.totalTracked}
          criticalCount={telemetryMeta.criticalCount}
          closestDistanceLD={closestDistanceLD === 999 ? 0.082 : closestDistanceLD}
          onOpenNasaKeyModal={() => setIsNasaKeyModalOpen(true)}
          apiKeyType={telemetryMeta.apiKeyType}
          dataSource={telemetryMeta.source}
          onToggleTheme={handleToggleTheme}
        />

        {/* Primary Content Container: md:pl-72 guarantees 288px lane for the fixed sidebar, eliminating screen overlap */}
        <div className="flex-1 md:pl-72 w-full min-w-0 flex flex-col transition-all duration-300">
          <main className="flex-1 w-full px-3 sm:px-6 lg:px-8 py-6 pb-28 md:pb-12 max-w-[1600px] mx-auto overflow-x-hidden">
          <div className="flex flex-col gap-6 w-full">
            
            {/* VIEW 1: Primary Telemetry Dashboard */}
            {activeTab === 'telemetry-dashboard' && (
              <>
                {/* Mission Hero Banner */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pt-1">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="font-telemetry text-xs font-semibold text-[#d9b43a]">
                        ORBITAL COMPUTATION NODE // PERIGEE-CORE-07
                      </span>
                      <span className="w-2 h-2 rounded-full bg-[#d9b43a] animate-ping"></span>
                    </div>
                    <h1 className="font-headline font-bold text-2xl sm:text-3xl lg:text-4xl text-current tracking-tight">
                      Perigee Telemetry Matrix
                    </h1>
                    <p className="text-xs sm:text-sm opacity-75 max-w-2xl mt-1 leading-relaxed">
                      Real-time astronomical ephemeris correlation, astrometric vector propagation, and near-surface lunar distance kinetic assessment.
                    </p>
                  </div>

                  {/* Node sync and telemetry source badge */}
                  <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
                    <button
                      onClick={() => setIsNasaKeyModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-telemetry cursor-pointer transition-all active:scale-95"
                      title="Click to configure NASA API Key"
                    >
                      <Satellite size={14} className="text-[#d9b43a]" />
                      <span className="text-[#d9b43a] font-semibold">AAS-OPTICAL SYNC</span>
                      <span className="opacity-60">0.42ms</span>
                    </button>

                    <button
                      onClick={() => setIsNasaKeyModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-telemetry cursor-pointer transition-all active:scale-95"
                      title="Click to view NASA NeoWs API connection status"
                    >
                      <span className={`w-2 h-2 rounded-full ${telemetryMeta.source === 'live' ? 'bg-[#d9b43a] animate-pulse' : 'bg-[#7c809c]'}`}></span>
                      <span className="opacity-90 font-semibold">
                        {telemetryMeta.source === 'live' 
                          ? 'LIVE JPL NEOWS' 
                          : telemetryMeta.source === 'cache' 
                            ? 'OFFLINE-FIRST CACHE' 
                            : 'OFFLINE ASTROMETRIC DB'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* 4 Primary Mission Metric Cards */}
                <MetricCards
                  theme={theme}
                  neos={neos}
                  totalTracked={telemetryMeta.totalTracked}
                  onSelectNeo={handleSelectNeo}
                />

                {/* Radar & Visualizer Area */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 w-full">
                  {/* Left 7 Columns: Live Trajectory Polar Radar */}
                  <div className="xl:col-span-7 flex flex-col">
                    <TrajectoryRadar
                      theme={theme}
                      neos={neos}
                      selectedNeo={selectedNeo}
                      onSelectNeo={handleSelectNeo}
                      onOpenKineticLab={(neo) => {
                        setSelectedNeo(neo);
                        handleNavigateTab('impact-assessment');
                      }}
                    />
                  </div>

                  {/* Right 5 Columns: Scatter Plot & Sentry Threat Status */}
                  <div className="xl:col-span-5 flex flex-col">
                    <PerigeeScatterPlot
                      theme={theme}
                      neos={neos}
                      selectedNeo={selectedNeo}
                      onSelectNeo={handleSelectNeo}
                    />
                  </div>
                </div>

                {/* Main Interactive Table & Split Details Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-start">
                  <div className={`${selectedNeo ? 'lg:col-span-7 xl:col-span-8' : 'lg:col-span-12'} flex flex-col gap-4 transition-all duration-300 min-w-0 w-full max-w-full overflow-hidden`}>
                    <NeoTable
                      theme={theme}
                      neos={neos}
                      selectedNeo={selectedNeo}
                      onSelectNeo={handleSelectNeo}
                      activeFilter={activeFilter}
                      onFilterChange={setActiveFilter}
                    />
                  </div>

                  {/* Persistent Details Inspector Pane (Desktop > 1024px) */}
                  {selectedNeo && (
                    <div className="hidden lg:block lg:col-span-5 xl:col-span-4 sticky top-20">
                      <NeoDetailsPane
                        theme={theme}
                        neo={selectedNeo}
                        onClose={() => setSelectedNeo(null)}
                        onOpenKineticLab={(neo) => {
                          if (neo) setSelectedNeo(neo);
                          handleNavigateTab('impact-assessment');
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* DSN Ground Stations & IAU Observatories Footer Grid */}
                <MissionStations theme={theme} />
              </>
            )}

            {/* VIEW 2: Dedicated Hazard Perigee Monitor */}
            {activeTab === 'hazard-perigee-monitor' && (
              <HazardPerigeeView
                theme={theme}
                neos={neos}
                selectedNeo={selectedNeo}
                onSelectNeo={handleSelectNeo}
                onOpenKineticLab={(neo) => {
                  setSelectedNeo(neo);
                  handleNavigateTab('impact-assessment');
                }}
              />
            )}

            {/* VIEW 3: Dedicated Orbital Trajectory Visualizer */}
            {activeTab === 'orbital-trajectory-visualizer' && (
              <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-[#d9b43a]/15 text-[#d9b43a] border border-[#d9b43a]/30">
                    <Orbit size={24} />
                  </div>
                  <div>
                    <h1 className="font-headline font-bold text-2xl sm:text-3xl text-current tracking-tight">
                      Orbital Trajectory &amp; Radar Visualizer
                    </h1>
                    <p className="text-xs sm:text-sm opacity-70">
                      High-resolution polar radar coordinates mapping Earth-crossing orbits in real-time.
                    </p>
                  </div>
                </div>

                <TrajectoryRadar
                  theme={theme}
                  neos={neos}
                  selectedNeo={selectedNeo}
                  onSelectNeo={handleSelectNeo}
                  onOpenKineticLab={(neo) => {
                    setSelectedNeo(neo);
                    handleNavigateTab('impact-assessment');
                  }}
                />

                <PerigeeScatterPlot
                  theme={theme}
                  neos={neos}
                  selectedNeo={selectedNeo}
                  onSelectNeo={handleSelectNeo}
                />
              </div>
            )}

            {/* VIEW 4: Dedicated Kinetic Impact Assessment Lab */}
            {activeTab === 'impact-assessment' && (
              <KineticLabView
                theme={theme}
                initialNeo={selectedNeo}
                neos={neos}
              />
            )}

            {/* Mobile / Tablet Slide-Up Drawer for Selected Asteroid */}
            {selectedNeo && isMobileDetailsOpen && activeTab === 'telemetry-dashboard' && (
              <div 
                className="lg:hidden fixed inset-0 z-50 bg-black/92 backdrop-blur-2xl flex flex-col justify-end p-2 sm:p-4 animate-in fade-in duration-200"
                onClick={() => setIsMobileDetailsOpen(false)}
              >
                <div 
                  className="max-h-[85vh] overflow-y-auto w-full rounded-2xl shadow-2xl border border-white/15"
                  style={{
                    backgroundColor: theme === 'deep-space' ? '#181a30' : '#ffffff',
                    color: theme === 'deep-space' ? '#F8FAFC' : '#1d1f3a'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <NeoDetailsPane
                    theme={theme}
                    neo={selectedNeo}
                    onClose={() => setIsMobileDetailsOpen(false)}
                    onOpenKineticLab={(neo) => {
                      if (neo) setSelectedNeo(neo);
                      setIsMobileDetailsOpen(false);
                      handleNavigateTab('impact-assessment');
                    }}
                    isDrawerOnMobile={true}
                  />
                </div>
              </div>
            )}

          </div>
        </main>
      </div>
    </div>

      {/* Mobile Bottom Navigation Bar (<768px) */}
      <BottomNav
        theme={theme}
        activeTab={activeTab}
        onSelectTab={handleNavigateTab}
        criticalCount={telemetryMeta.criticalCount}
      />

      {/* NASA API Key Configuration Modal */}
      <NasaApiKeyModal
        isOpen={isNasaKeyModalOpen}
        onClose={() => setIsNasaKeyModalOpen(false)}
        theme={theme}
        onKeyUpdated={() => loadTelemetry(true)}
        rateLimitRemaining={telemetryMeta.rateLimitRemaining}
        rateLimitTotal={telemetryMeta.rateLimitTotal}
        dataSource={telemetryMeta.source}
        lastUpdated={telemetryMeta.lastUpdated}
      />

      {/* Kinetic Impact Laboratory Full Simulation Modal */}
      <KineticCalculatorModal
        theme={theme}
        initialNeo={selectedNeo}
        isOpen={isKineticLabOpen}
        onClose={() => setIsKineticLabOpen(false)}
      />
    </div>
  );
}
