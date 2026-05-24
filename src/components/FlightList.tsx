'use client';

import { useState } from 'react';
import { Card, CardContent, Button, Spinner } from '@heroui/react';
import { ArrowRight, Clock, MapPin, ExternalLink, HelpCircle, Plane } from 'lucide-react';
import { StandardizedOffer } from '@/services/tracker';
import { motion } from 'framer-motion';

interface FlightListProps {
  offers: StandardizedOffer[];
  currency: string;
  loading: boolean;
}

function CarrierLogo({ code, name }: { code: string; name: string }) {
  const [failed, setFailed] = useState(false);
  const logoUrl = `https://pics.avs.io/al_covers/64/64/${code.toUpperCase()}.png`;

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

export default function FlightList({ offers, currency, loading }: FlightListProps) {

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
          {offers.map((offer) => (
            <motion.div
              key={offer.id}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0 }
              }}
              transition={{ duration: 0.45, ease: 'easeOut' }}
              whileHover={{ 
                scale: 1.008, 
                borderColor: 'rgba(16, 185, 129, 0.25)',
                boxShadow: '0 10px 30px -10px rgba(16, 185, 129, 0.15)'
              }}
              className="glass-card border border-white/5 bg-slate-950/40 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <Card className="bg-transparent border-0 shadow-none rounded-none">
                <CardContent className="p-6 flex flex-col lg:flex-row items-center justify-between gap-6">
                  
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
                      className="inline-flex items-center justify-center gap-1.5 h-10 font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 shadow-lg shadow-emerald-500/20 px-5 rounded-xl text-xs transition-all"
                    >
                      Book Deal
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                </CardContent>
              </Card>
            </motion.div>
          ))}
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
