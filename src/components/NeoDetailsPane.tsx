import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  ExternalLink, 
  Sliders, 
  Activity, 
  Sparkles, 
  Scale, 
  MapPin 
} from 'lucide-react';
import { NeoObject, ThemeMode, AsteroidComposition } from '../types';
import { calculateKineticImpact, ASTEROID_COMPOSITIONS } from '../utils/physics';

interface NeoDetailsPaneProps {
  theme: ThemeMode;
  neo: NeoObject | null;
  onClose: () => void;
  onOpenKineticLab: (neo?: NeoObject) => void;
  isDrawerOnMobile?: boolean;
}

export const NeoDetailsPane: React.FC<NeoDetailsPaneProps> = ({
  theme,
  neo,
  onClose,
  onOpenKineticLab,
  isDrawerOnMobile = false
}) => {
  const [composition, setComposition] = useState<AsteroidComposition>('stony');
  const [impactAngle, setImpactAngle] = useState<number>(45);

  if (!neo) {
    return (
      <div className="glass-card p-6 flex flex-col items-center justify-center text-center h-full min-h-[350px] opacity-70">
        <Activity size={36} className="text-[#d9b43a] mb-3 animate-pulse" />
        <h3 className="font-headline font-bold text-base mb-1">
          No Asteroid Selected
        </h3>
        <p className="text-xs max-w-xs opacity-75">
          Select any object from the radar or telemetry table to compute its live kinetic yield vectors and impact footprints.
        </p>
      </div>
    );
  }

  // Base physics metrics
  const avgDiameterMeters =
    (neo.estimated_diameter.meters.estimated_diameter_min +
      neo.estimated_diameter.meters.estimated_diameter_max) / 2;

  const velocityKmS = neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second
    ? parseFloat(neo.close_approach_data[0].relative_velocity.kilometers_per_second)
    : 20.0;

  // Real-time recalculated kinetic impact based on user composition & angle
  const liveImpact = calculateKineticImpact(
    avgDiameterMeters,
    velocityKmS,
    composition,
    impactAngle
  );

  const isHazardous = neo.is_potentially_hazardous_asteroid;
  const lunarDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || '0');
  const kmDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.kilometers || '0').toLocaleString();
  const auDist = neo.close_approach_data?.[0]?.miss_distance?.astronomical || '0.00';

  return (
    <div 
      className={`rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-2xl border ${
        isDrawerOnMobile ? 'w-full max-h-none overflow-visible' : 'w-full max-h-[calc(100vh-6rem)] overflow-y-auto'
      } ${isHazardous ? 'hazard-pulse' : ''}`}
      style={{
        backgroundColor: theme === 'deep-space' ? '#181a30' : '#ffffff',
        borderColor: isHazardous ? 'rgba(244, 123, 123, 0.4)' : 'rgba(217, 180, 58, 0.3)',
        color: theme === 'deep-space' ? '#F8FAFC' : '#1d1f3a'
      }}
      id="neo-details-pane"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3 shrink-0">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${isHazardous ? 'bg-[#f47b7b] animate-pulse' : 'bg-[#d9b43a]'}`} />
            <h3 className="font-headline font-bold text-lg sm:text-xl text-current tracking-tight">
              {neo.name}
            </h3>
          </div>
          <span className={`text-xs font-headline font-bold uppercase tracking-wider mt-0.5 ${
            isHazardous ? 'text-[#f47b7b]' : 'text-[#d9b43a]'
          }`}>
            {neo.orbital_class || (isHazardous ? 'CRITICAL PHA // LEVEL 1' : 'ROUTINE NEAR-EARTH OBJECT')}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <a
            href={neo.nasa_jpl_url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#d9b43a] border border-white/10 transition-colors"
            title="View Official NASA JPL Small-Body Database Record"
            aria-label="NASA JPL Record"
          >
            <ExternalLink size={16} />
          </a>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-current border border-white/10 transition-colors"
            aria-label="Close Inspector Pane"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Orbital Rendezvous Overview */}
      <div 
        className="grid grid-cols-2 gap-2 p-3 rounded-xl font-telemetry text-xs border shrink-0"
        style={{
          backgroundColor: theme === 'deep-space' ? '#212442' : '#f1f5f9',
          borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <div>
          <span className="opacity-50 text-[10px] uppercase block">Perigee Date</span>
          <span className="font-semibold">{neo.close_approach_data?.[0]?.close_approach_date || '2026-09-24'}</span>
        </div>
        <div>
          <span className="opacity-50 text-[10px] uppercase block">Miss Distance</span>
          <span className={`font-bold ${lunarDist < 1 ? 'text-[#f47b7b]' : 'text-[#d9b43a]'}`}>
            {lunarDist.toFixed(3)} LD ({kmDist} km)
          </span>
        </div>
        <div>
          <span className="opacity-50 text-[10px] uppercase block">Rel. Velocity</span>
          <span className="font-semibold">{velocityKmS.toFixed(2)} km/s</span>
        </div>
        <div>
          <span className="opacity-50 text-[10px] uppercase block">Astronomical Units</span>
          <span className="font-semibold">{auDist} AU</span>
        </div>
      </div>

      {/* Kinetic Impact Engine Yield Card */}
      <div 
        className="p-4 rounded-xl border relative z-10 shrink-0 flex flex-col gap-2.5 shadow-lg min-h-[140px]"
        style={{
          backgroundColor: theme === 'deep-space' 
            ? (isHazardous ? '#2a1a2b' : '#26241a') 
            : (isHazardous ? '#FEF2F2' : '#FFFBEB'),
          borderColor: isHazardous ? 'rgba(244, 123, 123, 0.55)' : 'rgba(217, 180, 58, 0.45)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-headline text-[10px] font-bold uppercase tracking-wider opacity-90 flex items-center gap-1.5">
            <Flame size={14} className={isHazardous ? 'text-[#f47b7b]' : 'text-[#d9b43a]'} />
            Kinetic Impact Engine Yield
          </span>
          <span className="text-[10px] font-telemetry px-2 py-0.5 rounded-full bg-white/10 font-bold border border-white/10">
            E = ½mv²
          </span>
        </div>

        <div className="flex items-baseline gap-2">
          <span className="font-telemetry text-2xl sm:text-3xl font-bold tracking-tight text-[#d9b43a]">
            {liveImpact.megatons_tnt.toLocaleString()}
          </span>
          <span className="font-telemetry text-xs sm:text-sm font-semibold opacity-85">
            Megatons TNT
          </span>
        </div>

        <p 
          className="text-xs font-body italic opacity-95 leading-relaxed p-2.5 rounded-lg border"
          style={{
            backgroundColor: theme === 'deep-space' ? '#141628' : 'rgba(0,0,0,0.05)',
            borderColor: theme === 'deep-space' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
          }}
        >
          {liveImpact.historical_comparison}
        </p>
      </div>

      {/* Real-time Footprint & Crater Parameters */}
      <div className="grid grid-cols-2 gap-2.5 shrink-0">
        <div 
          className="p-3 rounded-xl border flex flex-col"
          style={{
            backgroundColor: theme === 'deep-space' ? '#212442' : '#f8fafc',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
            <MapPin size={12} className="text-[#f47b7b]" /> Crater Diameter
          </span>
          <span className="font-telemetry text-base sm:text-lg font-bold text-current mt-0.5">
            {liveImpact.crater_diameter_meters >= 1000 
              ? `${(liveImpact.crater_diameter_meters / 1000).toFixed(2)} km`
              : `${liveImpact.crater_diameter_meters.toFixed(0)} m`}
          </span>
          <span className="text-[10px] opacity-60">Depth: ~{liveImpact.crater_depth_meters.toFixed(0)} m</span>
        </div>

        <div 
          className="p-3 rounded-xl border flex flex-col"
          style={{
            backgroundColor: theme === 'deep-space' ? '#212442' : '#f8fafc',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
            <Activity size={12} className="text-[#d9b43a]" /> Blast Airburst (5 psi)
          </span>
          <span className="font-telemetry text-base sm:text-lg font-bold text-[#d9b43a] mt-0.5">
            {liveImpact.blast_airburst_radius_km.toFixed(1)} km
          </span>
          <span className="text-[10px] opacity-60">Severe structural collapse zone</span>
        </div>

        <div 
          className="p-3 rounded-xl border flex flex-col"
          style={{
            backgroundColor: theme === 'deep-space' ? '#212442' : '#f8fafc',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
            <Sparkles size={12} className="text-[#d9b43a]" /> Thermal Fireball
          </span>
          <span className="font-telemetry text-base sm:text-lg font-bold text-[#d9b43a] mt-0.5">
            {liveImpact.fireball_radius_km.toFixed(1)} km
          </span>
          <span className="text-[10px] opacity-60">3rd-degree thermal flash</span>
        </div>

        <div 
          className="p-3 rounded-xl border flex flex-col"
          style={{
            backgroundColor: theme === 'deep-space' ? '#212442' : '#f8fafc',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
            <Scale size={12} className="text-[#7c809c]" /> Seismic Richter
          </span>
          <span className="font-telemetry text-base sm:text-lg font-bold text-[#7c809c] mt-0.5">
            M {liveImpact.seismic_magnitude.toFixed(1)}
          </span>
          <span className="text-[10px] opacity-60">Ground shockwave intensity</span>
        </div>
      </div>

      {/* Interactive Physics Param Controls */}
      <div 
        className="p-3.5 rounded-xl border flex flex-col gap-3 shrink-0"
        style={{
          backgroundColor: theme === 'deep-space' ? '#212442' : '#f8fafc',
          borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
        }}
      >
        <div className="flex items-center justify-between">
          <span className="font-headline text-xs font-bold uppercase tracking-wider opacity-75 flex items-center gap-1.5">
            <Sliders size={14} className="text-[#d9b43a]" />
            Impact Engine Parameters
          </span>
          <span className="text-[10px] font-telemetry opacity-60">
            Live Math Engine
          </span>
        </div>

        {/* Composition Radio Chips */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] font-headline uppercase font-bold opacity-60">
            Composition &amp; Bulk Density:
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {(Object.keys(ASTEROID_COMPOSITIONS) as AsteroidComposition[]).map((compKey) => {
              const comp = ASTEROID_COMPOSITIONS[compKey];
              const isSelected = composition === compKey;
              return (
                <button
                  key={compKey}
                  onClick={() => setComposition(compKey)}
                  className={`px-2.5 py-1.5 rounded-lg text-left text-[11px] font-telemetry transition-all active:scale-95 ${
                    isSelected
                      ? 'bg-[#d9b43a]/20 text-[#d9b43a] border border-[#d9b43a]/50 font-semibold'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent opacity-70'
                  }`}
                >
                  <div className="font-bold truncate">{compKey.toUpperCase()}</div>
                  <div className="text-[9px] opacity-75">{comp.density} kg/m³</div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Impact Angle Slider */}
        <div className="flex flex-col gap-1 mt-1">
          <div className="flex justify-between text-[11px] font-telemetry">
            <span className="opacity-60">Impact Trajectory Angle:</span>
            <span className="font-bold text-[#d9b43a]">{impactAngle}°</span>
          </div>
          <input
            type="range"
            min="15"
            max="90"
            step="5"
            value={impactAngle}
            onChange={(e) => setImpactAngle(Number(e.target.value))}
            className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d9b43a]"
          />
          <div className="flex justify-between text-[9px] font-telemetry opacity-50">
            <span>15° Shallow Grazing</span>
            <span>45° Standard</span>
            <span>90° Vertical Impact</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 pt-1 shrink-0 pb-2">
        <button
          onClick={() => onOpenKineticLab(neo)}
          className="w-full py-2.5 px-4 rounded-xl font-headline font-bold text-xs uppercase tracking-wider bg-gradient-to-r from-[#f47b7b] to-[#d9b43a] hover:opacity-90 text-[#1d1f3a] shadow-lg shadow-[#1d1f3a]/30 transition-all active:scale-98 flex items-center justify-center gap-2"
          id="openInKineticLabBtn"
        >
          <Flame size={16} />
          <span>Full Kinetic Simulation Lab</span>
        </button>
      </div>
    </div>
  );
};
