'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, Spinner } from '@heroui/react';
import { Plane, Calendar, Cpu, Bell, ArrowDownRight, ArrowUpRight, Minus, RefreshCw } from 'lucide-react';
import { Settings } from '@/services/schemas';
import { HistoryPoint } from '@/services/historyDb';
import { getFriendlyCronText } from '@/services/cronFormatter';

function formatTravelDates(depStr: string, retStr: string): string {
  try {
    const dep = new Date(depStr);
    const ret = new Date(retStr);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const depDay = dep.getDate();
    const depMonth = months[dep.getMonth()];
    
    const retDay = ret.getDate();
    const retMonth = months[ret.getMonth()];
    const retYear = ret.getFullYear();

    if (dep.getFullYear() !== ret.getFullYear()) {
      return `${depMonth} ${depDay}, ${dep.getFullYear()} ⇄ ${retMonth} ${retDay}, ${retYear}`;
    }
    if (dep.getMonth() === ret.getMonth()) {
      return `${depMonth} ${depDay} ⇄ ${retDay}, ${retYear}`;
    }
    return `${depMonth} ${depDay} ⇄ ${retMonth} ${retDay}, ${retYear}`;
  } catch {
    return `${depStr} to ${retStr}`;
  }
}

function parseLocalDate(dateStr: string) {
  try {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return null;
    const year = parseInt(parts[0], 10);
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return {
      year,
      month: months[monthIndex],
      day
    };
  } catch {
    return null;
  }
}

function formatSingleDateShort(dateStr: string): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return dateStr;
  return `${parsed.month} ${parsed.day}`;
}

function getYearOfDate(dateStr: string): string {
  const parsed = parseLocalDate(dateStr);
  if (!parsed) return '';
  return String(parsed.year);
}

function calculateDurationDays(depStr: string, retStr: string): number {
  try {
    const dep = new Date(`${depStr}T00:00:00Z`);
    const ret = new Date(`${retStr}T00:00:00Z`);
    const diffMs = ret.getTime() - dep.getTime();
    return Math.max(1, Math.ceil(diffMs / (24 * 3600 * 1000)));
  } catch {
    return 0;
  }
}

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

      {/* 2. Route & Dates Card (Highlighted with premium visual attention) */}
      <Card className="glass-card border-indigo-500/25 hover:border-indigo-400/50 shadow-lg shadow-indigo-500/5 bg-gradient-to-br from-indigo-950/20 to-slate-950/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1.5 h-1.5 bg-emerald-400 rounded-full m-3 pulse-indicator" />
        <CardContent className="p-5 flex flex-row items-center justify-between">
          <div className="w-full">
            <p className="text-[10px] text-indigo-300 font-extrabold uppercase tracking-widest">Flight Route & Dates</p>
            <h3 className="text-2xl font-black mt-1 text-gray-100 flex items-center gap-2">
              {settings.origin} 
              <Plane className="w-5 h-5 text-indigo-400 rotate-90 animate-pulse" /> 
              {settings.destination}
            </h3>
            
            {/* Redesigned Premium Dates display sections */}
            <div className="grid grid-cols-3 gap-2 mt-4 bg-slate-950/50 border border-indigo-500/15 rounded-xl p-2.5 shadow-inner">
              <div className="flex flex-col items-center justify-center text-center p-1 bg-slate-900/40 rounded-lg border border-white/5">
                <span className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-widest">Outbound</span>
                <span className="text-[11px] font-black text-gray-100 mt-1 whitespace-nowrap">
                  {formatSingleDateShort(settings.outboundDate)}
                </span>
                <span className="text-[8px] text-gray-500 font-bold mt-0.5">
                  {getYearOfDate(settings.outboundDate)}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center text-center p-1 bg-slate-900/40 rounded-lg border border-white/5">
                <span className="text-[8px] text-indigo-400 font-extrabold uppercase tracking-widest">Return</span>
                <span className="text-[11px] font-black text-gray-100 mt-1 whitespace-nowrap">
                  {formatSingleDateShort(settings.returnDate)}
                </span>
                <span className="text-[8px] text-gray-500 font-bold mt-0.5">
                  {getYearOfDate(settings.returnDate)}
                </span>
              </div>
              
              <div className="flex flex-col items-center justify-center text-center p-1 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                <span className="text-[8px] text-emerald-400 font-extrabold uppercase tracking-widest">Trip length</span>
                <span className="text-[11px] font-black text-emerald-400 mt-1">
                  {calculateDurationDays(settings.outboundDate, settings.returnDate)} Days
                </span>
                <span className="text-[8px] text-indigo-300 font-bold mt-0.5 uppercase tracking-wide">Round-Trip</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. On-Demand Scanner Card */}
      <Card className="glass-card relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/85 backdrop-blur-md z-20 border border-emerald-500/20 rounded-2xl animate-fade-in transition-all duration-300">
            {/* Spinning Radar Circle */}
            <div className="relative w-12 h-12 flex items-center justify-center">
              <span className="absolute inset-0 w-full h-full rounded-full border border-emerald-500/10" />
              <span className="absolute inset-0 w-full h-full rounded-full border-t-2 border-emerald-400 animate-spin" />
              <Plane className="w-5 h-5 text-emerald-400 animate-pulse rotate-90" />
            </div>
            
            {/* Pulsing Status Text */}
            <p className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest mt-3 animate-pulse">
              Orchestrating Live Scan...
            </p>
            <p className="text-[8px] text-gray-500 font-semibold mt-1">
              Contacting flight search engines
            </p>
          </div>
        )}
        <CardContent className="p-5 flex flex-row items-center justify-between">
          <div className="flex-1 mr-2">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">On-Demand Scanner</p>
            <h3 className="text-base font-bold mt-1 text-gray-100 truncate">
              Manual Ticket Sync
            </h3>
            <p className="text-[10px] text-gray-500 font-medium mt-1">Trigger live price updates instantly</p>
            <div className="mt-2.5">
              <button
                className="inline-flex items-center justify-center gap-1.5 h-8 font-semibold px-3 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-xl text-xs transition-all cursor-pointer disabled:opacity-50"
                onClick={handleScanNow}
                disabled={loading}
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Scan Now
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
