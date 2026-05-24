'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, Spinner } from '@heroui/react';
import { Plane, Calendar, Cpu, Bell, Sliders, ArrowLeft, Save, AlertTriangle, RefreshCw } from 'lucide-react';
import { Settings, SettingsSchema } from '@/services/schemas';
import { saveSettingsAction } from '@/app/settings/actions';
import { getFriendlyCronText } from '@/services/cronFormatter';

interface SettingsFormProps {
  initialSettings: Settings;
}

export default function SettingsForm({ initialSettings }: SettingsFormProps) {
  const [form, setForm] = useState<Settings>(initialSettings);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleClientValidationAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    try {
      // 1. Client-side Zod validation
      const validated = SettingsSchema.parse({
        ...form,
        origin: form.origin.trim().toUpperCase(),
        destination: form.destination.trim().toUpperCase(),
        currency: form.currency.trim().toUpperCase()
      });

      // Date logic check
      const dep = new Date(validated.outboundDate);
      const arr = new Date(validated.returnDate);
      if (arr < dep) {
        throw new Error('Return Date must be on or after Outbound Date.');
      }



      // 2. Submit via Server Action Form submission helper
      const formData = new FormData();
      Object.entries(validated).forEach(([key, val]) => {
        formData.append(key, val);
      });

      const result = await saveSettingsAction(formData);
      if (result && !result.success) {
        setError(result.error);
        setSaving(false);
      }
    } catch (err: any) {
      setError(err.message || 'Validation failed. Please verify configurations.');
      setSaving(false);
    }
  };

  const handleInstantScan = async () => {
    setError(null);
    setScanning(true);
    setScanMessage(null);
    try {
      const response = await fetch('/api/scan');
      const data = await response.json();
      if (response.ok && data.success) {
        setScanMessage(`✓ Scan Triggered! Google Flights notified successfully.`);
      } else {
        setError(data.error || 'Failed to trigger scan.');
      }
    } catch {
      setError('Network error executing flight scan router.');
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="space-y-6">
      


      {/* Error alert */}
      {error && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-xs font-bold leading-relaxed">{error}</p>
        </div>
      )}

      {/* Scan success alert */}
      {scanMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 flex items-start gap-3">
          <p className="text-xs font-bold leading-relaxed">{scanMessage}</p>
        </div>
      )}

      <form onSubmit={handleClientValidationAndSubmit} className="space-y-6">
        <Card className="glass-card">
          <CardContent className="p-6 md:p-8 space-y-6">
            
            {/* Row 1: Origin & Destination */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-emerald-400 rotate-90" /> Departure Origin Code
                </label>
                <input 
                  type="text" 
                  name="origin" 
                  value={form.origin}
                  onChange={handleInputChange}
                  maxLength={3}
                  placeholder="e.g. SGN"
                  required
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <Plane className="w-3.5 h-3.5 text-emerald-400" /> Destination Target Code
                </label>
                <input 
                  type="text" 
                  name="destination" 
                  value={form.destination}
                  onChange={handleInputChange}
                  maxLength={3}
                  placeholder="e.g. CAN"
                  required
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Row 2: Dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Outbound Date (YYYY-MM-DD)
                </label>
                <input 
                  type="date" 
                  name="outboundDate" 
                  value={form.outboundDate}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Return Date (YYYY-MM-DD)
                </label>
                <input 
                  type="date" 
                  name="returnDate" 
                  value={form.returnDate}
                  onChange={handleInputChange}
                  required
                  className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 focus:outline-none focus:border-emerald-500 transition-all font-mono"
                />
              </div>
            </div>

            {/* Row 3: Currency Symbol */}
            <div className="space-y-2">
              <label className="text-xs text-gray-400 font-bold uppercase tracking-wider block flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-emerald-400" /> Currency Symbol
              </label>
              <input 
                type="text" 
                name="currency" 
                value={form.currency}
                onChange={handleInputChange}
                placeholder="e.g. VND"
                required
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition-all font-mono uppercase font-bold"
              />
            </div>

            {/* Row 4: Background Cron (Hidden to preserve settings flow) */}
            <input type="hidden" name="cron" value={form.cron} />

          </CardContent>
        </Card>

        {/* Action Controls buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link 
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-slate-900/60 border border-white/5 text-gray-400 hover:text-gray-200 px-6 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider"
          >
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>

          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto items-stretch">
            {/* Instant scan trigger button */}
            <button
              type="button"
              onClick={handleInstantScan}
              disabled={scanning || saving}
              className="inline-flex items-center justify-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20 px-6 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50"
            >
              {scanning ? <Spinner size="sm" /> : <RefreshCw className="w-4 h-4" />}
              {scanning ? 'Running Scan...' : 'Trigger Real-time Scan'}
            </button>

            {/* Submit button */}
            <button
              type="submit"
              disabled={saving || scanning}
              className="inline-flex items-center justify-center gap-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-8 py-3 rounded-xl transition-all font-bold text-xs uppercase tracking-wider cursor-pointer disabled:opacity-50 shadow-lg shadow-emerald-500/15"
            >
              {saving ? <Spinner size="sm" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
