import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Compass, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Play, 
  Pause, 
  FastForward, 
  Clock, 
  Radio, 
  Flame, 
  ExternalLink,
  ShieldAlert,
  Layers,
  Sparkles
} from 'lucide-react';
import { NeoObject, ThemeMode } from '../types';
import { calculateInstantaneousDistance } from '../utils/physics';

interface TrajectoryRadarProps {
  theme: ThemeMode;
  neos: NeoObject[];
  selectedNeo: NeoObject | null;
  onSelectNeo: (neo: NeoObject) => void;
  onOpenKineticLab?: (neo: NeoObject) => void;
}

type RadarFilter = 'all' | 'live' | 'phas' | 'sublunar';

export const TrajectoryRadar: React.FC<TrajectoryRadarProps> = ({
  theme,
  neos,
  selectedNeo,
  onSelectNeo,
  onOpenKineticLab
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1); // 1 = 12 LD max, 1.5 = closer zoom, 0.7 = wider
  const [hoveredNeo, setHoveredNeo] = useState<NeoObject | null>(null);
  const [filter, setFilter] = useState<RadarFilter>('all');
  
  // Real-time simulation clock state
  const [simTime, setSimTime] = useState<number>(Date.now());
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [timeMultiplier, setTimeMultiplier] = useState<number>(1); // 1 = real-time, 60 = 1 min/s, 3600 = 1 hr/s, 86400 = 1 day/s
  const [sweepAngle, setSweepAngle] = useState<number>(0);
  const [pingedNeos, setPingedNeos] = useState<Record<string, number>>({});

  // Center of the 600x400 radar
  const centerX = 300;
  const centerY = 200;
  const maxRadiusPx = 175 * zoomLevel;

  // Filter asteroids
  const filteredNeos = useMemo(() => {
    return neos.filter((n) => {
      if (filter === 'live') return n.is_live_feed;
      if (filter === 'phas') return n.is_potentially_hazardous_asteroid;
      if (filter === 'sublunar') {
        const ld = parseFloat(n.close_approach_data?.[0]?.miss_distance?.lunar || '999');
        return ld < 1.0;
      }
      return true;
    });
  }, [neos, filter]);

  // Simulation tick loop (runs at 20fps / 50ms)
  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 2.5) % 360);

      if (isPlaying) {
        setSimTime((prev) => prev + (50 * timeMultiplier));
      }
    }, 50);

    return () => clearInterval(interval);
  }, [isPlaying, timeMultiplier]);

  // Compute angles deterministically based on asteroid id & epoch to create stable polar orbits
  const asteroidAngles = useMemo(() => {
    const angles: Record<string, number> = {};
    neos.forEach((neo, idx) => {
      const epoch = neo.close_approach_data?.[0]?.epoch_date_close_approach || 0;
      // Derive an astronomical azimuth angle in degrees (0 - 360)
      const seed = Math.abs(epoch % 360000) / 1000;
      const angle = (idx * (360 / Math.max(1, neos.length)) + (seed % 90)) % 360;
      angles[neo.id] = angle;
    });
    return angles;
  }, [neos]);

  // Detect radar sweep intersections to trigger active ping ripples
  useEffect(() => {
    filteredNeos.forEach((neo) => {
      const baseAngle = asteroidAngles[neo.id] || 0;
      const diff = Math.abs(sweepAngle - baseAngle);
      if (diff < 4 || diff > 356) {
        setPingedNeos((prev) => ({
          ...prev,
          [neo.id]: Date.now()
        }));
      }
    });
  }, [sweepAngle, filteredNeos, asteroidAngles]);

  // Coordinates calculation using real instantaneous distance
  const getObjectTelemetry = (neo: NeoObject) => {
    const ca = neo.close_approach_data?.[0];
    const missDistanceKm = ca?.miss_distance?.kilometers ? parseFloat(ca.miss_distance.kilometers) : 1922000;
    const velocityKmS = ca?.relative_velocity?.kilometers_per_second ? parseFloat(ca.relative_velocity.kilometers_per_second) : 20;
    const epochMs = ca?.epoch_date_close_approach || Date.now();

    const telemetry = calculateInstantaneousDistance(missDistanceKm, velocityKmS, epochMs, simTime);
    const angleDeg = asteroidAngles[neo.id] || 0;
    const angleRad = (angleDeg * Math.PI) / 180;

    // Scale display distance in LD
    const clampedLd = Math.min(14, Math.max(0.08, telemetry.distanceLunar));
    const r = (clampedLd / 12) * maxRadiusPx;

    const x = centerX + r * Math.cos(angleRad);
    const y = centerY + r * Math.sin(angleRad);

    // Calculate tangent vector for trajectory line display
    const tangentAngleRad = angleRad + (Math.PI / 2);
    const trajLengthPx = 40 * zoomLevel;
    const trajX1 = x - trajLengthPx * Math.cos(tangentAngleRad);
    const trajY1 = y - trajLengthPx * Math.sin(tangentAngleRad);
    const trajX2 = x + trajLengthPx * Math.cos(tangentAngleRad);
    const trajY2 = y + trajLengthPx * Math.sin(tangentAngleRad);

    return {
      ...telemetry,
      x,
      y,
      trajX1,
      trajY1,
      trajX2,
      trajY2,
      angleDeg
    };
  };

  const activeInspectorTarget = hoveredNeo || selectedNeo || filteredNeos[0] || null;
  const inspectorTelemetry = activeInspectorTarget ? getObjectTelemetry(activeInspectorTarget) : null;

  return (
    <div className="glass-card p-4 sm:p-5 flex flex-col justify-between overflow-hidden relative border border-white/10 rounded-3xl gap-4">
      {/* Radar Header & Simulation Control Deck */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 z-10">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-[#d9b43a]/15 text-[#d9b43a] border border-[#d9b43a]/30">
            <Compass size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-headline font-bold text-base tracking-tight text-current">
                Live Orbital Trajectory &amp; Radar Visualizer
              </h3>
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-telemetry font-bold bg-[#d9b43a]/20 text-[#d9b43a] border border-[#d9b43a]/30">
                <Radio size={10} className="animate-pulse" />
                REAL-TIME FLYBY
              </span>
            </div>
            <p className="font-headline text-[11px] font-semibold opacity-60">
              Live geocentric polar projection &bull; Instantaneous $r(t)$ distance &amp; Doppler telemetry
            </p>
          </div>
        </div>

        {/* Real-time Clock & Simulation Time Controls */}
        <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto">
          {/* Simulation Time Display */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 font-telemetry text-xs">
            <Clock size={14} className="text-[#d9b43a]" />
            <span className="text-current font-bold">
              {new Date(simTime).toLocaleTimeString()}
            </span>
            <span className="opacity-60 text-[10px]">
              {new Date(simTime).toLocaleDateString()}
            </span>
          </div>

          {/* Play/Pause & Multipliers */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className={`p-1.5 rounded-lg transition-colors flex items-center gap-1 font-bold ${
                isPlaying ? 'bg-[#d9b43a]/20 text-[#d9b43a]' : 'hover:bg-white/10 text-white/70'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Resume Simulation'}
              aria-label="Play/Pause"
            >
              {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            </button>

            <button
              onClick={() => setTimeMultiplier(1)}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry font-bold transition-colors ${
                timeMultiplier === 1 ? 'bg-[#d9b43a] text-[#1d1f3a]' : 'hover:bg-white/10 opacity-70'
              }`}
              title="Real-Time (1x)"
            >
              1×
            </button>
            <button
              onClick={() => setTimeMultiplier(60)}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry font-bold transition-colors ${
                timeMultiplier === 60 ? 'bg-[#d9b43a] text-[#1d1f3a]' : 'hover:bg-white/10 opacity-70'
              }`}
              title="1 Minute per second"
            >
              60×
            </button>
            <button
              onClick={() => setTimeMultiplier(3600)}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry font-bold transition-colors ${
                timeMultiplier === 3600 ? 'bg-[#d9b43a] text-[#1d1f3a]' : 'hover:bg-white/10 opacity-70'
              }`}
              title="1 Hour per second"
            >
              3.6k×
            </button>
            <button
              onClick={() => setTimeMultiplier(86400)}
              className={`px-2 py-1 rounded-lg text-[10px] font-telemetry font-bold transition-colors ${
                timeMultiplier === 86400 ? 'bg-[#d9b43a] text-[#1d1f3a]' : 'hover:bg-white/10 opacity-70'
              }`}
              title="1 Day per second"
            >
              86k×
            </button>

            <button
              onClick={() => {
                setSimTime(Date.now());
                setTimeMultiplier(1);
                setIsPlaying(true);
              }}
              className="p-1.5 rounded-lg hover:bg-white/10 transition-colors opacity-70 hover:opacity-100"
              title="Reset to Current Real Time"
              aria-label="Reset Time"
            >
              <RotateCcw size={13} />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-0.5 text-xs">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
            <button
              onClick={() => setZoomLevel(1)}
              className="p-1.5 rounded hover:bg-white/10 transition-colors"
              title="Reset Zoom"
              aria-label="Reset Zoom"
            >
              <RotateCcw size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Target Filter Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-headline uppercase font-bold opacity-60">
          Radar Display Filter:
        </span>
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 rounded-xl text-xs font-headline font-semibold transition-all ${
            filter === 'all'
              ? 'bg-[#d9b43a] text-[#1d1f3a] shadow-sm'
              : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
          }`}
        >
          All Objects ({neos.length})
        </button>
        <button
          onClick={() => setFilter('live')}
          className={`px-3 py-1 rounded-xl text-xs font-headline font-semibold flex items-center gap-1.5 transition-all ${
            filter === 'live'
              ? 'bg-[#d9b43a] text-[#1d1f3a] shadow-sm'
              : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
          Live NASA Feed Only ({neos.filter((n) => n.is_live_feed).length})
        </button>
        <button
          onClick={() => setFilter('phas')}
          className={`px-3 py-1 rounded-xl text-xs font-headline font-semibold flex items-center gap-1.5 transition-all ${
            filter === 'phas'
              ? 'bg-[#f47b7b] text-[#1d1f3a] shadow-sm'
              : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
          }`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-[#f47b7b] animate-pulse"></span>
          Critical PHAs ({neos.filter((n) => n.is_potentially_hazardous_asteroid).length})
        </button>
        <button
          onClick={() => setFilter('sublunar')}
          className={`px-3 py-1 rounded-xl text-xs font-headline font-semibold transition-all ${
            filter === 'sublunar'
              ? 'bg-[#f47b7b] text-[#1d1f3a] shadow-sm'
              : 'bg-white/5 hover:bg-white/10 opacity-70 border border-white/10'
          }`}
        >
          Sub-Lunar &lt; 1 LD
        </button>
      </div>

      {/* Main SVG Polar Radar Stage */}
      <div 
        className="relative w-full h-[380px] sm:h-[420px] flex items-center justify-center select-none overflow-hidden rounded-2xl border border-white/10"
        style={{
          backgroundColor: theme === 'deep-space' ? '#1d1f3a' : '#EDF0F7'
        }}
      >
        <svg 
          viewBox="0 0 600 400" 
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          id="radarCanvasSvg"
        >
          <defs>
            <radialGradient id="radarSpaceGradient" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={theme === 'deep-space' ? '#4c4f7b' : '#C8CCDE'} stopOpacity={theme === 'deep-space' ? 0.65 : 0.35} />
              <stop offset="65%" stopColor={theme === 'deep-space' ? '#1d1f3a' : '#edf0f7'} stopOpacity={0.9} />
              <stop offset="100%" stopColor={theme === 'deep-space' ? '#141629' : '#e2e8f0'} stopOpacity={1} />
            </radialGradient>

            <radialGradient id="earthAtmosphereGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#d9b43a" stopOpacity="1" />
              <stop offset="60%" stopColor="#4c4f7b" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#1d1f3a" stopOpacity="0" />
            </radialGradient>

            <filter id="radarRedGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Background rect */}
          <rect width="600" height="400" fill="url(#radarSpaceGradient)" />

          {/* Polar Azimuth Spokes (0°, 45°, 90°, 135°, 180°, 225°, 270°, 315°) */}
          {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
            const rad = (deg * Math.PI) / 180;
            const x2 = centerX + (maxRadiusPx * 1.05) * Math.cos(rad);
            const y2 = centerY + (maxRadiusPx * 1.05) * Math.sin(rad);
            return (
              <line
                key={deg}
                x1={centerX}
                y1={centerY}
                x2={x2}
                y2={y2}
                stroke="#7c809c"
                strokeOpacity="0.25"
                strokeWidth="0.8"
                strokeDasharray="3 4"
              />
            );
          })}

          {/* Concentric Distance Rings */}
          {/* 1 LD Ring (384,400 km) */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={(1 / 12) * maxRadiusPx} 
            fill="none" 
            stroke="#d9b43a" 
            strokeWidth="1.2" 
            strokeDasharray="2 3" 
            strokeOpacity="0.6" 
          />
          <text 
            x={centerX + (1 / 12) * maxRadiusPx + 4} 
            y={centerY - 4} 
            fill="#d9b43a" 
            fontSize="9" 
            fontFamily="JetBrains Mono" 
            fontWeight="bold" 
            opacity="0.9"
          >
            1 LD (384k km)
          </text>

          {/* 5 LD Ring */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={(5 / 12) * maxRadiusPx} 
            fill="none" 
            stroke="#7c809c" 
            strokeWidth="1" 
            strokeDasharray="4 4" 
            strokeOpacity="0.45" 
          />
          <text 
            x={centerX + (5 / 12) * maxRadiusPx + 4} 
            y={centerY - 4} 
            fill="#7c809c" 
            fontSize="9" 
            fontFamily="JetBrains Mono" 
            opacity="0.8"
          >
            5 LD
          </text>

          {/* 10 LD Ring */}
          <circle 
            cx={centerX} 
            cy={centerY} 
            r={(10 / 12) * maxRadiusPx} 
            fill="none" 
            stroke="#4c4f7b" 
            strokeWidth="1" 
            strokeDasharray="4 4" 
            strokeOpacity="0.4" 
          />
          <text 
            x={centerX + (10 / 12) * maxRadiusPx + 4} 
            y={centerY - 4} 
            fill={theme === 'deep-space' ? '#7c809c' : '#4c4f7b'} 
            fontSize="9" 
            fontFamily="JetBrains Mono" 
            opacity="0.75"
          >
            10 LD
          </text>

          {/* Dynamic Rotating Radar Beam based on sweepAngle state */}
          <g style={{ transformOrigin: `${centerX}px ${centerY}px`, transform: `rotate(${sweepAngle}deg)` }}>
            <line 
              x1={centerX} 
              y1={centerY} 
              x2={centerX + maxRadiusPx * 1.1} 
              y2={centerY} 
              stroke="#d9b43a" 
              strokeWidth="2" 
              strokeOpacity="0.75" 
            />
            {/* Beam spread wedge */}
            <path 
              d={`M ${centerX} ${centerY} L ${centerX + maxRadiusPx * 1.1} ${centerY} A ${maxRadiusPx * 1.1} ${maxRadiusPx * 1.1} 0 0 0 ${centerX + maxRadiusPx * 1.1 * Math.cos(-25 * Math.PI / 180)} ${centerY + maxRadiusPx * 1.1 * Math.sin(-25 * Math.PI / 180)} Z`} 
              fill="rgba(217, 180, 58, 0.12)" 
            />
          </g>

          {/* Earth (Terra) at Center */}
          <circle cx={centerX} cy={centerY} r="16" fill="url(#earthAtmosphereGlow)" />
          <circle cx={centerX} cy={centerY} r="7" fill={theme === 'deep-space' ? '#d9b43a' : '#4c4f7b'} />
          <text 
            x={centerX} 
            y={centerY + 26} 
            textAnchor="middle" 
            fill={theme === 'deep-space' ? '#f8fafc' : '#1d1f3a'} 
            fontSize="10" 
            fontFamily="Plus Jakarta Sans" 
            fontWeight="bold"
            letterSpacing="0.05em"
          >
            TERRA
          </text>

          {/* Near-Earth Object Markers plotted with real instantaneous distance */}
          {filteredNeos.map((neo) => {
            const telem = getObjectTelemetry(neo);
            const isHazardous = neo.is_potentially_hazardous_asteroid;
            const isSelected = selectedNeo?.id === neo.id;
            const isHovered = hoveredNeo?.id === neo.id;
            const isRecentlyPinged = Date.now() - (pingedNeos[neo.id] || 0) < 800;

            const color = isHazardous ? '#f47b7b' : telem.distanceLunar < 1 ? '#f47b7b' : neo.is_live_feed ? '#34d399' : '#d9b43a';

            return (
              <g 
                key={neo.id}
                className="cursor-pointer transition-transform duration-75"
                onClick={() => onSelectNeo(neo)}
                onMouseEnter={() => setHoveredNeo(neo)}
                onMouseLeave={() => setHoveredNeo(null)}
                id={`radar-point-${neo.id}`}
              >
                {/* Orbital Trajectory Flyby Vector Line */}
                <line 
                  x1={telem.trajX1} 
                  y1={telem.trajY1} 
                  x2={telem.trajX2} 
                  y2={telem.trajY2} 
                  stroke={color} 
                  strokeWidth={isSelected ? '1.5' : '1'} 
                  strokeDasharray="2 3" 
                  strokeOpacity={isSelected ? '0.85' : '0.4'} 
                />

                {/* Radar Sweep Ping Echo Pulse */}
                {isRecentlyPinged && (
                  <circle 
                    cx={telem.x} 
                    cy={telem.y} 
                    r={18} 
                    fill="none" 
                    stroke={color} 
                    strokeWidth="1.5" 
                    opacity="0.8"
                  >
                    <animate attributeName="r" values="6;22;28" dur="0.8s" repeatCount="1" />
                    <animate attributeName="opacity" values="0.9;0.4;0" dur="0.8s" repeatCount="1" />
                  </circle>
                )}

                {/* Hazard Pulse Halo */}
                {isHazardous && (
                  <circle 
                    cx={telem.x} 
                    cy={telem.y} 
                    r={isSelected || isHovered ? 14 : 9} 
                    fill="#f47b7b" 
                    fillOpacity="0.25"
                  >
                    <animate attributeName="r" values="8;16;8" dur="2s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2s" repeatCount="indefinite" />
                  </circle>
                )}

                {/* Selected Ring */}
                {isSelected && (
                  <circle 
                    cx={telem.x} 
                    cy={telem.y} 
                    r="13" 
                    fill="none" 
                    stroke="#d9b43a" 
                    strokeWidth="1.5" 
                    strokeDasharray="3 2"
                  />
                )}

                {/* Trajectory vector ray towards Earth */}
                {(isSelected || isHovered) && (
                  <line 
                    x1={telem.x} 
                    y1={telem.y} 
                    x2={centerX} 
                    y2={centerY} 
                    stroke={color} 
                    strokeWidth="1.2" 
                    strokeDasharray="3 3" 
                    strokeOpacity="0.75" 
                  />
                )}

                {/* Core Dot (sized by diameter) */}
                <circle 
                  cx={telem.x} 
                  cy={telem.y} 
                  r={isSelected ? 6 : isHazardous ? 5 : 4} 
                  fill={color} 
                  filter={isHazardous ? 'url(#radarRedGlow)' : undefined}
                />

                {/* Live Distance Label - only displayed on hover or selection to avoid radar crowding */}
                {(isSelected || isHovered) && (
                  <text 
                    x={telem.x + 8} 
                    y={telem.y - 4} 
                    fill={isHazardous ? '#f47b7b' : (theme === 'deep-space' ? '#d9b43a' : '#4c4f7b')} 
                    stroke={theme === 'deep-space' ? '#141629' : '#ffffff'}
                    strokeWidth="3"
                    strokeLinejoin="round"
                    paintOrder="stroke fill"
                    fontSize="11" 
                    fontFamily="JetBrains Mono" 
                    fontWeight="bold"
                    className="pointer-events-none drop-shadow-sm select-none"
                  >
                    {neo.name.replace(/[()]/g, '').split(' ')[0]} [{telem.distanceLunar.toFixed(2)} LD]
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend Overlay at bottom-left */}
        <div className="absolute bottom-3 left-3 flex flex-wrap items-center gap-2 bg-[#1d1f3a]/85 backdrop-blur-md px-3 py-1.5 rounded-xl text-xs font-telemetry border border-white/10">
          <span className="flex items-center gap-1.5 text-[#f47b7b] font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#f47b7b] animate-pulse"></span>
            PHA Hazard
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400 ml-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Live NASA Feed
          </span>
          <span className="flex items-center gap-1.5 text-[#d9b43a] ml-2 font-semibold">
            <span className="w-2 h-2 rounded-full bg-[#d9b43a]"></span>
            Reference Target
          </span>
        </div>
      </div>

      {/* Target Inspector & Telemetry Deck - Clean 2-Tier Stack Eliminating Horizontal Overlap */}
      {activeInspectorTarget && inspectorTelemetry && (
        <div 
          className="p-4 sm:p-5 rounded-2xl border flex flex-col gap-4 backdrop-blur-md shadow-lg w-full"
          style={{
            backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderColor: activeInspectorTarget.is_potentially_hazardous_asteroid ? 'rgba(244, 123, 123, 0.35)' : 'rgba(217, 180, 58, 0.25)'
          }}
        >
          {/* Top Row: Target Identification & Kinetic Lab Trigger */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div className={`p-2.5 rounded-xl border shrink-0 ${
                activeInspectorTarget.is_potentially_hazardous_asteroid 
                  ? 'bg-[#f47b7b]/20 text-[#f47b7b] border-[#f47b7b]/30' 
                  : 'bg-[#d9b43a]/20 text-[#d9b43a] border-[#d9b43a]/30'
              }`}>
                <Radio size={22} className="animate-pulse" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="font-headline font-bold text-base sm:text-lg text-current truncate">
                    {activeInspectorTarget.name}
                  </h4>
                  {activeInspectorTarget.is_live_feed && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-telemetry bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shrink-0">
                      LIVE NASA FEED
                    </span>
                  )}
                  {activeInspectorTarget.is_potentially_hazardous_asteroid && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-telemetry bg-[#f47b7b]/20 text-[#f47b7b] border border-[#f47b7b]/30 shrink-0">
                      POTENTIALLY HAZARDOUS
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2.5 text-xs opacity-75 mt-1 font-telemetry flex-wrap">
                  <span>Ref ID: #{activeInspectorTarget.id}</span>
                  <span className="opacity-40">&bull;</span>
                  <span>Class: {activeInspectorTarget.orbital_class || 'NEO'}</span>
                  <span className="opacity-40">&bull;</span>
                  <span>Abs Mag: {activeInspectorTarget.absolute_magnitude_h} H</span>
                </div>
              </div>
            </div>

            {/* Action Button: Load into Kinetic Lab */}
            {onOpenKineticLab && (
              <button
                onClick={() => onOpenKineticLab(activeInspectorTarget)}
                className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-headline font-bold bg-[#f47b7b]/20 hover:bg-[#f47b7b]/30 text-[#f47b7b] border border-[#f47b7b]/40 transition-all active:scale-95 shrink-0 self-start sm:self-auto"
              >
                <Flame size={15} />
                <span>Simulate Kinetic Impact</span>
              </button>
            )}
          </div>

          {/* Real-time Telemetry Values: Dedicated Full-Width 4-Column Grid with No Overlap */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 font-telemetry text-xs w-full pt-1 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">
                Instantaneous Range
              </span>
              <div className="mt-1">
                <span className="text-sm sm:text-base font-extrabold text-[#d9b43a] block truncate">
                  {inspectorTelemetry.distanceLunar.toFixed(3)} LD
                </span>
                <span className="text-[10px] opacity-60 block truncate mt-0.5">
                  {inspectorTelemetry.distanceKm.toLocaleString()} km
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">
                Range Rate ($dr/dt$)
              </span>
              <div className="mt-1">
                <span className={`text-sm sm:text-base font-extrabold block truncate ${inspectorTelemetry.isApproaching ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {inspectorTelemetry.rangeRateKmS > 0 ? `+${inspectorTelemetry.rangeRateKmS}` : inspectorTelemetry.rangeRateKmS} km/s
                </span>
                <span className="text-[10px] opacity-60 block truncate mt-0.5">
                  {inspectorTelemetry.isApproaching ? 'Closing (Blue-Shift)' : 'Receding (Red-Shift)'}
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">
                Doppler Shift
              </span>
              <div className="mt-1">
                <span className="text-sm sm:text-base font-extrabold text-current block truncate">
                  {inspectorTelemetry.dopplerShiftHz > 0 ? `+${inspectorTelemetry.dopplerShiftHz.toLocaleString()}` : inspectorTelemetry.dopplerShiftHz.toLocaleString()} Hz
                </span>
                <span className="text-[10px] opacity-60 block truncate mt-0.5">
                  X-Band (8.56 GHz)
                </span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.04] border border-white/10 flex flex-col justify-between min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-60 truncate">
                Radar Echo Delay
              </span>
              <div className="mt-1">
                <span className="text-sm sm:text-base font-extrabold text-current block truncate">
                  {inspectorTelemetry.radarRoundTripSeconds.toFixed(1)}s
                </span>
                <span className="text-[10px] opacity-60 block truncate mt-0.5">
                  Round-trip (2d/c)
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
