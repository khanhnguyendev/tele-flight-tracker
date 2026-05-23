'use client';

import { useState, useEffect } from 'react';
import { useCountdown } from '@/hooks/useCountdown';
import { PlaneTakeoff } from 'lucide-react';

interface CountdownWidgetProps {
  targetDateStr: string;
}

export default function CountdownWidget({ targetDateStr }: CountdownWidgetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { days, hours, minutes, seconds, isExpired } = useCountdown(targetDateStr);

  if (!mounted) {
    return (
      <div className="flex items-center gap-2 bg-slate-950/40 border border-white/10 backdrop-blur-md rounded-2xl p-2.5 shadow-xl opacity-50">
        <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl mr-1">
          <PlaneTakeoff className="w-5 h-5" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="bg-slate-900/60 border border-white/5 w-14 h-14 md:w-16 md:h-16 rounded-xl animate-pulse" />
          <span className="text-gray-600 font-bold text-lg">:</span>
          <div className="bg-slate-900/60 border border-white/5 w-14 h-14 md:w-16 md:h-16 rounded-xl animate-pulse" />
          <span className="text-gray-600 font-bold text-lg">:</span>
          <div className="bg-slate-900/60 border border-white/5 w-14 h-14 md:w-16 md:h-16 rounded-xl animate-pulse" />
          <span className="text-gray-600 font-bold text-lg">:</span>
          <div className="bg-slate-900/60 border border-white/5 w-14 h-14 md:w-16 md:h-16 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (isExpired) {
    return (
      <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold px-4 py-2 rounded-xl text-xs uppercase tracking-wider pulse-indicator">
        <PlaneTakeoff className="w-4 h-4" />
        Departed!
      </div>
    );
  }

  const TimeBox = ({ value, label }: { value: number; label: string }) => (
    <div className="flex flex-col items-center justify-center bg-slate-900/60 border border-white/5 w-14 h-14 md:w-16 md:h-16 rounded-xl">
      <span className="text-lg md:text-xl font-black text-emerald-400 leading-none">
        {String(value).padStart(2, '0')}
      </span>
      <span className="text-[9px] md:text-[10px] text-gray-500 font-bold uppercase tracking-wider mt-1.5">
        {label}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 bg-slate-950/40 border border-white/10 backdrop-blur-md rounded-2xl p-2.5 shadow-xl">
      <div className="hidden sm:flex items-center justify-center w-10 h-10 bg-emerald-500/10 text-emerald-400 rounded-xl mr-1">
        <PlaneTakeoff className="w-5 h-5 animate-pulse" />
      </div>
      <div className="flex items-center gap-1.5">
        <TimeBox value={days} label="days" />
        <span className="text-gray-600 font-bold text-lg">:</span>
        <TimeBox value={hours} label="hours" />
        <span className="text-gray-600 font-bold text-lg">:</span>
        <TimeBox value={minutes} label="mins" />
        <span className="text-gray-600 font-bold text-lg">:</span>
        <TimeBox value={seconds} label="secs" />
      </div>
    </div>
  );
}
