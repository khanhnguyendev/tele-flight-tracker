'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent } from '@heroui/react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler } from 'chart.js';
import { HistoryPoint } from '@/services/historyDb';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Title, Tooltip, Filler);

interface TrendChartProps {
  history: HistoryPoint[];
}

export default function TrendChart({ history }: TrendChartProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Destroy existing chart instance to avoid duplicate rendering during component updates
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
    }

    if (history.length === 0) return;

    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Create custom linear gradient for the under-line fill
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(16, 185, 129, 0.25)'); // Emerald Green opacity
    gradient.addColorStop(1, 'rgba(16, 185, 129, 0.00)');

    const labels = history.map(p => p.timestamp);
    const prices = history.map(p => p.cheapestPrice);

    chartInstanceRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Cheapest Price',
            data: prices,
            fill: true,
            borderColor: '#10b981',
            backgroundColor: gradient,
            tension: 0.4,
            pointBackgroundColor: '#10b981',
            pointBorderColor: '#ffffff',
            pointBorderWidth: 1.5,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 3
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            titleColor: '#ffffff',
            bodyColor: '#10b981',
            borderColor: 'rgba(255, 255, 255, 0.08)',
            borderWidth: 1,
            padding: 10,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const val = context.parsed.y;
                return `Price: ${val !== null && val !== undefined ? val.toLocaleString() : '0'} VND`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: '#9ca3af',
              font: {
                size: 11
              }
            }
          },
          y: {
            grid: {
              color: 'rgba(255, 255, 255, 0.05)'
            },
            ticks: {
              color: '#9ca3af',
              font: {
                size: 11
              },
              callback: (value: any) => {
                return (value / 1000).toLocaleString() + 'k';
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
        chartInstanceRef.current = null;
      }
    };
  }, [history]);

  return (
    <Card className="glass-card mb-8">
      <CardContent className="p-6">
        <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider mb-4">Price Trend History</h4>
        
        {history.length > 0 ? (
          <div className="h-[300px] w-full relative">
            <canvas ref={canvasRef} />
          </div>
        ) : (
          <div className="h-[200px] w-full flex items-center justify-center border border-dashed border-white/5 rounded-xl bg-black/10">
            <p className="text-sm text-gray-500 font-medium">No price scan points recorded yet. Trigger a scan to start plotting.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
