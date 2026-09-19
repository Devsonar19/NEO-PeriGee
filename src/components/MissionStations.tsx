import React from 'react';
import { Globe, Network, ChevronRight } from 'lucide-react';
import { ThemeMode } from '../types';

interface MissionStationsProps {
  theme: ThemeMode;
}

export const MissionStations: React.FC<MissionStationsProps> = ({ theme }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
      {/* Station 1: Goldstone */}
      <div className="glass-card p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#d9b43a]/15 text-[#d9b43a] flex items-center justify-center shrink-0">
          <Globe size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-sm text-current">
            Goldstone DSN Station
          </span>
          <span className="text-xs opacity-75 mt-0.5 leading-relaxed">
            DSS-14 70-meter Cassegrain dish transmitting X-band planetary radar pulse trains.
          </span>
        </div>
      </div>

      {/* Station 2: IAU Minor Planet Center */}
      <div className="glass-card p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#d9b43a]/15 text-[#d9b43a] flex items-center justify-center shrink-0">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="M12 2v4m0 12v4M2 12h4m12 0h4"></path>
          </svg>
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-sm text-current">
            IAU Minor Planet Center
          </span>
          <span className="text-xs opacity-75 mt-0.5 leading-relaxed">
            MPEC circular auto-ingestion stream operational via Harvard-Smithsonian CfA relay.
          </span>
        </div>
      </div>

      {/* Station 3: Sentry-II Solver */}
      <div className="glass-card p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#d9b43a]/15 text-[#d9b43a] flex items-center justify-center shrink-0">
          <ChevronRight size={20} />
        </div>
        <div className="flex flex-col">
          <span className="font-headline font-bold text-sm text-current">
            Sentry-II Matrix Solver
          </span>
          <span className="text-xs opacity-75 mt-0.5 leading-relaxed">
            Monte Carlo gravitational perturbation calculations running with Yarkovsky effect modeling.
          </span>
        </div>
      </div>
    </div>
  );
};
