'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import StatsGrid from './StatsGrid';
import TrendChart from './TrendChart';
import FlightList from './FlightList';
import { Settings } from '@/services/schemas';
import { HistoryPoint } from '@/services/historyDb';
import { StandardizedOffer } from '@/services/tracker';

interface DashboardContainerProps {
  settings: Settings;
  history: HistoryPoint[];
  offers: StandardizedOffer[];
}

export default function DashboardContainer({ settings, history, offers }: DashboardContainerProps) {
  const [loading, setLoading] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleScanNow = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/scan');
      if (response.ok) {
        startTransition(() => {
          router.refresh();
        });
      }
    } catch (error) {
      console.error('Error scanning flights:', error);
    } finally {
      setLoading(false);
    }
  };

  const isScanning = loading || isPending;

  return (
    <div className="space-y-8">
      {/* Stats Grid component */}
      <StatsGrid 
        settings={settings}
        history={history}
        cheapestPrice={offers[0]?.price || 0}
        loading={isScanning}
        onScanTrigger={handleScanNow}
      />

      {/* Analytics & Listings */}
      <div className="grid grid-cols-1 gap-8 relative">
        {/* Recharts/Chart.js Analytics Line Chart */}
        <TrendChart history={history} loading={isScanning} />

        {/* Carrier accordion cards list */}
        <FlightList offers={offers} currency={settings.currency} loading={isScanning} settings={settings} />
      </div>
    </div>
  );
}
