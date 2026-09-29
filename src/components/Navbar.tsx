import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Map,
  LayoutDashboard,
  FileText,
  History,
  Bell,
  Sparkles,
  Info,
  UserCheck,
  Building2,
  Clock,
  Menu,
  X,
  Radio,
} from 'lucide-react';

export type AppView =
  | 'landing'
  | 'dashboard'
  | 'timeline'
  | 'map'
  | 'location-analysis'
  | 'historical'
  | 'alerts'
  | 'ai-assistant'
  | 'about'
  | 'citizen';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  activeAlertCount: number;
  criticalCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  activeAlertCount,
  criticalCount,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState<string>('');

  // Update live IST clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-IN', {
          timeZone: 'Asia/Kolkata',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' IST'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems: { view: AppView; label: string; icon: React.ReactNode; badge?: number }[] = [
    { view: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { view: 'timeline', label: 'Timeline', icon: <Clock className="w-4 h-4 text-cyan-400" /> },
    { view: 'map', label: 'GIS Risk Map', icon: <Map className="w-4 h-4" /> },
    { view: 'location-analysis', label: 'Location Risk', icon: <FileText className="w-4 h-4" /> },
    {
      view: 'alerts',
      label: 'Early Warnings',
      icon: <Bell className="w-4 h-4" />,
      badge: activeAlertCount,
    },
    { view: 'historical', label: 'Historical Data', icon: <History className="w-4 h-4" /> },
    { view: 'ai-assistant', label: 'AI Intelligence', icon: <Sparkles className="w-4 h-4 text-cyan-400" /> },
    { view: 'about', label: 'Methodology', icon: <Info className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur-md">
      <div className="max-w-[1600px] w-full mx-auto px-3 sm:px-5 lg:px-6 flex items-center justify-between h-16">
        {/* Brand Logo */}
        <div
          onClick={() => onNavigate('landing')}
          className="flex items-center gap-2.5 xl:gap-3 cursor-pointer group select-none shrink-0"
        >
          <div className="relative w-8 h-8 xl:w-9 xl:h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-700 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:scale-105 transition-transform shrink-0">
            <ShieldAlert className="w-4 h-4 xl:w-5 xl:h-5 text-white" />
            {criticalCount > 0 && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 border-2 border-slate-950 animate-ping"></span>
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base xl:text-lg font-black tracking-wider text-white font-display whitespace-nowrap">
                LANDGUARD<span className="text-cyan-400">.AI</span>
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-cyan-950/80 text-cyan-300 border border-cyan-800 shrink-0">
                NER-EWS
              </span>
            </div>
            <div className="text-[9px] xl:text-[10px] text-slate-400 font-mono tracking-tight -mt-0.5 hidden xl:block whitespace-nowrap">
              LANDSLIDE RISK MONITORING & EARLY WARNING
            </div>
          </div>
        </div>

        {/* Desktop Nav Items */}
        <nav className="hidden lg:flex items-center gap-0.5 xl:gap-1 2xl:gap-1.5">
          {navItems.map((item) => {
            const isActive = currentView === item.view;
            return (
              <button
                key={item.view}
                onClick={() => onNavigate(item.view)}
                className={`relative flex items-center gap-1 xl:gap-1.5 px-2 xl:px-2.5 2xl:px-3 py-1.5 rounded-lg text-[11px] xl:text-xs font-medium whitespace-nowrap transition cursor-pointer shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-cyan-400 font-semibold shadow-sm border border-slate-700'
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="whitespace-nowrap">{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-rose-500 text-white shrink-0">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Action Tools: Citizen View Toggle + Clock */}
        <div className="flex items-center gap-2 xl:gap-2.5 shrink-0">
          {/* Live IST clock */}
          <div className="hidden sm:flex items-center gap-1.5 px-2 xl:px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 text-[10px] xl:text-[11px] font-mono whitespace-nowrap shrink-0">
            <Radio className="w-3 h-3 text-emerald-400 animate-pulse shrink-0" />
            <span className="whitespace-nowrap">{currentTime || '05:34:16 IST'}</span>
          </div>

          {/* Citizen Safety View Switch */}
          <button
            onClick={() => onNavigate(currentView === 'citizen' ? 'dashboard' : 'citizen')}
            className={`flex items-center gap-1.5 px-2.5 xl:px-3 py-1.5 rounded-lg text-[11px] xl:text-xs font-semibold whitespace-nowrap transition cursor-pointer border shrink-0 ${
              currentView === 'citizen'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/20'
                : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border-slate-700'
            }`}
          >
            {currentView === 'citizen' ? (
              <>
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Authority Dashboard</span>
                <span className="sm:hidden">Command</span>
              </>
            ) : (
              <>
                <UserCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">Citizen Safety View</span>
                <span className="sm:hidden">Citizen</span>
              </>
            )}
          </button>

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white shrink-0"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden px-4 pt-2 pb-4 border-t border-slate-800 bg-slate-950 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => {
                onNavigate(item.view);
                setMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm ${
                currentView === item.view
                  ? 'bg-slate-800 text-cyan-400 font-semibold'
                  : 'text-slate-300 hover:bg-slate-900'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.icon}
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-xs font-mono font-bold bg-rose-500 text-white">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-800">
            <button
              onClick={() => {
                onNavigate('citizen');
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-cyan-950/60 text-cyan-300 font-medium border border-cyan-800"
            >
              <UserCheck className="w-4 h-4" />
              <span>Switch to Citizen Safety View</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
