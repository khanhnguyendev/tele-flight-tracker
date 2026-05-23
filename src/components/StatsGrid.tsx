'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Spinner } from '@heroui/react';
import { Plane, Calendar, Cpu, Bell, ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from 'lucide-react';
import { Settings } from '@/services/settingsDb';
import { HistoryPoint } from '@/services/historyDb';

interface StatsGridProps {
  settings: Settings;
  history: HistoryPoint[];
  cheapestPrice: number;
}

export default function StatsGrid({ settings, history, cheapestPrice }: StatsGridProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Compute price delta from the last two scans
  const computePriceDelta = () => {
    if (history.length < 2) return null;
    const latest = history[history.length - 1].cheapestPrice;
    const prev = history[history.length - 2].cheapestPrice;
    const delta = latest - prev;
    return delta;
  };

  const delta = computePriceDelta();

  const handleScanNow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scan');
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error scanning flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const formattedCheapest = cheapestPrice > 0 
    ? `${cheapestPrice.toLocaleString()} ${settings.currency}` 
    : 'No Data';

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* 1. Cheapest Price Card */}
      <Card className="glass-card">
        <CardContent className="p-5 flex flex-row items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Cheapest Price</p>
            <h3 className="text-2xl font-bold mt-1 text-emerald-400">{formattedCheapest}</h3>
            {delta !== null ? (
              <div className="flex items-center mt-2">
                {delta < 0 ? (
                  <span className="inline-flex items-center text-xs bg-emerald-500/10 text-emerald-400 px-2 py-1 rounded-full font-semibold">
                    <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" />
                    Drop {Math.abs(delta).toLocaleString()}
                  </span>
                ) : delta > 0 ? (
                  <span className="inline-flex items-center text-xs bg-rose-500/10 text-rose-400 px-2 py-1 rounded-full font-semibold">
                    <ArrowUpRight className="w-3.5 h-3.5 mr-0.5" />
                    Spike +{delta.toLocaleString()}
                  </span>
                ) : (
                  <span className="inline-flex items-center text-xs bg-slate-500/10 text-slate-400 px-2 py-1 rounded-full font-semibold">
                    <Minus className="w-3.5 h-3.5 mr-0.5" />
                    No Change
                  </span>
                )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 mt-2 font-medium">First check logging</p>
            )}
          </div>
          <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center text-emerald-400">
            <RefreshCw className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 2. Route & Dates Card */}
      <Card className="glass-card">
        <CardContent className="p-5 flex flex-row items-center justify-between">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Flight Route & Dates</p>
            <h3 className="text-lg font-bold mt-1 text-gray-100 flex items-center gap-1.5">
              {settings.origin} <Plane className="w-4 h-4 text-emerald-400 rotate-90" /> {settings.destination}
            </h3>
            <p className="text-xs text-gray-400 mt-2 font-semibold flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-emerald-400" />
              {settings.outboundDate} to {settings.returnDate}
            </p>
          </div>
          <div className="w-12 h-12 bg-indigo-500/10 rounded-xl flex items-center justify-center text-indigo-400">
            <Plane className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>

      {/* 4. Auto-Scan Schedule Card */}
      <Card className="glass-card">
        <CardContent className="p-5 flex flex-row items-center justify-between">
          <div className="flex-1 mr-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Scanning Schedule</p>
            <h3 className="text-sm font-bold mt-1 text-gray-100 font-mono truncate">
              {settings.cron}
            </h3>
            <div className="mt-2">
              <button
                className="inline-flex items-center justify-center gap-1.5 h-8 font-semibold px-3 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                onClick={handleScanNow}
                disabled={loading}
              >
                {loading ? <Spinner size="sm" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {loading ? 'Scanning...' : 'Scan Now'}
              </button>
            </div>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-400 flex-shrink-0">
            <Bell className="w-6 h-6" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
