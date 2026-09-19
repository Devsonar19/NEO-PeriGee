import React, { useState } from 'react';
import { LineChart, Shield, ShieldAlert, Zap } from 'lucide-react';
import { NeoObject, ThemeMode } from '../types';

interface PerigeeScatterPlotProps {
  theme: ThemeMode;
  neos: NeoObject[];
  selectedNeo: NeoObject | null;
  onSelectNeo: (neo: NeoObject) => void;
}

export const PerigeeScatterPlot: React.FC<PerigeeScatterPlotProps> = ({
  theme,
  neos,
  selectedNeo,
  onSelectNeo
}) => {
  const [hoveredNeo, setHoveredNeo] = useState<NeoObject | null>(null);

  // Maximum scales for the chart
  const maxDistanceLD = 15; // X-axis (0 to 15 LD)
  const maxVelocityKmS = 45; // Y-axis (0 to 45 km/s)

  // Chart dimensions inside SVG
  const width = 360;
  const height = 140;
  const padLeft = 32;
  const padBottom = 24;
  const padTop = 15;
  const padRight = 15;

  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Perigee Scatter Dynamics Card */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#d9b43a]/10 text-[#d9b43a] border border-[#d9b43a]/20">
              <LineChart size={16} />
            </div>
            <h4 className="font-headline font-bold text-sm tracking-tight text-current">
              Perigee Scatter Dynamics
            </h4>
          </div>
          <span className="font-headline text-[10px] font-bold uppercase tracking-wider opacity-50">
            Velocity vs. Distance
          </span>
        </div>

        {/* Scatter SVG Plot */}
        <div 
          className="w-full rounded-2xl p-3 relative flex flex-col justify-between border border-white/10 backdrop-blur-md"
          style={{
            backgroundColor: theme === 'deep-space' ? '#1d1f3a' : 'rgba(248, 250, 252, 0.8)'
          }}
        >
          <div className="flex justify-between font-telemetry text-[11px] opacity-60">
            <span>45 km/s</span>
            <span>Orbital Sample Distribution</span>
          </div>

          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-32" preserveAspectRatio="none">
            {/* Grid lines */}
            <line 
              x1={padLeft} 
              y1={padTop + chartHeight} 
              x2={padLeft + chartWidth} 
              y2={padTop + chartHeight} 
              stroke={theme === 'deep-space' ? '#4c4f7b' : '#cbd5e1'} 
              strokeWidth="1" 
            />
            <line 
              x1={padLeft} 
              y1={padTop} 
              x2={padLeft} 
              y2={padTop + chartHeight} 
              stroke={theme === 'deep-space' ? '#4c4f7b' : '#cbd5e1'} 
              strokeWidth="1" 
            />

            {/* Horizontal Grid lines */}
            <line 
              x1={padLeft} 
              y1={padTop + chartHeight * 0.33} 
              x2={padLeft + chartWidth} 
              y2={padTop + chartHeight * 0.33} 
              stroke={theme === 'deep-space' ? 'rgba(76, 79, 123, 0.4)' : '#e2e8f0'} 
              strokeDasharray="3 3" 
            />
            <line 
              x1={padLeft} 
              y1={padTop + chartHeight * 0.66} 
              x2={padLeft + chartWidth} 
              y2={padTop + chartHeight * 0.66} 
              stroke={theme === 'deep-space' ? 'rgba(76, 79, 123, 0.4)' : '#e2e8f0'} 
              strokeDasharray="3 3" 
            />

            {/* 1 LD Critical Warning vertical zone */}
            <rect 
              x={padLeft} 
              y={padTop} 
              width={(1 / maxDistanceLD) * chartWidth} 
              height={chartHeight} 
              fill="rgba(244, 123, 123, 0.12)" 
            />
            <line 
              x1={padLeft + (1 / maxDistanceLD) * chartWidth} 
              y1={padTop} 
              x2={padLeft + (1 / maxDistanceLD) * chartWidth} 
              y2={padTop + chartHeight} 
              stroke="#f47b7b" 
              strokeWidth="1" 
              strokeDasharray="2 2" 
              strokeOpacity="0.7" 
            />

            {/* Plot Points */}
            {neos.map((neo) => {
              const lunarDist = parseFloat(neo.close_approach_data?.[0]?.miss_distance?.lunar || '5');
              const velocity = parseFloat(neo.close_approach_data?.[0]?.relative_velocity?.kilometers_per_second || '20');

              const x = padLeft + (Math.min(maxDistanceLD, lunarDist) / maxDistanceLD) * chartWidth;
              const y = padTop + chartHeight - (Math.min(maxVelocityKmS, velocity) / maxVelocityKmS) * chartHeight;

              const isHazardous = neo.is_potentially_hazardous_asteroid;
              const isSelected = selectedNeo?.id === neo.id;
              const isHovered = hoveredNeo?.id === neo.id;

              return (
                <g 
                  key={neo.id} 
                  className="cursor-pointer"
                  onClick={() => onSelectNeo(neo)}
                  onMouseEnter={() => setHoveredNeo(neo)}
                  onMouseLeave={() => setHoveredNeo(null)}
                >
                  <circle
                    cx={x}
                    cy={y}
                    r={isSelected ? 6 : isHovered ? 5 : isHazardous ? 4 : 3}
                    fill={isHazardous ? '#f47b7b' : isSelected ? '#d9b43a' : '#d9b43a'}
                    fillOpacity={isSelected || isHovered ? 1 : 0.85}
                    stroke={isSelected ? '#ffffff' : isHazardous ? '#f47b7b' : '#d9b43a'}
                    strokeWidth={isSelected ? 2 : 1}
                  />
                  {/* Tooltip text when hovered */}
                  {(isHovered || isSelected) && (
                    <text
                      x={Math.min(width - 70, Math.max(padLeft, x - 25))}
                      y={Math.max(16, y - 8)}
                      fill={isHazardous ? '#f47b7b' : '#d9b43a'}
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {neo.name.replace(/[()]/g, '')} ({lunarDist.toFixed(1)} LD)
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* X Axis distance indicators */}
          <div className="flex justify-between font-telemetry text-[10px] opacity-60 pt-1 border-t border-white/[0.06]">
            <span>0 LD (Earth)</span>
            <span>1 LD</span>
            <span>5 LD</span>
            <span>10 LD</span>
            <span>15 LD</span>
          </div>
        </div>
      </div>

      {/* Sentry Planetary Threat Status Card */}
      <div className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 flex flex-col justify-between flex-1 gap-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#f47b7b]/15 text-[#f47b7b] border border-[#f47b7b]/25">
              <ShieldAlert size={16} />
            </div>
            <h4 className="font-headline font-bold text-sm tracking-tight text-current">
              Sentry Planetary Threat Status
            </h4>
          </div>
          <span className="px-2.5 py-0.5 rounded-full font-telemetry text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            DEFCON 4
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 my-0.5">
          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col">
            <span className="font-headline text-[10px] font-bold uppercase tracking-wider opacity-50">
              Cumulative Palermo
            </span>
            <span className="font-headline text-lg sm:text-xl font-bold text-[#d9b43a] mt-0.5">
              -2.52
            </span>
            <span className="text-[11px] opacity-60 mt-0.5">Below Background Norm</span>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex flex-col">
            <span className="font-headline text-[10px] font-bold uppercase tracking-wider opacity-50">
              Torino Max Scale
            </span>
            <span className="font-headline text-lg sm:text-xl font-bold text-[#f47b7b] mt-0.5">
              LEVEL 1
            </span>
            <span className="text-[11px] opacity-60 mt-0.5">Special Scientific Attention</span>
          </div>
        </div>

        {/* Orbital Deflection Readiness Status */}
        <div className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-start gap-3">
          <div className="p-2 rounded-xl bg-[#d9b43a]/10 text-[#d9b43a] border border-[#d9b43a]/20 shrink-0 mt-0.5">
            <Shield size={16} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-headline text-xs font-bold text-current">
                Orbital Deflection Readiness
              </span>
              <Zap size={12} className="text-[#d9b43a]" />
            </div>
            <span className="text-[11px] opacity-70 leading-relaxed mt-0.5">
              Kinetic Impactor intercept payload in hot standby at Vandenberg Space Force Base SLC-4E.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
