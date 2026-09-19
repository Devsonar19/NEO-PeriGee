import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, 
  Flame, 
  Radio, 
  ExternalLink, 
  ShieldAlert, 
  ChevronRight, 
  Radar, 
  Clock, 
  Zap, 
  Compass,
  ArrowUpRight,
  TrendingDown,
  TrendingUp,
  Filter
} from 'lucide-react';
import { NeoObject, ThemeMode } from '../types';
import { calculateInstantaneousDistance } from '../utils/physics';

interface HazardPerigeeViewProps {
  theme: ThemeMode;
  neos: NeoObject[];
  selectedNeo: NeoObject | null;
  onSelectNeo: (neo: NeoObject) => void;
  onOpenKineticLab: (neo: NeoObject) => void;
}

type HazardFilter = 'all' | 'sublunar' | 'live' | 'sentry';

export const HazardPerigeeView: React.FC<HazardPerigeeViewProps> = ({
  theme,
  neos,
  selectedNeo,
  onSelectNeo,
  onOpenKineticLab
}) => {
  const [currentMs, setCurrentMs] = useState<number>(Date.now());
  const [filter, setFilter] = useState<HazardFilter>('all');

  // Real-time 1-second tick loop for live countdowns & instantaneous distance
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const phas = useMemo(() => {
    return neos.filter((n) => n.is_potentially_hazardous_asteroid);
  }, [neos]);

  const subLunarPhas = useMemo(() => {
    return phas.filter((n) => {
      const ld = parseFloat(n.close_approach_data?.[0]?.miss_distance?.lunar || '999');
      return ld < 1.0;
    });
  }, [phas]);

  const filteredPhas = useMemo(() => {
    return phas.filter((n) => {
      if (filter === 'sublunar') {
        const ld = parseFloat(n.close_approach_data?.[0]?.miss_distance?.lunar || '999');
        return ld < 1.0;
      }
      if (filter === 'live') {
        return n.is_live_feed;
      }
      if (filter === 'sentry') {
        return n.is_sentry_object;
      }
      return true;
    }).sort((a, b) => {
      const ldA = parseFloat(a.close_approach_data?.[0]?.miss_distance?.lunar || '999');
      const ldB = parseFloat(b.close_approach_data?.[0]?.miss_distance?.lunar || '999');
      return ldA - ldB;
    });
  }, [phas, filter]);

  const closestPha = filteredPhas[0] || phas[0];
  const closestLD = closestPha 
    ? parseFloat(closestPha.close_approach_data?.[0]?.miss_distance?.lunar || '0')
    : 0;

  // Real-time instantaneous telemetry helper
  const getNeoTelemetry = (neo: NeoObject) => {
    const ca = neo.close_approach_data?.[0];
    const missDistanceKm = ca?.miss_distance?.kilometers ? parseFloat(ca.miss_distance.kilometers) : 1922000;
    const velocityKmS = ca?.relative_velocity?.kilometers_per_second ? parseFloat(ca.relative_velocity.kilometers_per_second) : 20;
    const epochMs = ca?.epoch_date_close_approach || Date.now();

    return calculateInstantaneousDistance(missDistanceKm, velocityKmS, epochMs, currentMs);
  };

  // Format real-time countdown string
  const formatCountdown = (epochMs: number) => {
    const deltaSec = Math.floor((epochMs - currentMs) / 1000);
    const isPast = deltaSec < 0;
    const abs = Math.abs(deltaSec);

    const days = Math.floor(abs / 86400);
    const hours = Math.floor((abs % 86400) / 3600);
    const minutes = Math.floor((abs % 3600) / 60);
    const seconds = abs % 60;

    const pad = (n: number) => String(n).padStart(2, '0');

    if (days > 0) {
      return `${isPast ? 'T+' : 'T-'} ${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
    }
    return `${isPast ? 'T+' : 'T-'} ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Alert Header Banner */}
      <div 
        className="p-5 sm:p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl relative overflow-hidden"
        style={{
          backgroundColor: theme === 'deep-space' ? '#1d1f3a' : 'rgba(254, 242, 242, 0.95)',
          borderColor: theme === 'deep-space' ? 'rgba(244, 123, 123, 0.3)' : 'rgba(244, 123, 123, 0.25)'
        }}
      >
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#f47b7b]/20 text-[#f47b7b] border border-[#f47b7b]/40 shrink-0 animate-pulse">
            <AlertTriangle size={28} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-telemetry text-[11px] font-bold text-[#f47b7b] uppercase tracking-wider">
                CRITICAL PERIGEE WARNING &bull; PHA REAL-TIME TELEMETRY
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f47b7b] text-[#1d1f3a] animate-pulse">
                LIVE CLOCK ACTIVE
              </span>
            </div>
            <h1 className="font-headline font-bold text-xl sm:text-2xl lg:text-3xl text-current tracking-tight mt-0.5">
              Hazard Perigee Monitor
            </h1>
            <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-2xl leading-relaxed">
              Real-time tracking of classified Potentially Hazardous Asteroids (&le; 0.05 AU MOID) with live countdown timers, instantaneous range $r(t)$ telemetry, and automated kinetic impact modeling.
            </p>
          </div>
        </div>

        {/* Quick Threat Readout */}
        <div className="flex sm:flex-col justify-between sm:items-end gap-2 shrink-0 p-3 sm:p-0 rounded-xl bg-black/20 sm:bg-transparent font-telemetry">
          <div className="text-left sm:text-right">
            <span className="text-[10px] font-headline uppercase font-bold opacity-60 block">Tracked PHAs</span>
            <span className="font-bold text-xl sm:text-2xl text-[#f47b7b]">
              {phas.length} Objects
            </span>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-headline uppercase font-bold opacity-60 block">Closest Approach</span>
            <span className="font-bold text-sm sm:text-base text-[#d9b43a]">
              {closestLD.toFixed(3)} LD ({closestPha?.name?.split(' ')[0] || 'Apophis'})
            </span>
          </div>
        </div>
      </div>

      {/* 3 Metric Cards for Hazards with Live Ticker */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div 
          className="p-4 rounded-xl border flex flex-col gap-1.5 backdrop-blur-md"
          style={{
            backgroundColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-headline uppercase font-bold opacity-60">Sub-Lunar Threats</span>
            <Radio size={16} className="text-[#f47b7b] animate-pulse" />
          </div>
          <div className="font-telemetry font-bold text-2xl text-[#f47b7b]">
            {subLunarPhas.length}
          </div>
          <span className="text-[11px] opacity-70">
            Intersecting inside Moon&apos;s orbit (&lt; 384,400 km)
          </span>
        </div>

        <div 
          className="p-4 rounded-xl border flex flex-col gap-1.5 backdrop-blur-md"
          style={{
            backgroundColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-headline uppercase font-bold opacity-60">Live NASA Feed PHAs</span>
            <Radar size={16} className="text-emerald-400" />
          </div>
          <div className="font-telemetry font-bold text-2xl text-emerald-400">
            {phas.filter((n) => n.is_live_feed).length}
          </div>
          <span className="text-[11px] opacity-70">
            Active close approaches verified in current 7-day window
          </span>
        </div>

        <div 
          className="p-4 rounded-xl border flex flex-col gap-1.5 backdrop-blur-md"
          style={{
            backgroundColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.8)',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-headline uppercase font-bold opacity-60">Maximum Kinetic Threat</span>
            <Flame size={16} className="text-[#d9b43a]" />
          </div>
          <div className="font-telemetry font-bold text-2xl text-[#d9b43a]">
            {closestPha?.computed_kinetic?.megatons_tnt.toLocaleString() || '1,200'} Mt
          </div>
          <span className="text-[11px] opacity-70">
            {closestPha?.name || 'Apophis'} impact yield equivalent
          </span>
        </div>
      </div>

      {/* Filter Tabs & Live Time Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold transition-all ${
              filter === 'all'
                ? 'bg-[#f47b7b] text-[#1d1f3a] shadow-sm'
                : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
            }`}
          >
            All Critical PHAs ({phas.length})
          </button>
          <button
            onClick={() => setFilter('sublunar')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'sublunar'
                ? 'bg-[#f47b7b] text-[#1d1f3a] shadow-sm'
                : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#f47b7b] animate-pulse"></span>
            Sub-Lunar &lt; 1 LD ({subLunarPhas.length})
          </button>
          <button
            onClick={() => setFilter('live')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'live'
                ? 'bg-emerald-500 text-[#1d1f3a] shadow-sm'
                : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Live NASA Feed ({phas.filter((n) => n.is_live_feed).length})
          </button>
          <button
            onClick={() => setFilter('sentry')}
            className={`px-3 py-1.5 rounded-xl text-xs font-headline font-semibold flex items-center gap-1.5 transition-all ${
              filter === 'sentry'
                ? 'bg-[#d9b43a] text-[#1d1f3a] shadow-sm'
                : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
            }`}
          >
            <ShieldAlert size={12} />
            Sentry Monitored ({phas.filter((n) => n.is_sentry_object).length})
          </button>
        </div>

        <div className="flex items-center gap-2 font-telemetry text-xs opacity-70">
          <Clock size={13} className="text-[#d9b43a]" />
          <span>Telemetry Clock: {new Date(currentMs).toLocaleTimeString()}</span>
        </div>
      </div>

      {/* Real-time PHA Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filteredPhas.map((neo) => {
          const telem = getNeoTelemetry(neo);
          const ca = neo.close_approach_data?.[0];
          const epoch = ca?.epoch_date_close_approach || Date.now();
          const lunarDist = parseFloat(ca?.miss_distance?.lunar || '999');
          const kmDist = parseFloat(ca?.miss_distance?.kilometers || '0').toLocaleString();
          const velKmS = parseFloat(ca?.relative_velocity?.kilometers_per_second || '20').toFixed(1);
          const diameterM = neo.computed_kinetic?.diameter_meters || 150;
          const yieldMt = neo.computed_kinetic?.megatons_tnt || 50;
          const approachDate = ca?.close_approach_date_full || ca?.close_approach_date || 'TBD';
          const countdown = formatCountdown(epoch);
          const isSelected = selectedNeo?.id === neo.id;

          return (
            <div
              key={neo.id}
              onClick={() => onSelectNeo(neo)}
              className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 cursor-pointer transition-all duration-200 hover:-translate-y-1 shadow-lg ${
                isSelected 
                  ? 'border-[#f47b7b] ring-2 ring-[#f47b7b]/30' 
                  : 'border-white/10 hover:border-white/20'
              }`}
              style={{
                backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.9)'
              }}
            >
              {/* Card Header with Badges & Name */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#f47b7b] animate-pulse shrink-0" />
                    <div>
                      <h3 className="font-headline font-bold text-base text-current group-hover:text-[#f47b7b] transition-colors">
                        {neo.name}
                      </h3>
                      <span className="text-[10px] font-telemetry text-[#f47b7b] font-semibold uppercase">
                        {neo.orbital_class || 'POTENTIALLY HAZARDOUS PHA'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {neo.is_live_feed && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-telemetry font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        LIVE NASA
                      </span>
                    )}
                    {neo.is_sentry_object && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-telemetry font-bold bg-[#d9b43a]/20 text-[#d9b43a] border border-[#d9b43a]/30">
                        SENTRY
                      </span>
                    )}
                  </div>
                </div>

                {/* Real-time Countdown Banner */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-[#f47b7b]/10 border border-[#f47b7b]/20 font-telemetry text-xs">
                  <div className="flex items-center gap-1.5 text-[#f47b7b] font-bold">
                    <Clock size={13} className="animate-spin-slow" />
                    <span>{countdown}</span>
                  </div>
                  <span className="text-[10px] uppercase opacity-70 font-semibold">
                    {telem.isApproaching ? 'Approaching' : 'Receding'}
                  </span>
                </div>

                {/* Real-Time Instantaneous Range & Physical Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 p-2.5 rounded-xl bg-white/5 text-xs font-telemetry">
                  <div>
                    <span className="text-[9px] uppercase opacity-60 block">Live Range $r(t)$</span>
                    <span className="font-bold text-[#d9b43a]">
                      {telem.distanceLunar.toFixed(3)} LD
                    </span>
                    <span className="text-[9px] opacity-60 block">{telem.distanceKm.toLocaleString()} km</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase opacity-60 block">Range Rate</span>
                    <span className={`font-bold flex items-center gap-1 ${telem.isApproaching ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {telem.isApproaching ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                      {telem.rangeRateKmS > 0 ? `+${telem.rangeRateKmS}` : telem.rangeRateKmS} km/s
                    </span>
                    <span className="text-[9px] opacity-60 block">Velocity: {velKmS} km/s</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase opacity-60 block">Min. Perigee</span>
                    <span className={`font-bold ${lunarDist < 1 ? 'text-[#f47b7b]' : 'text-current'}`}>
                      {lunarDist.toFixed(3)} LD
                    </span>
                    <span className="text-[9px] opacity-60 block">{kmDist} km</span>
                  </div>

                  <div>
                    <span className="text-[9px] uppercase opacity-60 block">Kinetic Yield</span>
                    <span className="font-bold text-[#f47b7b]">
                      {yieldMt >= 10 ? yieldMt.toLocaleString() : yieldMt.toFixed(2)} Mt
                    </span>
                    <span className="text-[9px] opacity-60 block">~{diameterM.toFixed(0)}m diameter</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Controls */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10 text-xs font-telemetry">
                <span className="text-[11px] opacity-60 flex items-center gap-1">
                  <Clock size={12} />
                  {approachDate}
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenKineticLab(neo);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl font-headline font-bold text-xs bg-[#f47b7b]/20 hover:bg-[#f47b7b]/30 text-[#f47b7b] border border-[#f47b7b]/30 transition-all active:scale-95 shadow-sm"
                    title="Run Real-Time Kinetic Crater Simulation"
                  >
                    <Flame size={13} />
                    <span>Simulate Impact</span>
                  </button>

                  <a
                    href={neo.nasa_jpl_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d9b43a] transition-colors"
                    title="View NASA JPL Small-Body Record"
                  >
                    <ExternalLink size={13} />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
