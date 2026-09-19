import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  Flame, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  Layers
} from 'lucide-react';
import { NeoObject, ThemeMode, FilterCategory } from '../types';

interface NeoTableProps {
  theme: ThemeMode;
  neos: NeoObject[];
  selectedNeo: NeoObject | null;
  onSelectNeo: (neo: NeoObject) => void;
  activeFilter: FilterCategory;
  onFilterChange: (filter: FilterCategory) => void;
}

const ITEMS_PER_PAGE = 20;

export const NeoTable: React.FC<NeoTableProps> = ({
  theme,
  neos,
  selectedNeo,
  onSelectNeo,
  activeFilter,
  onFilterChange
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<'distance' | 'yield' | 'velocity' | 'diameter'>('distance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Reset to first page whenever filter or search query changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilter]);

  // Filter & Search & Sort pipeline
  const filteredNeos = useMemo(() => {
    return neos.filter((neo) => {
      // Search query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesName = neo.name.toLowerCase().includes(query);
        const matchesId = neo.id.includes(query);
        const matchesClass = neo.orbital_class?.toLowerCase().includes(query);
        if (!matchesName && !matchesId && !matchesClass) return false;
      }

      // Filter chips
      if (activeFilter === 'hazardous') {
        return neo.is_potentially_hazardous_asteroid;
      }
      if (activeFilter === 'sub-lunar') {
        const ld = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || '999');
        return ld < 1.0;
      }
      if (activeFilter === 'high-energy') {
        const yieldMt = neo.computed_kinetic?.megatons_tnt || 0;
        return yieldMt >= 100;
      }
      if (activeFilter === '24hours') {
        const approachEpoch = neo.close_approach_data?.[0]?.epoch_date_close_approach;
        if (!approachEpoch) return true;
        const diffMs = Math.abs(approachEpoch - Date.now());
        return diffMs <= 86400000 * 2; // within 48h
      }
      return true;
    }).sort((a, b) => {
      let valA = 0;
      let valB = 0;

      if (sortField === 'distance') {
        valA = parseFloat(a.close_approach_data?.[0]?.miss_distance?.lunar || '999');
        valB = parseFloat(b.close_approach_data?.[0]?.miss_distance?.lunar || '999');
      } else if (sortField === 'yield') {
        valA = a.computed_kinetic?.megatons_tnt || 0;
        valB = b.computed_kinetic?.megatons_tnt || 0;
      } else if (sortField === 'velocity') {
        valA = parseFloat(a.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '0');
        valB = parseFloat(b.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '0');
      } else if (sortField === 'diameter') {
        valA = a.computed_kinetic?.diameter_meters || 0;
        valB = b.computed_kinetic?.diameter_meters || 0;
      }

      if (sortOrder === 'asc') return valA - valB;
      return valB - valA;
    });
  }, [neos, searchQuery, activeFilter, sortField, sortOrder]);

  // Paginate strictly capped at 20 items per view
  const totalPages = Math.max(1, Math.ceil(filteredNeos.length / ITEMS_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  
  const displayedNeos = useMemo(() => {
    const startIndex = (safePage - 1) * ITEMS_PER_PAGE;
    return filteredNeos.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredNeos, safePage]);

  const startItem = filteredNeos.length > 0 ? (safePage - 1) * ITEMS_PER_PAGE + 1 : 0;
  const endItem = Math.min(safePage * ITEMS_PER_PAGE, filteredNeos.length);

  const toggleSort = (field: 'distance' | 'yield' | 'velocity' | 'diameter') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const filterButtons: { id: FilterCategory; label: string }[] = [
    { id: 'all', label: `All Tracked (${neos.length})` },
    { id: 'hazardous', label: `Hazardous PHA (${neos.filter((n) => n.is_potentially_hazardous_asteroid).length})` },
    { id: 'sub-lunar', label: 'Sub-Lunar (< 1 LD)' },
    { id: 'high-energy', label: 'High Kinetic Yield (≥ 100 Mt)' },
    { id: '24hours', label: 'Next 48 Hours' }
  ];

  return (
    <div className="w-full max-w-full min-w-0 flex flex-col gap-4 overflow-hidden">
      {/* Table Title & Filter Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 w-full">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-[#f47b7b]/10 text-[#f47b7b] shrink-0 border border-[#f47b7b]/20">
            <Flame size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-headline font-bold text-lg sm:text-xl tracking-tight text-current">
                Hazardous Approaching NEOs Matrix
              </h2>
              <span className="text-[10px] font-telemetry px-2.5 py-0.5 rounded-full bg-[#d9b43a]/10 text-[#d9b43a] border border-[#d9b43a]/20 font-semibold shrink-0">
                Max 20 / View
              </span>
            </div>
            <p className="text-xs opacity-60 mt-0.5">
              Prioritized orbital rendezvous logs within critical threshold parameter (&le; 0.05 AU)
            </p>
          </div>
        </div>

        {/* Search Input Bar with Apple Spotlight Style */}
        <div className="relative w-full lg:w-72 shrink-0">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 opacity-40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search designation, class..."
            className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl text-xs font-telemetry bg-white/[0.04] border border-white/10 placeholder:opacity-40 focus:outline-none focus:border-[#d9b43a] focus:ring-1 focus:ring-[#d9b43a] transition-all backdrop-blur-md"
            id="neoSearchInput"
          />
        </div>
      </div>

      {/* Filter Chips Bar with Apple Capsules */}
      <div className="flex flex-wrap items-center gap-2 w-full">
        {filterButtons.map((btn) => {
          const isActive = activeFilter === btn.id;
          return (
            <button
              key={btn.id}
              onClick={() => onFilterChange(btn.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-headline font-medium transition-all active:scale-95 whitespace-nowrap min-h-[34px] backdrop-blur-md ${
                isActive
                  ? theme === 'deep-space'
                    ? 'bg-[#d9b43a]/20 text-[#d9b43a] font-semibold border border-[#d9b43a]/40 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15)]'
                    : 'bg-[#d9b43a] text-white shadow-sm font-semibold'
                  : 'bg-white/[0.04] hover:bg-white/[0.08] opacity-75 hover:opacity-100 border border-white/[0.08]'
              }`}
              id={`filter-chip-${btn.id}`}
            >
              {btn.label}
            </button>
          );
        })}
      </div>

      {/* Desktop / Tablet Table View (Apple Glass Frame) */}
      <div className="hidden sm:block w-full max-w-full overflow-x-auto rounded-3xl border border-white/10 glass-panel shadow-2xl">
        <table className="w-full text-left border-collapse table-auto min-w-[780px]" id="neoTelemetryTable">
          <thead>
            <tr 
              className="border-b border-white/10 text-[11px] font-headline font-bold uppercase tracking-wider opacity-50 select-none"
              style={{
                backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(241, 245, 249, 0.9)'
              }}
            >
              <th className="p-4 whitespace-nowrap min-w-[170px]">Designation / Class</th>
              <th className="p-4 whitespace-nowrap min-w-[125px]">Perigee Date</th>
              <th 
                className="p-4 whitespace-nowrap min-w-[120px] cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => toggleSort('distance')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Miss Distance</span>
                  <ArrowUpDown size={12} className={sortField === 'distance' ? 'text-[#d9b43a]' : 'opacity-40'} />
                </div>
              </th>
              <th 
                className="p-4 whitespace-nowrap min-w-[115px] cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => toggleSort('velocity')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Rel. Velocity</span>
                  <ArrowUpDown size={12} className={sortField === 'velocity' ? 'text-[#d9b43a]' : 'opacity-40'} />
                </div>
              </th>
              <th 
                className="p-4 whitespace-nowrap min-w-[100px] cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => toggleSort('diameter')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Est. Diameter</span>
                  <ArrowUpDown size={12} className={sortField === 'diameter' ? 'text-[#d9b43a]' : 'opacity-40'} />
                </div>
              </th>
              <th 
                className="p-4 whitespace-nowrap min-w-[105px] cursor-pointer hover:opacity-100 transition-opacity"
                onClick={() => toggleSort('yield')}
              >
                <div className="flex items-center gap-1.5">
                  <span>Kinetic Yield</span>
                  <ArrowUpDown size={12} className={sortField === 'yield' ? 'text-[#d9b43a]' : 'opacity-40'} />
                </div>
              </th>
              <th className="p-4 whitespace-nowrap min-w-[95px]">Torino Rating</th>
              <th className="p-4 whitespace-nowrap text-right min-w-[80px]">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.06] font-telemetry text-xs">
            {displayedNeos.map((neo) => {
              const isHazardous = neo.is_potentially_hazardous_asteroid;
              const isSelected = selectedNeo?.id === neo.id;
              const lunarDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || '999');
              const kmDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.kilometers || '0').toLocaleString();
              const velKmS = parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '0').toFixed(2);
              const diameterM = neo.computed_kinetic?.diameter_meters || 100;
              const yieldMt = neo.computed_kinetic?.megatons_tnt || 0;

              return (
                <tr 
                  key={neo.id}
                  onClick={() => onSelectNeo(neo)}
                  className={`cursor-pointer transition-all duration-150 group ${
                    isSelected 
                      ? 'bg-[#d9b43a]/15 text-[#d9b43a]' 
                      : isHazardous 
                        ? 'hover:bg-[#f47b7b]/[0.08]' 
                        : 'hover:bg-white/[0.04]'
                  }`}
                  id={`table-row-${neo.id}`}
                >
                  {/* Designation & Class */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      <span 
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          isHazardous ? 'bg-[#f47b7b] animate-pulse' : 'bg-[#d9b43a]'
                        }`} 
                      />
                      <div className="flex flex-col min-w-0 max-w-[180px]">
                        <span 
                          className="font-headline font-bold text-sm text-current group-hover:text-[#d9b43a] transition-colors truncate"
                          title={neo.name}
                        >
                          {neo.name}
                        </span>
                        <span className={`text-[10px] uppercase font-bold tracking-wider truncate ${
                          isHazardous ? 'text-[#f47b7b]' : 'opacity-50'
                        }`}>
                          {neo.orbital_class || (isHazardous ? 'CRITICAL PHA' : 'AMOR/APOLLO CLASS')}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Approach Date */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold">
                      {neo.close_approach_data?.[0]?.close_approach_date || '2026-09-24'}
                    </div>
                    <div className="text-[10px] opacity-50">
                      {neo.close_approach_data?.[0]?.close_approach_date_full?.split(' ')?.[1] || 'UTC'}
                    </div>
                  </td>

                  {/* Miss Distance */}
                  <td className="p-4 whitespace-nowrap">
                    <div className={`font-bold ${lunarDist < 1.0 ? 'text-[#f47b7b]' : 'text-[#d9b43a]'}`}>
                      {lunarDist.toFixed(3)} LD
                    </div>
                    <div className="text-[10px] opacity-50">
                      {kmDist} km
                    </div>
                  </td>

                  {/* Relative Velocity */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-current">
                      {velKmS} km/s
                    </div>
                    <div className="text-[10px] opacity-50">
                      {(parseFloat(velKmS) * 3600).toLocaleString()} km/h
                    </div>
                  </td>

                  {/* Diameter */}
                  <td className="p-4 whitespace-nowrap">
                    <div className="font-semibold text-current">
                      ~{diameterM.toFixed(0)} m
                    </div>
                    <div className="text-[10px] opacity-50">
                      {(diameterM / 1000).toFixed(2)} km
                    </div>
                  </td>

                  {/* Kinetic Yield */}
                  <td className="p-4 whitespace-nowrap">
                    <div className={`font-bold ${yieldMt >= 100 ? 'text-[#d9b43a]' : 'text-current opacity-90'}`}>
                      {yieldMt >= 1000 ? `${(yieldMt / 1000).toFixed(1)} Gt` : `${yieldMt.toFixed(1)} Mt`}
                    </div>
                    <div className="text-[10px] opacity-50">
                      TNT equivalent
                    </div>
                  </td>

                  {/* Torino Rating */}
                  <td className="p-4 whitespace-nowrap">
                    <span 
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center justify-center ${
                        isHazardous
                          ? 'bg-[#f47b7b]/15 text-[#f47b7b] border border-[#f47b7b]/25'
                          : 'bg-white/10 text-current opacity-70'
                      }`}
                    >
                      {isHazardous ? 'SCALE 1' : 'SCALE 0'}
                    </span>
                  </td>

                  {/* Action Vector */}
                  <td className="p-4 whitespace-nowrap text-right">
                    <button
                      className="p-2 rounded-xl bg-white/[0.04] hover:bg-[#d9b43a]/15 text-current hover:text-[#d9b43a] transition-colors inline-flex items-center justify-center border border-white/10"
                      title="Inspect Threat Telemetry"
                      aria-label="Inspect Threat Telemetry"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectNeo(neo);
                      }}
                    >
                      <ChevronRight size={15} />
                    </button>
                  </td>
                </tr>
              );
            })}

            {displayedNeos.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center opacity-60 font-headline">
                  No near-Earth objects matching the selected filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card List View (< 640px) - Capped at displayedNeos (Max 20 items) */}
      <div className="sm:hidden flex flex-col gap-3 w-full">
        {displayedNeos.map((neo) => {
          const isHazardous = neo.is_potentially_hazardous_asteroid;
          const isSelected = selectedNeo?.id === neo.id;
          const lunarDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || '999');
          const velKmS = parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '0').toFixed(2);
          const yieldMt = neo.computed_kinetic?.megatons_tnt || 0;
          const diameterM = neo.computed_kinetic?.diameter_meters || 100;

          return (
            <div
              key={neo.id}
              onClick={() => onSelectNeo(neo)}
              className={`glass-card p-4 sm:p-5 flex flex-col gap-3 cursor-pointer rounded-2xl border transition-all ${
                isHazardous ? 'hazard-pulse border-[#f47b7b]/30' : 'border-white/10'
              } ${isSelected ? 'border-[#d9b43a] bg-[#d9b43a]/10 shadow-[0_0_15px_rgba(217,180,58,0.2)]' : ''}`}
              id={`mobile-card-${neo.id}`}
            >
              <div className="flex justify-between items-start gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isHazardous ? 'bg-[#f47b7b] animate-pulse' : 'bg-[#d9b43a]'}`} />
                  <div className="flex flex-col min-w-0">
                    <h3 className="font-headline font-bold text-base text-current truncate">
                      {neo.name}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider truncate ${isHazardous ? 'text-[#f47b7b]' : 'opacity-60'}`}>
                      {neo.orbital_class || (isHazardous ? 'CRITICAL PHA' : 'ROUTINE NEO')}
                    </span>
                  </div>
                </div>

                <span className={`px-2 py-0.5 rounded-full text-[10px] font-telemetry font-bold shrink-0 ${
                  isHazardous ? 'bg-[#f47b7b]/20 text-[#f47b7b] border border-[#f47b7b]/30' : 'bg-white/10 opacity-70'
                }`}>
                  {isHazardous ? 'SCALE 1' : 'SCALE 0'}
                </span>
              </div>

              {/* Data Readouts Grid */}
              <div className="grid grid-cols-2 gap-2 bg-white/5 p-2.5 rounded-xl text-xs font-telemetry">
                <div>
                  <span className="opacity-50 text-[10px] uppercase block">Miss Distance</span>
                  <span className={`font-bold ${lunarDist < 1 ? 'text-[#f47b7b]' : 'text-[#d9b43a]'}`}>
                    {lunarDist.toFixed(3)} LD
                  </span>
                </div>
                <div>
                  <span className="opacity-50 text-[10px] uppercase block">Kinetic Yield</span>
                  <span className="font-bold text-[#d9b43a]">
                    {yieldMt.toFixed(2)} Mt
                  </span>
                </div>
                <div>
                  <span className="opacity-50 text-[10px] uppercase block">Rel. Velocity</span>
                  <span className="font-semibold">{velKmS} km/s</span>
                </div>
                <div>
                  <span className="opacity-50 text-[10px] uppercase block">Est. Diameter</span>
                  <span className="font-semibold">~{diameterM.toFixed(0)} m</span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-1">
                <span className="text-[11px] opacity-60">
                  Perigee: {neo.close_approach_data?.[0]?.close_approach_date || '2026-09-24'}
                </span>
                <button 
                  className="flex items-center gap-1 text-xs font-headline font-bold text-[#d9b43a] hover:text-[#d9b43a]/80 min-h-[36px]"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectNeo(neo);
                  }}
                >
                  <span>Inspect Threat</span>
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          );
        })}

        {displayedNeos.length === 0 && (
          <div className="glass-card p-6 text-center opacity-60 font-headline text-sm rounded-2xl">
            No near-Earth objects matching filter criteria.
          </div>
        )}
      </div>

      {/* Pagination & Summary Bar (Strictly 20 Max per view) with Apple Glass Frame */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl border border-white/10 bg-white/[0.04] text-xs font-telemetry backdrop-blur-xl">
        <div className="flex items-center gap-2 text-current opacity-80">
          <Layers size={14} className="text-[#d9b43a]" />
          <span>
            Showing <strong className="text-[#d9b43a]">{startItem}–{endItem}</strong> of <strong>{filteredNeos.length}</strong> objects (Max 20 per view)
          </span>
        </div>

        {/* Pagination Navigation Controls */}
        <div className="flex items-center gap-1.5 select-none">
          {/* First Page */}
          <button
            onClick={() => setCurrentPage(1)}
            disabled={safePage <= 1}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="First Page"
            aria-label="First page"
          >
            <ChevronsLeft size={14} />
          </button>

          {/* Previous Page */}
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={safePage <= 1}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-xs font-headline font-semibold min-h-[36px]"
            aria-label="Previous page"
          >
            <ChevronLeft size={14} />
            <span className="hidden xs:inline">Prev</span>
          </button>

          {/* Page Indicator Pill */}
          <div className="px-3.5 py-1.5 rounded-xl border border-[#d9b43a]/30 bg-[#d9b43a]/10 text-[#d9b43a] font-bold font-telemetry text-xs min-h-[36px] flex items-center">
            Page {safePage} of {totalPages}
          </div>

          {/* Next Page */}
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={safePage >= totalPages}
            className="flex items-center gap-1 px-3 py-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 text-xs font-headline font-semibold min-h-[36px]"
            aria-label="Next page"
          >
            <span className="hidden xs:inline">Next</span>
            <ChevronRight size={14} />
          </button>

          {/* Last Page */}
          <button
            onClick={() => setCurrentPage(totalPages)}
            disabled={safePage >= totalPages}
            className="p-2 rounded-xl border border-white/10 bg-white/[0.04] hover:bg-white/[0.08] disabled:opacity-30 disabled:pointer-events-none transition-all active:scale-95 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Last Page"
            aria-label="Last page"
          >
            <ChevronsRight size={14} />
          </button>
        </div>
      </div>

      {/* Footer count & JPL link */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs opacity-60 px-1 font-telemetry">
        <div className="flex items-center gap-2">
          <span>Telemetry Stream: Active</span>
          <span className="w-1 h-1 rounded-full bg-white/40"></span>
          <span>Kinetic Solvers: Synchronized</span>
        </div>
        <a 
          href="https://cneos.jpl.nasa.gov/" 
          target="_blank" 
          rel="noopener noreferrer" 
          className="flex items-center gap-1 text-[#d9b43a] hover:underline"
        >
          <span>NASA JPL Center for NEO Studies</span>
          <ExternalLink size={12} />
        </a>
      </div>
    </div>
  );
};
