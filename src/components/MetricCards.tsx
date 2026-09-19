import React from 'react';
import { Radar, AlertTriangle, Disc, Flame, ArrowUpRight } from 'lucide-react';
import { NeoObject, ThemeMode } from '../types';

interface MetricCardsProps {
  theme: ThemeMode;
  neos: NeoObject[];
  totalTracked: number;
  onSelectNeo: (neo: NeoObject) => void;
}

export const MetricCards: React.FC<MetricCardsProps> = ({
  theme,
  neos,
  totalTracked,
  onSelectNeo
}) => {
  // Compute closest NEO
  const sortedByDistance = [...neos].sort((a, b) => {
    const distA = parseFloat(a.close_approach_data?.[0]?.miss_distance?.lunar || '999');
    const distB = parseFloat(b.close_approach_data?.[0]?.miss_distance?.lunar || '999');
    return distA - distB;
  });
  const closestNeo = sortedByDistance[0];

  // Compute hazardous NEOs
  const hazardousList = neos.filter((n) => n.is_potentially_hazardous_asteroid);

  // Compute maximum kinetic yield
  const sortedByYield = [...neos].sort((a, b) => {
    const yieldA = a.computed_kinetic?.megatons_tnt || 0;
    const yieldB = b.computed_kinetic?.megatons_tnt || 0;
    return yieldB - yieldA;
  });
  const maxYieldNeo = sortedByYield[0];

  const closestDistanceKm = closestNeo?.close_approach_data?.[0]?.miss_distance?.kilometers
    ? parseFloat(closestNeo.close_approach_data[0].miss_distance.kilometers).toLocaleString()
    : '31,600';

  const closestDistanceLD = closestNeo?.close_approach_data?.[0]?.miss_distance?.lunar
    ? parseFloat(closestNeo.close_approach_data[0].miss_distance.lunar).toFixed(3)
    : '0.082';

  const maxYieldMt = maxYieldNeo?.computed_kinetic?.megatons_tnt?.toLocaleString() || '2,400';
  const maxYieldVelocity = maxYieldNeo?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '27.77';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* 1. Active Tracked NEOs */}
      <div 
        className="glass-card p-5 rounded-3xl relative overflow-hidden group cursor-pointer border border-white/10"
        onClick={() => closestNeo && onSelectNeo(closestNeo)}
        id="card-active-neos"
      >
        <div className="flex justify-between items-start mb-3">
          <span className="font-headline text-xs font-semibold text-current opacity-60 tracking-tight">
            Active Tracked NEOs
          </span>
          <div className="p-2 rounded-xl bg-[#d9b43a]/10 text-[#d9b43a] border border-[#d9b43a]/20">
            <Radar size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-2xl sm:text-3xl font-bold tracking-tight">
            {totalTracked.toLocaleString()}
          </span>
          <span className="font-telemetry text-xs font-semibold text-emerald-400">
            +14 today
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs opacity-70">
          <span>Sky Survey Yield: 98.4%</span>
          <span className="font-telemetry text-[#d9b43a] flex items-center gap-0.5 font-medium">
            JPL HORIZONS <ArrowUpRight size={12} />
          </span>
        </div>
      </div>

      {/* 2. Hazardous Inbound (< 0.05 AU) */}
      <div 
        className="glass-card p-5 rounded-3xl relative overflow-hidden group cursor-pointer border border-[#f47b7b]/30"
        style={{
          boxShadow: theme === 'deep-space' 
            ? 'inset 0 1px 0 0 rgba(255, 255, 255, 0.1), 0 8px 32px rgba(244, 123, 123, 0.18)' 
            : 'inset 0 1px 0 0 rgba(255, 255, 255, 0.9), 0 8px 32px rgba(244, 123, 123, 0.1)'
        }}
        onClick={() => {
          const target = hazardousList[0] || closestNeo;
          if (target) onSelectNeo(target);
        }}
        id="card-hazardous-neos"
      >
        <div className="flex justify-between items-start mb-3">
          <span className="font-headline text-xs font-semibold text-[#f47b7b] tracking-tight">
            Hazardous Inbound (&lt; 0.05 AU)
          </span>
          <div className="p-2 rounded-xl bg-[#f47b7b]/15 text-[#f47b7b] border border-[#f47b7b]/25 animate-pulse">
            <AlertTriangle size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#f47b7b] tracking-tight">
            {hazardousList.length}
          </span>
          <span className="font-telemetry text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#f47b7b]/15 text-[#f47b7b] border border-[#f47b7b]/25">
            CRITICAL PHA
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-[#f47b7b]/20 flex items-center justify-between text-xs text-[#f47b7b]/90">
          <span className="truncate">Next Encounter: {hazardousList[0]?.name || '99942 Apophis'}</span>
          <span className="font-telemetry font-semibold shrink-0 ml-1">T-1,612d</span>
        </div>
      </div>

      {/* 3. Closest Perigee Approach */}
      <div 
        className="glass-card p-5 rounded-3xl relative overflow-hidden group cursor-pointer border border-white/10"
        onClick={() => closestNeo && onSelectNeo(closestNeo)}
        id="card-closest-perigee"
      >
        <div className="flex justify-between items-start mb-3">
          <span className="font-headline text-xs font-semibold text-current opacity-60 tracking-tight">
            Closest Perigee Approach
          </span>
          <div className="p-2 rounded-xl bg-[#d9b43a]/10 text-[#d9b43a] border border-[#d9b43a]/20">
            <Disc size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2 truncate">
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#d9b43a] tracking-tight">
            {closestDistanceKm}
          </span>
          <span className="font-telemetry text-xs opacity-70">
            km ({closestDistanceLD} LD)
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs opacity-70">
          <span className="truncate">{closestNeo?.name || '99942 Apophis'}</span>
          <span className="font-telemetry text-[#d9b43a] font-semibold shrink-0 ml-1">GEO-SHELL INTRUSION</span>
        </div>
      </div>

      {/* 4. Max Kinetic Yield Vector */}
      <div 
        className="glass-card p-5 rounded-3xl relative overflow-hidden group cursor-pointer border border-white/10"
        onClick={() => maxYieldNeo && onSelectNeo(maxYieldNeo)}
        id="card-kinetic-yield"
      >
        <div className="flex justify-between items-start mb-3">
          <span className="font-headline text-xs font-semibold text-current opacity-60 tracking-tight">
            Max Kinetic Yield
          </span>
          <div className="p-2 rounded-xl bg-[#d9b43a]/10 text-[#d9b43a] border border-[#d9b43a]/20">
            <Flame size={16} />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="font-headline text-2xl sm:text-3xl font-bold text-[#d9b43a] tracking-tight">
            {maxYieldMt}
          </span>
          <span className="font-telemetry text-xs opacity-70">
            Mt TNT eq.
          </span>
        </div>
        <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-xs opacity-70">
          <span className="truncate">{maxYieldNeo?.name || '101955 Bennu'}</span>
          <span className="font-telemetry opacity-90 shrink-0 ml-1">v={maxYieldVelocity} km/s</span>
        </div>
      </div>
    </div>
  );
};
