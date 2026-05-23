import Link from 'next/link';
import { getSettings } from '@/services/settingsDb';
import SettingsForm from '@/components/SettingsForm';
import { ArrowLeft, Sliders } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SettingsPage() {
  const settings = getSettings();

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto px-4 py-8 md:py-12 z-10 relative">
      
      {/* Header Section */}
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-10 pb-6 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-bold uppercase tracking-widest">Configuration Console</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-100 tracking-tight mt-1">
            Scanner Settings
          </h1>
          <p className="text-sm text-gray-400 font-semibold mt-1">
            Update airport targets, schedules, currencies, and scanning engines.
          </p>
        </div>

        <Link 
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-slate-900/60 hover:bg-slate-900 border border-white/5 hover:border-emerald-500/30 text-gray-300 hover:text-emerald-400 px-5 py-3 rounded-2xl shadow-xl transition-all font-bold text-xs uppercase tracking-wider self-stretch sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Board
        </Link>
      </header>

      {/* Zod-validated Settings Form component */}
      <SettingsForm initialSettings={settings} />

    </div>
  );
}
