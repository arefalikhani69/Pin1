import React from 'react';
import { Home, Car, Cpu, Zap, Search, ArrowLeftRight, Star, SlidersHorizontal } from 'lucide-react';

export type MainNavTab = 'home' | 'vehicles' | 'connectors' | 'fuseboxes' | 'compare' | 'favorites' | 'search' | 'notifications' | 'settings';

interface BottomNavProps {
  activeTab: MainNavTab;
  onChangeTab: (tab: MainNavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs: { id: MainNavTab; label: string; icon: React.ElementType }[] = [
    { id: 'home', label: 'خانه', icon: Home },
    { id: 'vehicles', label: 'خودروها', icon: Car },
    { id: 'connectors', label: 'سوکت ECU', icon: Cpu },
    { id: 'fuseboxes', label: 'جعبه‌فیوز', icon: Zap },
    { id: 'search', label: 'جستجو', icon: Search },
    { id: 'favorites', label: 'نشان‌ها', icon: Star },
    { id: 'settings', label: 'تنظیمات', icon: SlidersHorizontal }
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-md border-t border-zinc-800/80 pb-safe shadow-2xl"
      aria-label="منوی اصلی اپلیکیشن"
    >
      <div className="max-w-lg mx-auto grid grid-cols-7 items-center h-14">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full w-full transition-colors active:scale-95 ${
                isActive ? 'text-red-500' : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] mt-1 font-semibold tracking-tight ${isActive ? 'text-white' : ''}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
