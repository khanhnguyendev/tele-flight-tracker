import Link from 'next/link';
import { getSettings } from '@/services/settingsDb';
import { getHistory } from '@/services/historyDb';
import { searchFlights } from '@/services/tracker';
import StatsGrid from '@/components/StatsGrid';
import TrendChart from '@/components/TrendChart';
import FlightList from '@/components/FlightList';
import CountdownWidget from '@/components/CountdownWidget';
import DashboardShell from '@/components/DashboardShell';
import { Settings, Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const settings = getSettings();
  const history = getHistory();
  
  // Perform active engine flight search
  const offers = await searchFlights(settings);
  const cheapestPrice = offers[0]?.price || 0;

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 z-10 relative">
      <DashboardShell>
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
              <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Active Scanning</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight mt-1">
              tele-flight-tracker
            </h1>
            <p className="text-sm text-gray-400 font-semibold mt-1">
              Round-trip Price Scans: <span className="text-indigo-400 font-bold">{settings.origin}</span> to <span className="text-indigo-400 font-bold">{settings.destination}</span>
            </p>
          </div>

          <div className="flex flex-row items-center gap-4 self-stretch md:self-auto justify-between md:justify-start">
            <CountdownWidget targetDateStr={settings.outboundDate} />
            <Link 
              href="/settings"
              className="inline-flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-400 w-12 h-12 md:w-auto md:px-5 md:py-3 rounded-2xl shadow-xl transition-all font-bold text-xs uppercase tracking-wider"
              title="Configurations Settings"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </Link>
          </div>
        </header>

        {/* Stats Grid component */}
        <StatsGrid 
          settings={settings}
          history={history}
          cheapestPrice={cheapestPrice}
        />

        {/* Analytics & Listings */}
        <div className="grid grid-cols-1 gap-8">
          {/* Recharts/Chart.js Analytics Line Chart */}
          <TrendChart history={history} />

          {/* Carrier accordion cards list */}
          <FlightList offers={offers} currency={settings.currency} />
        </div>

      </DashboardShell>
    </div>
  );
}
