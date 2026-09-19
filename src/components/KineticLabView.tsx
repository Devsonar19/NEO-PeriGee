import React, { useState, useEffect, useRef } from 'react';
import { 
  Flame, 
  MapPin, 
  Activity, 
  Sparkles, 
  Scale, 
  ShieldAlert, 
  RotateCcw,
  Sliders,
  Play,
  Pause,
  Clock,
  Radio,
  ExternalLink,
  Target,
  Volume2,
  AlertOctagon
} from 'lucide-react';
import { NeoObject, ThemeMode, AsteroidComposition } from '../types';
import { 
  calculateKineticImpact, 
  calculateObserverImpactEffects, 
  ASTEROID_COMPOSITIONS 
} from '../utils/physics';

interface KineticLabViewProps {
  theme: ThemeMode;
  initialNeo: NeoObject | null;
  neos?: NeoObject[];
}

export const KineticLabView: React.FC<KineticLabViewProps> = ({
  theme,
  initialNeo,
  neos = []
}) => {
  const [selectedAsteroidId, setSelectedAsteroidId] = useState<string>(
    initialNeo?.id || (neos.length > 0 ? neos[0].id : 'custom')
  );

  const activeAsteroid = neos.find((n) => n.id === selectedAsteroidId) || initialNeo || null;

  const defaultDiameter = activeAsteroid?.computed_kinetic?.diameter_meters 
    || ((activeAsteroid?.estimated_diameter.meters.estimated_diameter_min || 340) + (activeAsteroid?.estimated_diameter.meters.estimated_diameter_max || 400)) / 2 
    || 370;

  const defaultVelocity = activeAsteroid?.computed_kinetic?.velocity_km_s 
    || (activeAsteroid?.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second 
        ? parseFloat(activeAsteroid.close_approach_data[0].relative_velocity.kilometers_per_second) 
        : 30.73);

  const [diameter, setDiameter] = useState<number>(defaultDiameter);
  const [velocity, setVelocity] = useState<number>(defaultVelocity);
  const [composition, setComposition] = useState<AsteroidComposition>('stony');
  const [angle, setAngle] = useState<number>(45);
  const [observerDistanceKm, setObserverDistanceKm] = useState<number>(25);

  // Real-time animation playback states
  const [simTimeSeconds, setSimTimeSeconds] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);

  // Sync parameters when selected asteroid changes
  const handleSelectAsteroid = (id: string) => {
    setSelectedAsteroidId(id);
    const target = neos.find((n) => n.id === id);
    if (target) {
      const avgD = ((target.estimated_diameter.meters.estimated_diameter_min || 100) + (target.estimated_diameter.meters.estimated_diameter_max || 200)) / 2;
      const v = target.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second 
        ? parseFloat(target.close_approach_data[0].relative_velocity.kilometers_per_second) 
        : 20;
      setDiameter(Math.round(avgD));
      setVelocity(Number(v.toFixed(1)));
      setSimTimeSeconds(0);
      setIsPlaying(true);
    }
  };

  // Real-time playback loop (up to 20 seconds simulation)
  useEffect(() => {
    let animationFrameId: number;
    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const delta = (now - lastTimestamp) / 1000;
      lastTimestamp = now;

      if (isPlaying) {
        setSimTimeSeconds((prev) => {
          const next = prev + delta * playbackSpeed;
          if (next >= 20) {
            setIsPlaying(false);
            return 20;
          }
          return next;
        });
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isPlaying, playbackSpeed]);

  const result = calculateKineticImpact(diameter, velocity, composition, angle);
  const observerEffects = calculateObserverImpactEffects(result.megatons_tnt, observerDistanceKm);

  // Preset historical & landmark impacts
  const presetScenarios = [
    { name: 'Chelyabinsk (2013)', d: 20, v: 19.0, comp: 'stony' as AsteroidComposition, desc: '0.5 Mt airburst over Russia' },
    { name: 'Tunguska (1908)', d: 65, v: 20.0, comp: 'stony' as AsteroidComposition, desc: '15 Mt leveled 2,000 km² forest' },
    { name: '99942 Apophis', d: 370, v: 30.73, comp: 'stony' as AsteroidComposition, desc: '1,200 Mt close approach 2029' },
    { name: 'Barringer Crater', d: 50, v: 12.8, comp: 'iron' as AsteroidComposition, desc: 'Meteor Crater Arizona (~10 Mt)' },
    { name: 'Chicxulub (K-Pg)', d: 10000, v: 20.0, comp: 'carbonaceous' as AsteroidComposition, desc: 'Extinction of non-avian dinosaurs' }
  ];

  // Visual simulation calculations based on simTimeSeconds
  // Speed of sound ~0.343 km/s = 343 m/s
  const shockwaveRadiusKm = simTimeSeconds > 0.5 ? (simTimeSeconds - 0.5) * 0.343 * 3 : 0;
  const fireballRadiusDisplay = Math.min(result.fireball_radius_km, (simTimeSeconds / 2.0) * result.fireball_radius_km);
  const craterProgress = Math.min(1.0, simTimeSeconds / 2.5); // crater finishes excavating in 2.5s
  const currentCraterDia = result.crater_diameter_meters * craterProgress;
  const isShockwaveAtObserver = shockwaveRadiusKm >= observerDistanceKm;

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-300">
      {/* Header Banner */}
      <div 
        className="p-5 sm:p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
        style={{
          backgroundColor: theme === 'deep-space' ? '#1d1f3a' : 'rgba(254, 243, 199, 0.9)',
          borderColor: theme === 'deep-space' ? 'rgba(217, 180, 58, 0.3)' : 'rgba(217, 180, 58, 0.25)'
        }}
      >
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-[#f47b7b]/20 text-[#f47b7b] border border-[#f47b7b]/40 shrink-0 animate-pulse">
            <Flame size={28} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-telemetry text-[11px] font-bold text-[#d9b43a] uppercase tracking-wider">
                REAL-TIME KINETIC MODELING &bull; COLLINS-MELOSH EQUATIONS
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#d9b43a] text-[#1d1f3a]">
                LIVE PHYSICS ENGINE
              </span>
            </div>
            <h1 className="font-headline font-bold text-xl sm:text-2xl lg:text-3xl text-current tracking-tight mt-0.5">
              Kinetic Impact Laboratory
            </h1>
            <p className="text-xs sm:text-sm opacity-80 mt-1 max-w-2xl leading-relaxed">
              Dynamically model hypersonic asteroid kinetic energy release, transient and final crater excavation dimensions, atmospheric 5-psi overpressure zones, thermal radiation flash radii, and seismic shockwaves using live NASA data.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setDiameter(defaultDiameter);
            setVelocity(defaultVelocity);
            setComposition('stony');
            setAngle(45);
            setSimTimeSeconds(0);
            setIsPlaying(false);
          }}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-headline font-semibold bg-white/10 hover:bg-white/20 transition-all self-start md:self-auto border border-white/10"
        >
          <RotateCcw size={14} />
          <span>Reset Laboratory</span>
        </button>
      </div>

      {/* Live NASA Asteroid Selector Bar */}
      <div 
        className="p-4 rounded-2xl border flex flex-col lg:flex-row lg:items-center justify-between gap-4 backdrop-blur-md"
        style={{
          backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.9)',
          borderColor: theme === 'deep-space' ? 'rgba(217, 180, 58, 0.25)' : 'rgba(217, 180, 58, 0.2)'
        }}
      >
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#d9b43a]/20 text-[#d9b43a]">
            <Radio size={18} />
          </div>
          <div>
            <span className="text-[10px] font-telemetry uppercase font-bold text-[#d9b43a] block">
              REAL-TIME TARGET TELEMETRY SOURCE
            </span>
            <span className="font-headline font-bold text-sm text-current">
              Select Tracked NASA Asteroid:
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedAsteroidId}
            onChange={(e) => handleSelectAsteroid(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-telemetry font-bold border border-white/15 bg-white/5 text-current cursor-pointer hover:bg-white/10 transition-all max-w-[320px] truncate"
            style={{
              backgroundColor: theme === 'deep-space' ? '#1d1f3a' : '#ffffff'
            }}
          >
            {neos.map((neo) => (
              <option key={neo.id} value={neo.id}>
                {neo.name} {neo.is_live_feed ? '[LIVE NASA FEED]' : '[JPL MILESTONE]'} ({neo.close_approach_data?.[0]?.miss_distance?.lunar || '?'} LD)
              </option>
            ))}
          </select>

          {activeAsteroid && (
            <div className="flex items-center gap-2 text-xs font-telemetry opacity-80">
              <span className="hidden sm:inline">Velocity: {defaultVelocity.toFixed(1)} km/s</span>
              <span>&bull;</span>
              <span className="hidden sm:inline">Diameter: ~{Math.round(defaultDiameter)}m</span>
              <a
                href={activeAsteroid.nasa_jpl_url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#d9b43a] transition-colors"
                title="View NASA JPL Record"
              >
                <ExternalLink size={14} />
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Preset Historical Buttons */}
      <div className="flex flex-col gap-2">
        <span className="text-xs font-headline uppercase font-bold opacity-60">
          Or Select Historical Benchmark Impact Event:
        </span>
        <div className="flex flex-wrap gap-2">
          {presetScenarios.map((sc) => (
            <button
              key={sc.name}
              onClick={() => {
                setDiameter(sc.d);
                setVelocity(sc.v);
                setComposition(sc.comp);
                setAngle(45);
                setSimTimeSeconds(0);
                setIsPlaying(true);
              }}
              className="px-3 py-2 rounded-xl text-xs font-headline font-semibold border bg-white/5 hover:bg-white/15 transition-all text-current flex items-center gap-1.5 active:scale-95"
              style={{
                borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }}
            >
              <Sparkles size={12} className="text-[#d9b43a]" />
              <span>{sc.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* REAL-TIME IMPACT SIMULATION VISUALIZER CANVAS */}
      <div 
        className="p-5 sm:p-6 rounded-3xl border flex flex-col gap-4 shadow-xl backdrop-blur-md"
        style={{
          backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          borderColor: theme === 'deep-space' ? 'rgba(244, 123, 123, 0.3)' : 'rgba(244, 123, 123, 0.25)'
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f47b7b]/20 text-[#f47b7b]">
              <Target size={18} />
            </div>
            <div>
              <h3 className="font-headline font-bold text-base text-current">
                Real-Time Hypersonic Impact &amp; Overpressure Propagation
              </h3>
              <span className="text-[11px] font-telemetry opacity-60">
                Ground zero excavation, blast wave propagation, and observer arrival timeline
              </span>
            </div>
          </div>

          {/* Real-time Playback Controls */}
          <div className="flex items-center gap-2 self-start sm:self-auto font-telemetry">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-headline font-bold text-xs bg-[#f47b7b] text-[#1d1f3a] hover:opacity-90 transition-all active:scale-95 shadow-md"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
              <span>{isPlaying ? 'Pause Simulation' : 'Run Real-Time Simulation'}</span>
            </button>

            <button
              onClick={() => {
                setSimTimeSeconds(0);
                setIsPlaying(true);
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
              title="Restart from T = 0.0s"
            >
              <RotateCcw size={14} />
            </button>

            {/* Speed multipliers */}
            {[0.5, 1, 2, 5].map((spd) => (
              <button
                key={spd}
                onClick={() => setPlaybackSpeed(spd)}
                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition-all ${
                  playbackSpeed === spd ? 'bg-[#d9b43a] text-[#1d1f3a]' : 'bg-white/5 opacity-70 hover:opacity-100'
                }`}
              >
                {spd}×
              </button>
            ))}

            <div className="px-2.5 py-1 rounded-xl bg-black/30 border border-white/10 text-xs font-bold text-[#d9b43a]">
              T + {simTimeSeconds.toFixed(2)}s
            </div>
          </div>
        </div>

        {/* Animated SVG Simulation Stage */}
        <div 
          className="relative w-full h-[260px] sm:h-[300px] rounded-2xl overflow-hidden border border-white/10 select-none flex items-center justify-center"
          style={{
            backgroundColor: theme === 'deep-space' ? '#141629' : '#e2e8f0'
          }}
        >
          <svg viewBox="0 0 700 300" className="w-full h-full">
            <defs>
              <radialGradient id="fireballGlow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
                <stop offset="35%" stopColor="#f47b7b" stopOpacity="0.9" />
                <stop offset="70%" stopColor="#d9b43a" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#f47b7b" stopOpacity="0" />
              </radialGradient>

              <linearGradient id="craterCrust" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4c4f7b" />
                <stop offset="100%" stopColor="#1d1f3a" />
              </linearGradient>
            </defs>

            {/* Horizon Ground Line */}
            <line x1="0" y1="200" x2="700" y2="200" stroke="#7c809c" strokeWidth="2" strokeOpacity="0.4" />
            <rect x="0" y="200" width="700" height="100" fill="url(#craterCrust)" fillOpacity="0.8" />

            {/* Ground Zero Marker */}
            <line x1="350" y1="180" x2="350" y2="220" stroke="#f47b7b" strokeWidth="2" strokeDasharray="2 2" />
            <text x="350" y="235" textAnchor="middle" fill="#f47b7b" fontSize="10" fontFamily="JetBrains Mono" fontWeight="bold">
              GROUND ZERO
            </text>

            {/* Excavated Crater Profile in Ground */}
            {simTimeSeconds > 0 && (
              <path
                d={`M ${350 - Math.min(180, currentCraterDia / 8)} 200 Q 350 ${200 + Math.min(70, (result.crater_depth_meters / 6) * craterProgress)} ${350 + Math.min(180, currentCraterDia / 8)} 200 Z`}
                fill="#141629"
                stroke="#d9b43a"
                strokeWidth="2"
              />
            )}

            {/* Fireball Thermal Flash Expansion */}
            {simTimeSeconds > 0 && simTimeSeconds < 8 && (
              <circle
                cx="350"
                cy="195"
                r={Math.min(140, Math.max(10, fireballRadiusDisplay * 15))}
                fill="url(#fireballGlow)"
              />
            )}

            {/* Atmospheric Overpressure Shockwave Expanding Ring */}
            {simTimeSeconds > 0.3 && (
              <ellipse
                cx="350"
                cy="200"
                rx={Math.min(330, shockwaveRadiusKm * 10)}
                ry={Math.min(180, shockwaveRadiusKm * 5.5)}
                fill="none"
                stroke="#f47b7b"
                strokeWidth="2"
                strokeDasharray="4 3"
                opacity={Math.max(0.2, 1 - (simTimeSeconds / 20))}
              />
            )}

            {/* Observer Location Marker */}
            {/* Observer scaled X position: 350 + (observerDistanceKm / 150) * 300 */}
            {(() => {
              const obsX = 350 + Math.min(320, (observerDistanceKm / 100) * 280);
              return (
                <g>
                  <line x1={obsX} y1="170" x2={obsX} y2="200" stroke="#34d399" strokeWidth="2" />
                  <circle cx={obsX} cy="170" r="5" fill="#34d399" />
                  <text x={obsX} y="160" textAnchor="middle" fill="#34d399" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                    OBSERVER ({observerDistanceKm} km)
                  </text>
                  {isShockwaveAtObserver && (
                    <text x={obsX} y="220" textAnchor="middle" fill="#f47b7b" fontSize="9" fontFamily="JetBrains Mono" fontWeight="bold">
                      BLAST ARRIVED
                    </text>
                  )}
                </g>
              );
            })()}
          </svg>

          {/* Time Scrubber at Bottom of Canvas */}
          <div className="absolute bottom-2 left-4 right-4 flex items-center gap-3 bg-[#1d1f3a]/80 backdrop-blur-md p-2 rounded-xl border border-white/10">
            <span className="text-[10px] font-telemetry text-[#d9b43a] font-bold shrink-0">
              TIMELINE:
            </span>
            <input
              type="range"
              min="0"
              max="20"
              step="0.05"
              value={simTimeSeconds}
              onChange={(e) => {
                setSimTimeSeconds(Number(e.target.value));
                setIsPlaying(false);
              }}
              className="w-full h-1.5 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#f47b7b]"
            />
            <span className="text-[10px] font-telemetry shrink-0 opacity-70">
              {simTimeSeconds.toFixed(1)}s / 20.0s
            </span>
          </div>
        </div>

        {/* Live Simulation Real-Time Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-telemetry text-xs">
          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase opacity-60 block">Excavated Crater Width</span>
            <span className="font-bold text-[#d9b43a] text-sm sm:text-base">
              {Math.round(currentCraterDia).toLocaleString()} m
            </span>
            <span className="text-[9px] opacity-60 block">Depth: {Math.round(result.crater_depth_meters * craterProgress)}m</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase opacity-60 block">Shockwave Radius</span>
            <span className="font-bold text-[#f47b7b] text-sm sm:text-base">
              {shockwaveRadiusKm.toFixed(1)} km
            </span>
            <span className="text-[9px] opacity-60 block">Mach ~1.0 Acoustical Wave</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase opacity-60 block">Fireball Flash</span>
            <span className="font-bold text-current text-sm sm:text-base">
              {fireballRadiusDisplay.toFixed(1)} km
            </span>
            <span className="text-[9px] opacity-60 block">Max: {result.fireball_radius_km.toFixed(1)} km</span>
          </div>

          <div className="p-3 rounded-xl bg-white/5 border border-white/5">
            <span className="text-[9px] uppercase opacity-60 block">Observer Shockwave Status</span>
            <span className={`font-bold text-sm sm:text-base ${isShockwaveAtObserver ? 'text-[#f47b7b]' : 'text-emerald-400'}`}>
              {isShockwaveAtObserver ? 'IMPACTED' : `T - ${Math.max(0, observerEffects.shockwaveArrivalSeconds - simTimeSeconds).toFixed(1)}s`}
            </span>
            <span className="text-[9px] opacity-60 block">Distance: {observerDistanceKm} km</span>
          </div>
        </div>
      </div>

      {/* Main 2-Column Controls & Physical Impact Assessment Deck */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Interactive Sliders & Observer Position (6 cols) */}
        <div 
          className="lg:col-span-6 p-5 sm:p-6 rounded-2xl border flex flex-col gap-5 shadow-xl"
          style={{
            backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Sliders size={18} className="text-[#d9b43a]" />
            <h2 className="font-headline font-bold text-base text-current">
              Target Impact Physics Inputs
            </h2>
          </div>

          {/* Impactor Diameter Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-telemetry">
              <span className="font-bold opacity-70">Impactor Mean Diameter</span>
              <span className="font-bold text-[#d9b43a] text-sm">
                {diameter >= 1000 ? `${(diameter / 1000).toFixed(2)} km` : `${diameter} meters`}
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="2000"
              step="10"
              value={diameter}
              onChange={(e) => setDiameter(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d9b43a]"
            />
            <div className="flex justify-between text-[10px] opacity-50 font-telemetry">
              <span>10m (Chelyabinsk)</span>
              <span>370m (Apophis)</span>
              <span>2,000m (Global Catastrophe)</span>
            </div>
          </div>

          {/* Velocity Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-telemetry">
              <span className="font-bold opacity-70">Relative Entry Velocity</span>
              <span className="font-bold text-[#d9b43a] text-sm">
                {velocity.toFixed(1)} km/s ({Math.round(velocity * 3600).toLocaleString()} km/h)
              </span>
            </div>
            <input
              type="range"
              min="11.2"
              max="72"
              step="0.5"
              value={velocity}
              onChange={(e) => setVelocity(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#d9b43a]"
            />
            <div className="flex justify-between text-[10px] opacity-50 font-telemetry">
              <span>11.2 km/s (Escape Vel.)</span>
              <span>30 km/s (Typical Apollo)</span>
              <span>72 km/s (Retrograde Comet)</span>
            </div>
          </div>

          {/* Observer Distance Slider */}
          <div className="flex flex-col gap-1.5 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
            <div className="flex justify-between items-center text-xs font-telemetry">
              <span className="font-bold text-emerald-400">Observer Distance from Ground Zero</span>
              <span className="font-bold text-emerald-400 text-sm">
                {observerDistanceKm} km
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="150"
              step="1"
              value={observerDistanceKm}
              onChange={(e) => setObserverDistanceKm(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
            <div className="flex justify-between text-[10px] opacity-60 font-telemetry">
              <span>2 km (Ground Zero Periphery)</span>
              <span>50 km (Metro Suburb)</span>
              <span>150 km (Regional Shelter)</span>
            </div>
          </div>

          {/* Asteroid Composition Selector */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between text-xs font-telemetry">
              <span className="font-bold opacity-70">Impactor Density &amp; Composition</span>
              <span className="text-[#d9b43a]">{ASTEROID_COMPOSITIONS[composition].density} kg/m³</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(Object.keys(ASTEROID_COMPOSITIONS) as AsteroidComposition[]).map((key) => {
                const compData = ASTEROID_COMPOSITIONS[key];
                const isSelected = composition === key;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setComposition(key)}
                    className={`p-3 rounded-xl border text-left flex flex-col gap-0.5 transition-all ${
                      isSelected
                        ? 'border-[#d9b43a] bg-[#d9b43a]/20 text-[#d9b43a]'
                        : 'border-white/10 bg-white/5 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <span className="text-xs font-headline font-bold">{compData.name}</span>
                    <span className="text-[10px] font-telemetry opacity-60">{compData.description}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Impact Angle Slider */}
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center text-xs font-telemetry">
              <span className="font-bold opacity-70">Impact Trajectory Angle</span>
              <span className="font-bold text-[#f47b7b] text-sm">{angle}°</span>
            </div>
            <input
              type="range"
              min="15"
              max="90"
              step="5"
              value={angle}
              onChange={(e) => setAngle(Number(e.target.value))}
              className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-[#f47b7b]"
            />
            <div className="flex justify-between text-[10px] opacity-50 font-telemetry">
              <span>15° Shallow Grazing</span>
              <span>45° Statistical Average</span>
              <span>90° Vertical Plunge</span>
            </div>
          </div>
        </div>

        {/* Right Column: Damage Matrix & Observer Blast Impact Telemetry (6 cols) */}
        <div 
          className="lg:col-span-6 p-5 sm:p-6 rounded-2xl border flex flex-col gap-5 shadow-xl"
          style={{
            backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.9)',
            borderColor: theme === 'deep-space' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'
          }}
        >
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <Activity size={18} className="text-[#f47b7b]" />
              <h2 className="font-headline font-bold text-base text-current">
                Calculated Environmental Destruction Matrix
              </h2>
            </div>
            <span className="text-[10px] font-telemetry uppercase font-bold text-[#f47b7b] bg-[#f47b7b]/15 px-2 py-0.5 rounded-full border border-[#f47b7b]/20">
              NASA DATA SCALE
            </span>
          </div>

          {/* Primary Yield Banner */}
          <div 
            className="p-4 rounded-xl border flex items-center justify-between gap-4"
            style={{
              backgroundColor: theme === 'deep-space' ? 'rgba(244, 123, 123, 0.1)' : 'rgba(254, 242, 242, 0.9)',
              borderColor: 'rgba(244, 123, 123, 0.3)'
            }}
          >
            <div>
              <span className="text-[10px] font-headline uppercase font-bold text-[#f47b7b] tracking-wider block">
                Total Kinetic Yield
              </span>
              <div className="font-telemetry font-bold text-2xl sm:text-3xl text-[#f47b7b]">
                {result.megatons_tnt >= 10 ? result.megatons_tnt.toLocaleString() : result.megatons_tnt.toFixed(2)} Mt
              </div>
              <span className="text-xs opacity-70 block mt-0.5">
                {(result.energy_joules / 1e15).toFixed(2)} &times; 10¹⁵ Joules
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-headline uppercase font-bold opacity-60 block">Seismic Magnitude</span>
              <div className="font-telemetry font-bold text-xl sm:text-2xl text-[#d9b43a]">
                M{result.seismic_magnitude.toFixed(1)} Richter
              </div>
              <span className="text-[10px] opacity-60 block">P-Wave speed 5.5 km/s</span>
            </div>
          </div>

          {/* Observer Real-Time Effects Deck at observerDistanceKm */}
          <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex flex-col gap-2 font-telemetry text-xs">
            <div className="flex items-center justify-between text-emerald-400 font-bold">
              <span>Observer Telemetry ({observerDistanceKm} km from Ground Zero)</span>
              <span>Shockwave Arrival: {observerEffects.shockwaveArrivalSeconds}s</span>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-1">
              <div className="p-2 rounded-lg bg-black/20">
                <span className="text-[9px] uppercase opacity-60 block">Peak Overpressure</span>
                <span className="font-bold text-current">{observerEffects.peakOverpressurePsi} psi</span>
                <span className="text-[9px] opacity-70 block">{observerEffects.overpressureDamage}</span>
              </div>

              <div className="p-2 rounded-lg bg-black/20">
                <span className="text-[9px] uppercase opacity-60 block">Thermal Radiation</span>
                <span className="font-bold text-current">{observerEffects.thermalRadiationCalCm2} cal/cm²</span>
                <span className="text-[9px] opacity-70 block">{observerEffects.thermalDamage}</span>
              </div>
            </div>
          </div>

          {/* Physical Geometry Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 font-telemetry text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase opacity-60 block">Excavated Crater Dia.</span>
              <span className="font-bold text-[#d9b43a] text-sm sm:text-base">
                {result.crater_diameter_meters >= 1000 
                  ? `${(result.crater_diameter_meters / 1000).toFixed(2)} km` 
                  : `${Math.round(result.crater_diameter_meters)} m`}
              </span>
              <span className="text-[10px] opacity-60 block">Depth: {Math.round(result.crater_depth_meters)} m</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase opacity-60 block">5-psi Blast Radius</span>
              <span className="font-bold text-[#f47b7b] text-sm sm:text-base">
                {result.blast_airburst_radius_km.toFixed(1)} km
              </span>
              <span className="text-[10px] opacity-60 block">Residential collapse</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[10px] uppercase opacity-60 block">Fireball Thermal Radius</span>
              <span className="font-bold text-[#d9b43a] text-sm sm:text-base">
                {result.fireball_radius_km.toFixed(1)} km
              </span>
              <span className="text-[10px] opacity-60 block">3rd-degree burns</span>
            </div>
          </div>

          {/* Historical Comparison Context Callout */}
          <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 text-xs">
            <span className="font-headline font-bold text-[10px] uppercase text-[#d9b43a] tracking-wider block mb-1">
              Historical Threat Context
            </span>
            <p className="opacity-80 italic leading-relaxed">
              &ldquo;{result.historical_comparison}&rdquo;
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
