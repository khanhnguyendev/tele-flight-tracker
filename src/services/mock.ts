import { StandardizedOffer } from './tracker';

/**
 * Simulates a flight search with mock data and small price fluctuations.
 * baselineCheapest represents a baseline price in the current currency.
 */
export async function searchMockFlights(
  origin: string,
  destination: string,
  outboundDate: string,
  returnDate: string,
  currency: string
): Promise<StandardizedOffer[]> {
  // Simple seed calculation based on dates to keep fluctuations consistent but slightly dynamic
  const dateNum = new Date(outboundDate).getDate() + new Date(returnDate).getDate();
  const minuteSeed = new Date().getMinutes();
  const fluctuation = 1 + (((dateNum + minuteSeed) % 11) - 5) * 0.02; // Fluctuates between -10% and +10%

  const baseCheapest = currency === 'VND' ? 4500000 : 180;
  const baseVn = baseCheapest * 1.1;
  const baseCz = baseCheapest * 1.25;
  const baseZh = baseCheapest * 1.05;
  const baseVj = baseCheapest * 0.85;

  const mockOffers: StandardizedOffer[] = [
    {
      id: 'mock-vj-1',
      carrierCode: 'VJ',
      carrierName: 'Vietjet Air',
      price: Math.round(baseVj * fluctuation),
      outbound: {
        departureTime: `${outboundDate} 08:30`,
        arrivalTime: `${outboundDate} 12:15`,
        duration: '2h 45m',
        stops: 0,
        stopsAirports: []
      },
      inbound: {
        departureTime: `${returnDate} 13:45`,
        arrivalTime: `${returnDate} 15:30`,
        duration: '2h 45m',
        stops: 0,
        stopsAirports: []
      },
      deeplink: `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${outboundDate}%20through%20${returnDate}`
    },
    {
      id: 'mock-zh-1',
      carrierCode: 'ZH',
      carrierName: 'Shenzhen Airlines',
      price: Math.round(baseZh * fluctuation),
      outbound: {
        departureTime: `${outboundDate} 10:15`,
        arrivalTime: `${outboundDate} 14:00`,
        duration: '2h 45m',
        stops: 0,
        stopsAirports: []
      },
      inbound: {
        departureTime: `${returnDate} 16:50`,
        arrivalTime: `${returnDate} 18:35`,
        duration: '2h 45m',
        stops: 0,
        stopsAirports: []
      },
      deeplink: `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${outboundDate}%20through%20${returnDate}`
    },
    {
      id: 'mock-vn-1',
      carrierCode: 'VN',
      carrierName: 'Vietnam Airlines',
      price: Math.round(baseVn * fluctuation),
      outbound: {
        departureTime: `${outboundDate} 14:30`,
        arrivalTime: `${outboundDate} 18:15`,
        duration: '2h 45m',
        stops: 0,
        stopsAirports: []
      },
      inbound: {
        departureTime: `${returnDate} 19:30`,
        arrivalTime: `${returnDate} 21:15`,
        duration: '2h 45m',
        stops: 0,
        stopsAirports: []
      },
      deeplink: `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${outboundDate}%20through%20${returnDate}`
    },
    {
      id: 'mock-cz-1',
      carrierCode: 'CZ',
      carrierName: 'China Southern Airlines',
      price: Math.round(baseCz * fluctuation),
      outbound: {
        departureTime: `${outboundDate} 11:55`,
        arrivalTime: `${outboundDate} 15:45`,
        duration: '2h 50m',
        stops: 0,
        stopsAirports: []
      },
      inbound: {
        departureTime: `${returnDate} 08:45`,
        arrivalTime: `${returnDate} 10:40`,
        duration: '2h 55m',
        stops: 0,
        stopsAirports: []
      },
      deeplink: `https://www.google.com/travel/flights?q=Flights%20to%20${destination}%20from%20${origin}%20on%20${outboundDate}%20through%20${returnDate}`
    }
  ];

  // Return sorted by price ascending
  return mockOffers.sort((a, b) => a.price - b.price);
}
