import { Settings } from './settingsDb';
import { searchMockFlights } from './mock';
import { searchTravelpayoutsFlights } from './travelpayouts';
import { searchSerpapiFlights } from './serpapi';
import { searchAmadeusFlights } from './amadeus';

export interface StandardizedOffer {
  id: string;
  carrierCode: string;
  carrierName: string;
  price: number;
  outbound: {
    departureTime: string; // "YYYY-MM-DD HH:mm"
    arrivalTime: string;   // "YYYY-MM-DD HH:mm"
    duration: string;      // e.g. "2h 45m"
    stops: number;
    stopsAirports: string[];
  };
  inbound: {
    departureTime: string;
    arrivalTime: string;
    duration: string;
    stops: number;
    stopsAirports: string[];
  };
  deeplink: string;
}

/**
 * Unified search router orchestrator.
 * Routes flight searches dynamically according to settings database and environment configs.
 */
export async function searchFlights(settings: Settings): Promise<StandardizedOffer[]> {
  const useMock = process.env.USE_MOCK_DATA === 'true';
  const engine = useMock ? 'mock' : settings.engine;

  console.log(`Orchestrating flight search via engine: ${engine.toUpperCase()} (Mock mode: ${useMock})`);

  try {
    switch (engine) {
      case 'mock':
        return await searchMockFlights(
          settings.origin,
          settings.destination,
          settings.outboundDate,
          settings.returnDate,
          settings.currency
        );

      case 'travelpayouts':
        return await searchTravelpayoutsFlights(
          settings.origin,
          settings.destination,
          settings.outboundDate,
          settings.returnDate,
          settings.currency
        );

      case 'serpapi':
        return await searchSerpapiFlights(
          settings.origin,
          settings.destination,
          settings.outboundDate,
          settings.returnDate,
          settings.currency
        );

      case 'amadeus':
        return await searchAmadeusFlights(
          settings.origin,
          settings.destination,
          settings.outboundDate,
          settings.returnDate,
          settings.currency
        );

      default:
        console.warn(`Unknown engine "${engine}", falling back to mock search`);
        return await searchMockFlights(
          settings.origin,
          settings.destination,
          settings.outboundDate,
          settings.returnDate,
          settings.currency
        );
    }
  } catch (error: any) {
    console.error(`Engine "${engine}" failed:`, error.message);
    console.warn('Gracefully falling back to MOCK search to prevent application crash.');
    
    // Graceful fallback to mock data so the app remains interactive
    return await searchMockFlights(
      settings.origin,
      settings.destination,
      settings.outboundDate,
      settings.returnDate,
      settings.currency
    );
  }
}
