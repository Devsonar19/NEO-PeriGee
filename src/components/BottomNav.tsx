import React from 'react';
import { Radar, AlertTriangle, Orbit, Flame } from 'lucide-react';
import { NavigationTab, ThemeMode } from '../types';

interface BottomNavProps {
  theme: ThemeMode;
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  criticalCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  theme,
  activeTab,
  onSelectTab,
  criticalCount
}) => {
  const items = [
    { id: 'telemetry-dashboard' as NavigationTab, label: 'Telemetry', icon: Radar },
    { id: 'hazard-perigee-monitor' as NavigationTab, label: 'Hazards', icon: AlertTriangle, badge: criticalCount },
    { id: 'orbital-trajectory-visualizer' as NavigationTab, label: 'Radar', icon: Orbit },
    { id: 'impact-assessment' as NavigationTab, label: 'Kinetic', icon: Flame }
  ];

  return (
    <nav 
      className="md:hidden fixed bottom-0 left-0 w-full z-40 border-t backdrop-blur-2xl px-4 py-2 flex items-center justify-around"
      style={{
        backgroundColor: theme === 'deep-space' ? 'rgba(29, 31, 58, 0.96)' : 'rgba(245, 247, 252, 0.96)',
        borderColor: 'rgba(124, 128, 156, 0.2)',
        boxShadow: theme === 'deep-space' ? '0 -8px 32px rgba(10, 11, 24, 0.5)' : '0 -8px 32px rgba(29, 31, 58, 0.06)'
      }}
      id="mobile-bottom-navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onSelectTab(item.id)}
            id={`bottom-nav-${item.id}`}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition-all relative min-h-[44px] min-w-[56px] active:scale-95 ${
              isActive 
                ? theme === 'deep-space' 
                  ? 'text-[#d9b43a] font-bold bg-[#d9b43a]/15 border border-[#d9b43a]/30' 
                  : 'text-[#a88214] font-bold bg-[#d9b43a]/15 border border-[#d9b43a]/30'
                : 'opacity-60 hover:opacity-100 text-current border border-transparent'
            }`}
          >
            <div className="relative">
              <Icon size={18} />
              {item.badge && item.badge > 0 && (
                <span className="absolute -top-1 -right-2.5 px-1 min-w-[14px] h-3.5 rounded-full bg-[#f47b7b] text-white text-[8px] font-bold flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[11px] font-headline mt-1 tracking-tight">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
