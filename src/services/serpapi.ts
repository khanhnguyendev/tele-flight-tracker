import axios from 'axios';
import { StandardizedOffer } from './tracker';

export async function searchSerpapiFlights(
  origin: string,
  destination: string,
  outboundDate: string,
  returnDate: string,
  currency: string
): Promise<StandardizedOffer[]> {
  const apiKey = process.env.SERPAPI_KEY;
  if (!apiKey) {
    console.warn('SERPAPI_KEY env variable is missing');
    return [];
  }

  try {
    const url = 'https://serpapi.com/search.json';
    const response = await axios.get(url, {
      params: {
        engine: 'google_flights',
        departure_id: origin.toUpperCase(),
        arrival_id: destination.toUpperCase(),
        outbound_date: outboundDate,
        return_date: returnDate,
        currency: currency.toUpperCase(),
        hl: 'en',
        gl: 'us',
        api_key: apiKey
      },
      timeout: 15000 // 15s timeout
    });

    const results = response.data;
    const offers: StandardizedOffer[] = [];

    // Google Flights returns offers under "best_flights" and "other_flights"
    const rawFlightsList = [
      ...(results.best_flights || []),
      ...(results.other_flights || [])
    ];

    if (rawFlightsList.length === 0) {
      console.warn('No flights returned from SerpApi Google Flights');
      return [];
    }

    rawFlightsList.forEach((offer: any, idx: number) => {
      const price = offer.price || 0;
      const flights = offer.flights || [];
      if (flights.length === 0) return;

      // Group flights into outbound and inbound segments
      const outboundSegments: any[] = [];
      const inboundSegments: any[] = [];
      let reachedDestination = false;

      for (const segment of flights) {
        if (!reachedDestination) {
          outboundSegments.push(segment);
          if (segment.arrival_airport?.id?.toUpperCase() === destination.toUpperCase()) {
            reachedDestination = true;
          }
        } else {
          inboundSegments.push(segment);
        }
      }

      // If for some reason we didn't find the destination, split halfway
      if (inboundSegments.length === 0 && flights.length > 1) {
        const mid = Math.ceil(flights.length / 2);
        outboundSegments.push(...flights.slice(0, mid));
        inboundSegments.push(...flights.slice(mid));
      }

      const outboundCarrier = outboundSegments[0]?.airline || 'Unknown Carrier';
      const outboundCarrierCode = outboundSegments[0]?.airline_logo ? extractCarrierCode(outboundSegments[0]?.airline) : 'VN';
      
      const outboundDepTime = outboundSegments[0]?.departure_airport?.time || `${outboundDate} --:--`;
      const outboundArrTime = outboundSegments[outboundSegments.length - 1]?.arrival_airport?.time || `${outboundDate} --:--`;
      const outboundDuration = formatMinutes(outboundSegments.reduce((acc, s) => acc + (s.duration || 0), 0));
      
      const inboundDepTime = inboundSegments[0]?.departure_airport?.time || `${returnDate} --:--`;
      const inboundArrTime = inboundSegments[inboundSegments.length - 1]?.arrival_airport?.time || `${returnDate} --:--`;
      const inboundDuration = formatMinutes(inboundSegments.reduce((acc, s) => acc + (s.duration || 0), 0));

      offers.push({
        id: `serpapi-${idx}-${offer.flights[0]?.flight_number || 'flight'}`,
        carrierCode: outboundCarrierCode,
        carrierName: outboundCarrier,
        price,
        outbound: {
          departureTime: outboundDepTime,
          arrivalTime: outboundArrTime,
          duration: outboundDuration,
          stops: Math.max(0, outboundSegments.length - 1),
          stopsAirports: outboundSegments.slice(0, -1).map(s => s.arrival_airport?.id).filter(Boolean)
        },
        inbound: {
          departureTime: inboundDepTime,
          arrivalTime: inboundArrTime,
          duration: inboundDuration,
          stops: Math.max(0, inboundSegments.length - 1),
          stopsAirports: inboundSegments.slice(0, -1).map(s => s.arrival_airport?.id).filter(Boolean)
        },
        deeplink: results.search_metadata?.google_flights_url || `https://www.google.com/travel/flights`
      });
    });

    return offers.sort((a, b) => a.price - b.price);
  } catch (error: any) {
    console.error('SerpApi Google Flights search failed:', error.message);
    throw error;
  }
}

function extractCarrierCode(airline: string): string {
  const map: Record<string, string> = {
    'vietnam airlines': 'VN',
    'vietjet air': 'VJ',
    'china southern': 'CZ',
    'shenzhen airlines': 'ZH',
    'bamboo airways': 'QH',
    'air china': 'CA',
    'china eastern': 'MU'
  };
  const clean = airline.toLowerCase().trim();
  for (const key in map) {
    if (clean.includes(key)) return map[key];
  }
  return 'VN';
}

function formatMinutes(minutes: number): string {
  if (!minutes) return '2h 45m'; // default
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}
