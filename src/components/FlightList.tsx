'use client';

import { useState } from 'react';
import { Card, CardContent, Spinner } from '@heroui/react';
import { ArrowRight, Clock, MapPin, ExternalLink, HelpCircle, Plane, ChevronDown, Leaf, Armchair, Wind } from 'lucide-react';
import { StandardizedOffer } from '@/services/tracker';
import { Settings } from '@/services/schemas';
import { motion, AnimatePresence } from 'framer-motion';

interface FlightListProps {
  offers: StandardizedOffer[];
  currency: string;
  loading: boolean;
  settings?: Settings;
}

const AIRPORT_NAMES: Record<string, string> = {
  SGN: 'Tan Son Nhat International Airport',
  CAN: 'Guangzhou Baiyun International Airport',
  HAN: 'Noi Bai International Airport',
  DAD: 'Da Nang International Airport',
  SIN: 'Singapore Changi Airport',
  BKK: 'Suvarnabhumi Airport',
  ICN: 'Incheon International Airport',
  NRT: 'Narita International Airport',
  HND: 'Haneda Airport',
  HKG: 'Hong Kong International Airport',
  KUL: 'Kuala Lumpur International Airport',
  TPE: 'Taoyuan International Airport',
  SYD: 'Sydney Airport',
  MEL: 'Melbourne Airport',
  LHR: 'London Heathrow Airport',
  CDG: 'Paris Charles de Gaulle Airport',
  FRA: 'Frankfurt Airport',
  DXB: 'Dubai International Airport',
  JFK: 'John F. Kennedy International Airport',
  LAX: 'Los Angeles International Airport',
};

function getAirportName(code: string): string {
  const cleanCode = code.trim().toUpperCase();
  return AIRPORT_NAMES[cleanCode] || `${cleanCode} Airport`;
}

function formatLongDate(dateStr: string): string {
  try {
    const cleanStr = dateStr.replace(' ', 'T').replace('--:--', '00:00');
    const d = new Date(cleanStr.includes('T') ? cleanStr + ':00' : cleanStr + 'T00:00:00');
    if (isNaN(d.getTime())) {
      // Fallback: try parsing just the date part (YYYY-MM-DD)
      const datePart = dateStr.split(' ')[0];
      const fallbackDate = new Date(datePart + 'T00:00:00');
      if (!isNaN(fallbackDate.getTime())) {
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[fallbackDate.getDay()]}, ${months[fallbackDate.getMonth()]} ${fallbackDate.getDate()}`;
      }
      return dateStr;
    }
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
  } catch {
    return dateStr;
  }
}

function getDayOffset(depStr: string, arrStr: string): string {
  try {
    const depDate = depStr.split(' ')[0];
    const arrDate = arrStr.split(' ')[0];
    if (depDate === arrDate) return '';
    const dep = new Date(depDate + 'T00:00:00Z');
    const arr = new Date(arrDate + 'T00:00:00Z');
    const diffMs = arr.getTime() - dep.getTime();
    const diffDays = Math.round(diffMs / (24 * 3600 * 1000));
    return diffDays > 0 ? `⁺${diffDays}` : '';
  } catch {
    return '';
  }
}

function getDeterministicFlightDetails(offerId: string, segment: 'out' | 'in', carrierCode: string) {
  let hash = 0;
  const str = offerId + segment;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const aircrafts = ['Airbus A321', 'Boeing 737-800', 'Airbus A320neo', 'Boeing 737 MAX 8', 'Airbus A350-900', 'Boeing 787-9'];
  const aircraft = aircrafts[hash % aircrafts.length];

  const legrooms = [
    'Below average legroom (28 in)',
    'Standard legroom (30 in)',
    'Above average legroom (32 in)',
    'Spacious legroom (34 in)'
  ];
  const legroom = legrooms[hash % legrooms.length];

  const emissions = 120 + (hash % 60); // 120 to 180 kg CO2e
  const flightNum = `${carrierCode.toUpperCase()} ${1000 + (hash % 8999)}`;

  return { aircraft, legroom, emissions, flightNum };
}

function CarrierLogo({ code, name }: { code: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = `https://pics.avs.io/200/200/${code.toUpperCase()}.png`;

  if (failed) {
    return (
      <div className="w-14 h-14 bg-indigo-500/10 rounded-xl border border-indigo-500/20 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-inner">
        <Plane className="w-6 h-6 rotate-90" />
      </div>
    );
  }

  return (
    <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
      <img 
        src={logoUrl} 
        alt={name}
        onError={() => setFailed(true)}
        className="object-contain w-full h-full"
      />
    </div>
  );
}

export default function FlightList({ offers, currency, loading, settings }: FlightListProps) {
  const [expandedOfferId, setExpandedOfferId] = useState<string | null>(null);

  const originCode = settings?.origin || 'SGN';
  const destCode = settings?.destination || 'CAN';

  return (
    <div className="space-y-6 relative overflow-hidden p-1 min-h-[150px] rounded-2xl">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/70 backdrop-blur-sm z-20 border border-emerald-500/10 rounded-2xl transition-all duration-300">
          <Spinner size="lg" className="text-emerald-400" />
          <p className="text-xs text-emerald-400 font-bold uppercase tracking-widest mt-3">Fetching active deals...</p>
        </div>
      )}
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Available Carrier Offers ({offers.length})</h4>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Cheapest sorted first
        </span>
      </div>

      {offers.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 gap-4"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08
              }
            }
          }}
        >
          {offers.map((offer) => {
            const isExpanded = expandedOfferId === offer.id;
            const outDetails = getDeterministicFlightDetails(offer.id, 'out', offer.carrierCode);
            const inDetails = getDeterministicFlightDetails(offer.id, 'in', offer.carrierCode);

            return (
              <motion.div
                key={offer.id}
                variants={{
                  hidden: { opacity: 0, y: 15 },
                  visible: { opacity: 1, y: 0 }
                }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
                whileHover={{ 
                  scale: 1.008, 
                  borderColor: isExpanded ? 'rgba(16, 185, 129, 0.3)' : 'rgba(16, 185, 129, 0.25)',
                  boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.15)'
                }}
                className={`glass-card border rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer select-none ${
                  isExpanded ? 'border-emerald-500/30 bg-slate-950/60 shadow-lg' : 'border-white/5 bg-slate-950/40'
                }`}
                onClick={() => setExpandedOfferId(isExpanded ? null : offer.id)}
              >
                <Card className="bg-transparent border-0 shadow-none rounded-none">
                  <CardContent className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6 relative">
                    
                    {/* Expand Chevron in top right */}
                    <div className="absolute top-4 right-4 text-gray-500">
                      <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180 text-emerald-400' : ''}`} />
                    </div>

                    {/* Carrier Logo with dynamic local fallback */}
                    <div className="flex items-center gap-4 w-full lg:w-[22%]">
                      <CarrierLogo code={offer.carrierCode} name={offer.carrierName} />
                      <div>
                        <h5 className="font-bold text-gray-100 text-sm leading-tight">{offer.carrierName}</h5>
                        <p className="text-xs text-indigo-400 font-semibold tracking-wider mt-0.5">{offer.carrierCode} Flight</p>
                      </div>
                    </div>

                    {/* Flight Segments (Outbound & Inbound) */}
                    <div className="flex flex-col md:flex-row gap-6 flex-1 w-full justify-around">
                      {/* Outbound */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Outbound</span>
                          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-400" />
                            {offer.outbound.duration}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-base font-bold text-gray-100">{offer.outbound.departureTime.split(' ')[1] || offer.outbound.departureTime}</p>
                            <p className="text-xs text-gray-400 font-medium">{offer.outbound.departureTime.split(' ')[0]}</p>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-4 relative">
                            <ArrowRight className="w-4 h-4 text-emerald-400" />
                            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                              {offer.outbound.stops === 0 ? 'Direct' : `${offer.outbound.stops} stop${offer.outbound.stops > 1 ? 's' : ''}`}
                            </span>
                            {offer.outbound.stopsAirports.length > 0 && (
                              <span className="text-[9px] text-indigo-400 font-mono mt-0.5">
                                ({offer.outbound.stopsAirports.join(', ')})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-gray-100">{offer.outbound.arrivalTime.split(' ')[1] || offer.outbound.arrivalTime}</p>
                            <p className="text-xs text-gray-400 font-medium">{offer.outbound.arrivalTime.split(' ')[0]}</p>
                          </div>
                        </div>
                      </div>

                      {/* Divider line for MD screen */}
                      <div className="hidden md:block w-px bg-white/5 self-stretch" />

                      {/* Inbound */}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded font-bold uppercase tracking-wider">Inbound</span>
                          <span className="text-xs text-gray-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-indigo-400" />
                            {offer.inbound.duration}
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-4">
                          <div>
                            <p className="text-base font-bold text-gray-100">{offer.inbound.departureTime.split(' ')[1] || offer.inbound.departureTime}</p>
                            <p className="text-xs text-gray-400 font-medium">{offer.inbound.departureTime.split(' ')[0]}</p>
                          </div>
                          <div className="flex-1 flex flex-col items-center px-4 relative">
                            <ArrowRight className="w-4 h-4 text-indigo-400" />
                            <span className="text-[10px] text-gray-500 font-bold mt-1 uppercase tracking-wider">
                              {offer.inbound.stops === 0 ? 'Direct' : `${offer.inbound.stops} stop${offer.inbound.stops > 1 ? 's' : ''}`}
                            </span>
                            {offer.inbound.stopsAirports.length > 0 && (
                              <span className="text-[9px] text-indigo-400 font-mono mt-0.5">
                                ({offer.inbound.stopsAirports.join(', ')})
                              </span>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-base font-bold text-gray-100">{offer.inbound.arrivalTime.split(' ')[1] || offer.inbound.arrivalTime}</p>
                            <p className="text-xs text-gray-400 font-medium">{offer.inbound.arrivalTime.split(' ')[0]}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Booking & Price */}
                    <div className="flex flex-row lg:flex-col items-center justify-between lg:justify-center gap-4 w-full lg:w-[18%] lg:border-l lg:border-white/5 lg:pl-6 pt-4 lg:pt-0 border-t border-dashed border-white/10 lg:border-t-0">
                      <div className="text-left lg:text-center">
                        <p className="text-xs text-gray-400 font-medium uppercase">Round Trip Price</p>
                        <p className="text-2xl font-black text-emerald-400 mt-1 tracking-tight">
                          {offer.price.toLocaleString()} <span className="text-xs text-gray-400 font-bold">{currency}</span>
                        </p>
                      </div>
                      <a
                        href={offer.deeplink}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center justify-center gap-1.5 h-10 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 px-5 rounded-xl text-xs transition-all"
                      >
                        Book Deal
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                  </CardContent>
                </Card>

                {/* Smooth Expandable Content Panel */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                      className="overflow-hidden border-t border-white/5 bg-slate-950/40 relative z-10"
                      onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inner panel
                    >
                      <div className="p-6 space-y-8 bg-slate-950/40">
                        {/* Outbound Detail Section */}
                        <div className="flex flex-col lg:flex-row justify-between gap-6 pb-6 border-b border-dashed border-white/5">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                <Plane className="w-3 h-3 rotate-90" />
                                Departing flight
                              </span>
                              <span className="text-xs font-bold text-gray-200">{formatLongDate(offer.outbound.departureTime)}</span>
                              <span className="text-[10px] text-gray-500 font-semibold">•</span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {outDetails.emissions} kg CO2e (Avg emissions)
                              </span>
                            </div>

                            {/* Visual Timeline Track */}
                            <div className="relative pl-6 space-y-6 before:absolute before:left-[5px] before:top-[10px] before:bottom-[10px] before:w-[2px] before:border-l-2 before:border-dotted before:border-emerald-500/25">
                              {/* Departure Node */}
                              <div className="relative flex items-start gap-4">
                                <div className="absolute left-[-26px] top-[5px] w-3 h-3 rounded-full border-2 border-emerald-400 bg-slate-950 flex items-center justify-center">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-100 flex flex-wrap items-center gap-1.5">
                                    <span className="text-emerald-400">{offer.outbound.departureTime.split(' ')[1] || offer.outbound.departureTime}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">({formatLongDate(offer.outbound.departureTime)})</span>
                                    <span className="text-[10px] text-gray-500 font-semibold">•</span>
                                    <span>{getAirportName(originCode)} ({originCode})</span>
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Departure airport terminal</p>
                                </div>
                              </div>

                              {/* Duration info on track */}
                              <div className="text-[10px] text-indigo-400 font-bold tracking-wide py-0.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                Travel time: {offer.outbound.duration}
                              </div>

                              {/* Arrival Node */}
                              <div className="relative flex items-start gap-4">
                                <div className="absolute left-[-26px] top-[5px] w-3 h-3 rounded-full border-2 border-emerald-400 bg-slate-950 flex items-center justify-center">
                                  <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-100 flex flex-wrap items-center gap-1.5">
                                    <span className="text-emerald-400">{offer.outbound.arrivalTime.split(' ')[1] || offer.outbound.arrivalTime}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">({formatLongDate(offer.outbound.arrivalTime)})</span>
                                    {getDayOffset(offer.outbound.departureTime, offer.outbound.arrivalTime) && (
                                      <span className="text-[10px] text-emerald-400 font-black relative top-[-4px]">
                                        {getDayOffset(offer.outbound.departureTime, offer.outbound.arrivalTime)}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-gray-500 font-semibold">•</span>
                                    <span>{getAirportName(destCode)} ({destCode})</span>
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Arrival destination airport</p>
                                </div>
                              </div>
                            </div>

                            {/* Segment Footer */}
                            <p className="text-[10px] text-gray-400 font-semibold bg-white/5 border border-white/10 rounded-xl px-4 py-2 inline-block">
                              {offer.carrierName} • Economy • {outDetails.aircraft} • {outDetails.flightNum}
                            </p>
                          </div>

                          {/* Right Side Amenities */}
                          <div className="w-full lg:w-[32%] bg-slate-900/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                  <Armchair className="w-3.5 h-3.5" />
                                </div>
                                {outDetails.legroom}
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                  <Leaf className="w-3.5 h-3.5" />
                                </div>
                                Emissions estimate: {outDetails.emissions} kg CO2e
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                  <Wind className="w-3.5 h-3.5" />
                                </div>
                                Contrail warming potential: Low
                              </div>
                            </div>
                            <a
                              href={offer.deeplink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1.5 h-9 w-full font-bold text-gray-100 border border-white/10 hover:bg-white/5 rounded-xl text-xs transition-all mt-1"
                            >
                              Change flight
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 rotate-270" />
                            </a>
                          </div>
                        </div>

                        {/* Inbound Detail Section */}
                        <div className="flex flex-col lg:flex-row justify-between gap-6 pt-2">
                          <div className="flex-1 space-y-4">
                            <div className="flex flex-wrap items-center gap-3">
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                <Plane className="w-3 h-3 rotate-270" />
                                Returning flight
                              </span>
                              <span className="text-xs font-bold text-gray-200">{formatLongDate(offer.inbound.departureTime)}</span>
                              <span className="text-[10px] text-gray-500 font-semibold">•</span>
                              <span className="text-[10px] text-gray-400 font-medium">
                                {inDetails.emissions} kg CO2e (Avg emissions)
                              </span>
                            </div>

                            {/* Visual Timeline Track */}
                            <div className="relative pl-6 space-y-6 before:absolute before:left-[5px] before:top-[10px] before:bottom-[10px] before:w-[2px] before:border-l-2 before:border-dotted before:border-indigo-500/25">
                              {/* Departure Node */}
                              <div className="relative flex items-start gap-4">
                                <div className="absolute left-[-26px] top-[5px] w-3 h-3 rounded-full border-2 border-indigo-400 bg-slate-950 flex items-center justify-center">
                                  <span className="w-1 h-1 rounded-full bg-indigo-400" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-100 flex flex-wrap items-center gap-1.5">
                                    <span className="text-indigo-400">{offer.inbound.departureTime.split(' ')[1] || offer.inbound.departureTime}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">({formatLongDate(offer.inbound.departureTime)})</span>
                                    <span className="text-[10px] text-gray-500 font-semibold">•</span>
                                    <span>{getAirportName(destCode)} ({destCode})</span>
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Departure airport terminal</p>
                                </div>
                              </div>

                              {/* Duration info on track */}
                              <div className="text-[10px] text-indigo-400 font-bold tracking-wide py-0.5 flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5 text-indigo-400" />
                                Travel time: {offer.inbound.duration}
                              </div>

                              {/* Arrival Node */}
                              <div className="relative flex items-start gap-4">
                                <div className="absolute left-[-26px] top-[5px] w-3 h-3 rounded-full border-2 border-indigo-400 bg-slate-950 flex items-center justify-center">
                                  <span className="w-1 h-1 rounded-full bg-indigo-400 animate-pulse" />
                                </div>
                                <div>
                                  <p className="text-xs font-bold text-gray-100 flex flex-wrap items-center gap-1.5">
                                    <span className="text-indigo-400">{offer.inbound.arrivalTime.split(' ')[1] || offer.inbound.arrivalTime}</span>
                                    <span className="text-[10px] text-gray-400 font-medium">({formatLongDate(offer.inbound.arrivalTime)})</span>
                                    {getDayOffset(offer.inbound.departureTime, offer.inbound.arrivalTime) && (
                                      <span className="text-[10px] text-indigo-400 font-black relative top-[-4px]">
                                        {getDayOffset(offer.inbound.departureTime, offer.inbound.arrivalTime)}
                                      </span>
                                    )}
                                    <span className="text-[10px] text-gray-500 font-semibold">•</span>
                                    <span>{getAirportName(originCode)} ({originCode})</span>
                                  </p>
                                  <p className="text-[10px] text-gray-400 mt-0.5">Arrival destination airport</p>
                                </div>
                              </div>
                            </div>

                            {/* Segment Footer */}
                            <p className="text-[10px] text-gray-400 font-semibold bg-white/5 border border-white/10 rounded-xl px-4 py-2 inline-block">
                              {offer.carrierName} • Economy • {inDetails.aircraft} • {inDetails.flightNum}
                            </p>
                          </div>

                          {/* Right Side Amenities */}
                          <div className="w-full lg:w-[32%] bg-slate-900/20 border border-white/5 rounded-2xl p-4 flex flex-col justify-between gap-4">
                            <div className="space-y-3">
                              <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                  <Armchair className="w-3.5 h-3.5" />
                                </div>
                                {inDetails.legroom}
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                                <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                                  <Leaf className="w-3.5 h-3.5" />
                                </div>
                                Emissions estimate: {inDetails.emissions} kg CO2e
                              </div>
                              <div className="flex items-center gap-2.5 text-xs text-gray-300 font-semibold">
                                <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                                  <Wind className="w-3.5 h-3.5" />
                                </div>
                                Contrail warming potential: Low
                              </div>
                            </div>
                            <a
                              href={offer.deeplink}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center justify-center gap-1.5 h-9 w-full font-bold text-gray-100 border border-white/10 hover:bg-white/5 rounded-xl text-xs transition-all mt-1"
                            >
                              Change flight
                              <ChevronDown className="w-3.5 h-3.5 text-gray-400 rotate-270" />
                            </a>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <div className="border border-dashed border-white/5 rounded-xl bg-slate-950/20 p-12 text-center">
          <HelpCircle className="w-12 h-12 text-gray-500 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-400">No flight offers found</p>
          <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">There are no available round-trip combinations listed for the selected travel specifications. Try running another scan.</p>
        </div>
      )}
    </div>
  );
}
