'use client';

import { Card, CardContent, Button } from '@heroui/react';
import { ArrowRight, Clock, MapPin, ExternalLink, HelpCircle } from 'lucide-react';
import { StandardizedOffer } from '@/services/tracker';

interface FlightListProps {
  offers: StandardizedOffer[];
  currency: string;
}

export default function FlightList({ offers, currency }: FlightListProps) {
  const getCarrierLogoUrl = (code: string) => {
    // Standard airline logo service or fall back to high quality airline text code badge
    return `https://pics.avs.io/al_covers/64/64/${code.toUpperCase()}.png`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold text-gray-200 uppercase tracking-wider">Available Carrier Offers ({offers.length})</h4>
        <span className="text-xs bg-emerald-500/10 text-emerald-400 font-semibold px-2.5 py-0.5 rounded-full border border-emerald-500/20">
          Cheapest sorted first
        </span>
      </div>

      {offers.length > 0 ? (
        <div className="grid grid-cols-1 gap-4">
          {offers.map((offer) => (
            <Card key={offer.id} className="glass-card hover:-translate-y-0.5 border border-white/5 bg-slate-950/40">
              <CardContent className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                
                {/* Airline info & logo */}
                <div className="flex items-center gap-4 w-full lg:w-[22%]">
                  <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/10 flex items-center justify-center p-1.5 overflow-hidden flex-shrink-0">
                    <img 
                      src={getCarrierLogoUrl(offer.carrierCode)} 
                      alt={offer.carrierName}
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://img.icons8.com/color/48/airplane-take-off.png';
                      }}
                      className="object-contain"
                    />
                  </div>
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
                    className="inline-flex items-center justify-center gap-1.5 h-10 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 px-5 rounded-xl text-xs transition-all"
                  >
                    Book Deal
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

              </CardContent>
            </Card>
          ))}
        </div>
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
