import axios from 'axios';
import { StandardizedOffer } from './tracker';

export async function searchTravelpayoutsFlights(
  origin: string,
  destination: string,
  outboundDate: string,
  returnDate: string,
  currency: string
): Promise<StandardizedOffer[]> {
  const token = process.env.TRAVELPAYOUTS_TOKEN;
  if (!token) {
    console.warn('TRAVELPAYOUTS_TOKEN env variable is missing');
    return [];
  }

  try {
    const url = 'https://api.travelpayouts.com/v3/prices_for_dates';
    const response = await axios.get(url, {
      params: {
        origin: origin.toUpperCase(),
        destination: destination.toUpperCase(),
        departure_at: outboundDate,
        return_at: returnDate,
        unique: 'false',
        sorting: 'price',
        direct: 'false',
        currency: currency.toLowerCase(),
        limit: 10,
        token: token
      },
      timeout: 10000 // 10s timeout
    });

    if (response.data && response.data.success && Array.isArray(response.data.data)) {
      const data = response.data.data;
      return data.map((item: any, idx: number) => {
        const carrierCode = item.airline || 'UNKNOWN';
        const carrierName = getCarrierName(carrierCode);
        const durationMin = item.duration || 165; // default 2h45m if missing
        
        // Derive arrival times as outbound/inbound estimate
        const outboundDep = item.departure_at ? item.departure_at.replace('T', ' ').substring(0, 16) : `${outboundDate} 12:00`;
        const inboundDep = item.return_at ? item.return_at.replace('T', ' ').substring(0, 16) : `${returnDate} 12:00`;

        return {
          id: `tp-${idx}-${item.flight_number || 'flight'}`,
          carrierCode,
          carrierName,
          price: item.price,
          outbound: {
            departureTime: outboundDep,
            arrivalTime: estimateArrivalTime(outboundDep, durationMin),
            duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
            stops: item.transfers || 0,
            stopsAirports: []
          },
          inbound: {
            departureTime: inboundDep,
            arrivalTime: estimateArrivalTime(inboundDep, durationMin),
            duration: `${Math.floor(durationMin / 60)}h ${durationMin % 60}m`,
            stops: item.transfers || 0,
            stopsAirports: []
          },
          deeplink: item.link ? `https://www.aviasales.com${item.link}` : `https://www.google.com/travel/flights`
        };
      });
    }
    return [];
  } catch (error: any) {
    console.error('Travelpayouts API search failed:', error.message);
    throw error;
  }
}

function getCarrierName(code: string): string {
  const carriers: Record<string, string> = {
    VN: 'Vietnam Airlines',
    CZ: 'China Southern Airlines',
    ZH: 'Shenzhen Airlines',
    VJ: 'Vietjet Air',
    QH: 'Bamboo Airways',
    CA: 'Air China',
    MU: 'China Eastern Airlines'
  };
  return carriers[code.toUpperCase()] || code;
}

function estimateArrivalTime(departureTimeStr: string, durationMinutes: number): string {
  try {
    const parts = departureTimeStr.split(' ');
    if (parts.length < 2) return departureTimeStr;
    const dateStr = parts[0];
    const timeStr = parts[1];
    const timeParts = timeStr.split(':');
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    const depDate = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`);
    const arrDate = new Date(depDate.getTime() + durationMinutes * 60 * 1000);

    const arrDay = String(arrDate.getDate()).padStart(2, '0');
    const arrMonth = String(arrDate.getMonth() + 1).padStart(2, '0');
    const arrHours = String(arrDate.getHours()).padStart(2, '0');
    const arrMinutes = String(arrDate.getMinutes()).padStart(2, '0');

    return `${arrDate.getFullYear()}-${arrMonth}-${arrDay} ${arrHours}:${arrMinutes}`;
  } catch {
    return departureTimeStr;
  }
}
