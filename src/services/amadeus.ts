import axios from 'axios';
import { StandardizedOffer } from './tracker';

export async function searchAmadeusFlights(
  origin: string,
  destination: string,
  outboundDate: string,
  returnDate: string,
  currency: string
): Promise<StandardizedOffer[]> {
  // SUNSET SAFEGUARD: July 17, 2026
  const sunsetDate = new Date('2026-07-17T00:00:00Z');
  const now = new Date();
  
  if (now >= sunsetDate) {
    throw new Error('⚠️ Amadeus GDS API has been sunsetted as of July 17, 2026. Please switch to SerpApi or Travelpayouts.');
  }

  const clientId = process.env.AMADEUS_CLIENT_ID;
  const clientSecret = process.env.AMADEUS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    console.warn('Amadeus credentials missing, returning mock GDS results with sunset warning header.');
    // Return empty list or throw to let orchestrator handle fallback
    throw new Error('Amadeus API credentials are not configured.');
  }

  try {
    // 1. Get Auth Token
    const authUrl = 'https://test.api.amadeus.com/v1/security/oauth2/token';
    const authResponse = await axios.post(
      authUrl,
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
      }
    );

    const accessToken = authResponse.data.access_token;

    // 2. Search Flight Offers
    const searchUrl = 'https://test.api.amadeus.com/v2/shopping/flight-offers';
    const searchResponse = await axios.get(searchUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        originLocationCode: origin.toUpperCase(),
        destinationLocationCode: destination.toUpperCase(),
        departureDate: outboundDate,
        returnDate: returnDate,
        adults: '1',
        currencyCode: currency.toUpperCase(),
        max: '10'
      }
    });

    const data = searchResponse.data.data || [];
    const dictionaries = searchResponse.data.dictionaries || {};

    return data.map((offer: any, idx: number) => {
      const price = parseFloat(offer.price?.total || '0');
      const itineraries = offer.itineraries || [];
      
      const outboundItin = itineraries[0] || {};
      const inboundItin = itineraries[1] || {};

      const outboundSegments = outboundItin.segments || [];
      const inboundSegments = inboundItin.segments || [];

      const outboundCarrier = getCarrierName(outboundSegments[0]?.carrierCode, dictionaries);
      const inboundCarrier = getCarrierName(inboundSegments[0]?.carrierCode, dictionaries);

      return {
        id: `amadeus-${idx}-${offer.id}`,
        carrierCode: outboundSegments[0]?.carrierCode || 'VN',
        carrierName: outboundCarrier,
        price,
        outbound: {
          departureTime: formatAmadeusTime(outboundSegments[0]?.departure?.at),
          arrivalTime: formatAmadeusTime(outboundSegments[outboundSegments.length - 1]?.arrival?.at),
          duration: formatAmadeusDuration(outboundItin.duration),
          stops: Math.max(0, outboundSegments.length - 1),
          stopsAirports: outboundSegments.slice(0, -1).map((s: any) => s.arrival?.iataCode).filter(Boolean)
        },
        inbound: {
          departureTime: formatAmadeusTime(inboundSegments[0]?.departure?.at),
          arrivalTime: formatAmadeusTime(inboundSegments[inboundSegments.length - 1]?.arrival?.at),
          duration: formatAmadeusDuration(inboundItin.duration),
          stops: Math.max(0, inboundSegments.length - 1),
          stopsAirports: inboundSegments.slice(0, -1).map((s: any) => s.arrival?.iataCode).filter(Boolean)
        },
        deeplink: 'https://www.google.com/travel/flights' // Amadeus GDS doesn't provide standard direct consumer deeplinks
      };
    });
  } catch (error: any) {
    console.error('Amadeus API search failed:', error.message);
    throw error;
  }
}

function getCarrierName(code: string, dictionaries: any): string {
  if (!code) return 'Unknown Carrier';
  const carriersDict = dictionaries.carriers || {};
  return carriersDict[code] || code;
}

function formatAmadeusTime(timeStr: string): string {
  if (!timeStr) return '--:--';
  return timeStr.replace('T', ' ').substring(0, 16);
}

function formatAmadeusDuration(durationStr: string): string {
  if (!durationStr) return '2h 45m';
  // Amadeus formats duration as PT2H45M
  const clean = durationStr.replace('PT', '');
  const hoursMatch = clean.match(/(\d+)H/);
  const minutesMatch = clean.match(/(\d+)M/);
  
  const hours = hoursMatch ? hoursMatch[1] : '0';
  const minutes = minutesMatch ? minutesMatch[1] : '0';
  
  return `${hours}h ${minutes}m`;
}
