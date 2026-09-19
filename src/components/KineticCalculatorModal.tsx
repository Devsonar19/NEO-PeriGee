import React, { useState } from 'react';
import { 
  X, 
  Flame, 
  Sliders, 
  MapPin, 
  Activity, 
  Sparkles, 
  Scale, 
  ShieldAlert, 
  Check, 
  RotateCcw 
} from 'lucide-react';
import { NeoObject, ThemeMode, AsteroidComposition } from '../types';
import { calculateKineticImpact, ASTEROID_COMPOSITIONS } from '../utils/physics';

interface KineticCalculatorModalProps {
  theme: ThemeMode;
  initialNeo: NeoObject | null;
  isOpen: boolean;
  onClose: () => void;
}

export const KineticCalculatorModal: React.FC<KineticCalculatorModalProps> = ({
  theme,
  initialNeo,
  isOpen,
  onClose
}) => {
  const defaultDiameter = initialNeo?.computed_kinetic?.diameter_meters || 370; // Apophis default
  const defaultVelocity = initialNeo?.computed_kinetic?.velocity_km_s || 30.73;

  const [diameter, setDiameter] = useState<number>(defaultDiameter);
  const [velocity, setVelocity] = useState<number>(defaultVelocity);
  const [composition, setComposition] = useState<AsteroidComposition>('stony');
  const [angle, setAngle] = useState<number>(45);

  if (!isOpen) return null;

  const result = calculateKineticImpact(diameter, velocity, composition, angle);

  const handleReset = () => {
    setDiameter(defaultDiameter);
    setVelocity(defaultVelocity);
    setComposition('stony');
    setAngle(45);
  };

  const presetScenarios = [
    { name: 'Chelyabinsk (2013)', d: 20, v: 19.0, comp: 'stony' as AsteroidComposition, desc: '0.5 Mt airburst over Russia' },
    { name: 'Tunguska (1908)', d: 65, v: 20.0, comp: 'stony' as AsteroidComposition, desc: '15 Mt leveled 2,000 km² forest' },
    { name: '99942 Apophis', d: 370, v: 30.73, comp: 'stony' as AsteroidComposition, desc: '1,200 Mt close approach 2029' },
    { name: 'Barringer Crater', d: 50, v: 12.8, comp: 'iron' as AsteroidComposition, desc: 'Meteor Crater Arizona (~10 Mt)' },
    { name: 'Chicxulub (K-Pg)', d: 10000, v: 20.0, comp: 'carbonaceous' as AsteroidComposition, desc: 'Extinction of non-avian dinosaurs' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/92 backdrop-blur-2xl overflow-y-auto">
      <div 
        className="w-full max-w-4xl rounded-2xl p-5 sm:p-7 flex flex-col gap-5 my-auto border shadow-2xl relative"
        style={{
          backgroundColor: theme === 'deep-space' ? '#14162a' : '#ffffff',
          borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.15)',
          color: theme === 'deep-space' ? '#F8FAFC' : '#1d1f3a'
        }}
        id="kinetic-calculator-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-[#f47b7b]/20 text-[#f47b7b] border border-[#f47b7b]/30">
              <Flame size={24} />
            </div>
            <div className="flex flex-col">
              <h2 className="font-headline font-bold text-xl sm:text-2xl tracking-tight text-current">
                Kinetic Impact Engineering Engine
              </h2>
              <span className="text-xs font-telemetry uppercase tracking-wider opacity-60">
                Orbital Velocity Energy Propagation &amp; Crater Dynamics
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-current transition-colors"
            aria-label="Close Kinetic Calculator Modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preset Scenarios Quick Bar */}
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-headline uppercase font-bold opacity-60">
            Historical &amp; Benchmark Scenarios:
          </span>
          <div className="flex flex-wrap gap-2">
            {presetScenarios.map((sc) => (
              <button
                key={sc.name}
                onClick={() => {
                  setDiameter(sc.d);
                  setVelocity(sc.v);
                  setComposition(sc.comp);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-telemetry transition-all active:scale-95 ${
                  diameter === sc.d && velocity === sc.v && composition === sc.comp
                    ? 'bg-[#f47b7b] text-[#1d1f3a] font-bold shadow-md shadow-[#f47b7b]/30'
                    : 'bg-white/5 hover:bg-white/10 border border-white/10 opacity-80'
                }`}
              >
                {sc.name}
              </button>
            ))}
            <button
              onClick={handleReset}
              className="px-2.5 py-1.5 rounded-lg text-xs font-telemetry bg-white/5 hover:bg-white/10 border border-white/10 opacity-70 flex items-center gap-1"
              title="Reset parameters"
            >
              <RotateCcw size={12} /> Reset
            </button>
          </div>
        </div>

        {/* Input Parameters Controls Grid */}
        <div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 sm:p-5 rounded-2xl border"
          style={{ 
            backgroundColor: theme === 'deep-space' ? '#1a1c34' : '#f8fafc', 
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)' 
          }}
        >
          {/* Diameter Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-telemetry">
              <span className="font-bold opacity-75">Impactor Diameter:</span>
              <span className="text-[#d9b43a] font-bold text-sm">
                {diameter >= 1000 ? `${(diameter / 1000).toFixed(2)} km` : `${diameter} meters`}
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="5000"
              step="5"
              value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d9b43a]"
            />
            <div className="flex justify-between text-[10px] font-telemetry opacity-50">
              <span>5 m (Bus)</span>
              <span>100 m (Stadium)</span>
              <span>1 km (Mountain)</span>
              <span>5 km (Island)</span>
            </div>
          </div>

          {/* Velocity Input */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-telemetry">
              <span className="font-bold opacity-75">Entry Velocity:</span>
              <span className="text-[#d9b43a] font-bold text-sm">
                {velocity.toFixed(1)} km/s ({((velocity * 3600) / 1000).toLocaleString()} km/h)
              </span>
            </div>
            <input
              type="range"
              min="11"
              max="72"
              step="0.5"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d9b43a]"
            />
            <div className="flex justify-between text-[10px] font-telemetry opacity-50">
              <span>11.2 km/s (Escape Velocity)</span>
              <span>30 km/s (Earth Orbital)</span>
              <span>72 km/s (Retrograde Max)</span>
            </div>
          </div>

          {/* Composition Selection */}
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <span className="text-xs font-headline uppercase font-bold opacity-75">
              Impactor Composition &amp; Bulk Density:
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {(Object.keys(ASTEROID_COMPOSITIONS) as AsteroidComposition[]).map((cKey) => {
                const info = ASTEROID_COMPOSITIONS[cKey];
                const isSelected = composition === cKey;
                return (
                  <button
                    key={cKey}
                    onClick={() => setComposition(cKey)}
                    className={`p-2.5 rounded-xl text-left font-telemetry transition-all active:scale-95 ${
                      isSelected
                        ? 'bg-[#f47b7b]/20 text-[#f47b7b] border-2 border-[#f47b7b] font-bold'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 opacity-70'
                    }`}
                  >
                    <div className="text-xs font-bold uppercase">{cKey}</div>
                    <div className="text-[10px] opacity-75">{info.density} kg/m³</div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Calculated Kinetic Output Matrix */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-headline text-xs font-bold uppercase tracking-wider opacity-60">
              Physics Engine Computed Results
            </span>
            <span className="font-telemetry text-xs text-[#d9b43a] font-bold">
              Mass: {(result.mass_kg / 1e9).toFixed(2)} Million Metric Tons
            </span>
          </div>

          {/* Primary Yield Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#1d1f3a] via-[#4c4f7b]/40 to-[#1d1f3a] border border-[#f47b7b]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
            <div className="flex flex-col">
              <span className="font-headline text-xs font-bold uppercase tracking-wider text-[#f47b7b]">
                Total Kinetic Blast Yield
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-telemetry text-3xl sm:text-5xl font-extrabold text-[#d9b43a]">
                  {result.megatons_tnt.toLocaleString()}
                </span>
                <span className="font-telemetry text-base font-bold opacity-80">
                  Megatons TNT
                </span>
              </div>
              <span className="font-telemetry text-xs opacity-75 mt-0.5">
                {(result.energy_joules / 1e18).toFixed(3)} Exajoules (10¹⁸ J)
              </span>
            </div>

            <div className="max-w-xs bg-black/40 p-3 rounded-xl border border-white/10 text-xs italic font-body opacity-90 leading-relaxed">
              {result.historical_comparison}
            </div>
          </div>

          {/* Detailed Damage Zones Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div 
              className="p-3.5 rounded-xl border flex flex-col"
              style={{
                backgroundColor: theme === 'deep-space' ? '#1f2240' : '#f1f5f9',
                borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }}
            >
              <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
                <MapPin size={12} className="text-[#f47b7b]" /> Crater Diameter
              </span>
              <span className="font-telemetry text-lg sm:text-xl font-bold text-current mt-1">
                {result.crater_diameter_meters >= 1000 
                  ? `${(result.crater_diameter_meters / 1000).toFixed(2)} km`
                  : `${result.crater_diameter_meters.toFixed(0)} m`}
              </span>
              <span className="text-[10px] opacity-60">Depth: {result.crater_depth_meters.toFixed(0)} m</span>
            </div>

            <div 
              className="p-3.5 rounded-xl border flex flex-col"
              style={{
                backgroundColor: theme === 'deep-space' ? '#1f2240' : '#f1f5f9',
                borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }}
            >
              <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
                <Activity size={12} className="text-[#d9b43a]" /> Blast Wave (5 psi)
              </span>
              <span className="font-telemetry text-lg sm:text-xl font-bold text-[#d9b43a] mt-1">
                {result.blast_airburst_radius_km.toFixed(1)} km
              </span>
              <span className="text-[10px] opacity-60">Complete building collapse</span>
            </div>

            <div 
              className="p-3.5 rounded-xl border flex flex-col"
              style={{
                backgroundColor: theme === 'deep-space' ? '#1f2240' : '#f1f5f9',
                borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }}
            >
              <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
                <Sparkles size={12} className="text-[#d9b43a]" /> Thermal Fireball
              </span>
              <span className="font-telemetry text-lg sm:text-xl font-bold text-[#d9b43a] mt-1">
                {result.fireball_radius_km.toFixed(1)} km
              </span>
              <span className="text-[10px] opacity-60">Instant ignition radius</span>
            </div>

            <div 
              className="p-3.5 rounded-xl border flex flex-col"
              style={{
                backgroundColor: theme === 'deep-space' ? '#1f2240' : '#f1f5f9',
                borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'
              }}
            >
              <span className="text-[10px] font-headline uppercase font-bold opacity-75 flex items-center gap-1">
                <Scale size={12} className="text-[#7c809c]" /> Seismic Ground Shock
              </span>
              <span className="font-telemetry text-lg sm:text-xl font-bold text-[#7c809c] mt-1">
                M {result.seismic_magnitude.toFixed(1)}
              </span>
              <span className="text-[10px] opacity-60">Richter equivalent</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-white/10 pt-4">
          <span className="text-xs opacity-60 font-telemetry">
            Impact models calibrated against Collins, Melosh &amp; Marcus (2005)
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl font-headline font-bold text-xs uppercase tracking-wider bg-white/10 hover:bg-white/20 text-current transition-colors"
          >
            Close Laboratory
          </button>
        </div>
      </div>
    </div>
  );
};
