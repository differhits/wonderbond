// City coordinates lookup dictionary with fallback
export const CITY_COORDINATES = {
  // India
  'mumbai': { lat: 19.0760, lng: 72.8777, country: 'India' },
  'delhi': { lat: 28.6139, lng: 77.2090, country: 'India' },
  'new delhi': { lat: 28.6139, lng: 77.2090, country: 'India' },
  'bangalore': { lat: 12.9716, lng: 77.5946, country: 'India' },
  'bengaluru': { lat: 12.9716, lng: 77.5946, country: 'India' },
  'goa': { lat: 15.2993, lng: 74.1240, country: 'India' },
  'jaipur': { lat: 26.9124, lng: 75.7873, country: 'India' },
  'pune': { lat: 18.5204, lng: 73.8567, country: 'India' },
  'hyderabad': { lat: 17.3850, lng: 78.4867, country: 'India' },
  'ahmedabad': { lat: 23.0225, lng: 72.5714, country: 'India' },
  'kolkata': { lat: 22.5726, lng: 88.3639, country: 'India' },
  'varanasi': { lat: 25.3176, lng: 82.9739, country: 'India' },
  'chennai': { lat: 13.0827, lng: 80.2707, country: 'India' },
  'chandigarh': { lat: 30.7333, lng: 76.7794, country: 'India' },
  'indore': { lat: 22.7196, lng: 75.8577, country: 'India' },
  'agra': { lat: 27.1767, lng: 78.0081, country: 'India' },
  'manali': { lat: 32.2396, lng: 77.1887, country: 'India' },
  'rishikesh': { lat: 30.0869, lng: 78.2676, country: 'India' },
  'leh': { lat: 34.1526, lng: 77.5771, country: 'India' },
  'kerala': { lat: 10.8505, lng: 76.2711, country: 'India' },

  // International
  'bali': { lat: -8.4095, lng: 115.1889, country: 'Indonesia' },
  'tokyo': { lat: 35.6762, lng: 139.6503, country: 'Japan' },
  'kyoto': { lat: 35.0116, lng: 135.7681, country: 'Japan' },
  'bangkok': { lat: 13.7563, lng: 100.5018, country: 'Thailand' },
  'phuket': { lat: 7.8804, lng: 98.3923, country: 'Thailand' },
  'singapore': { lat: 1.3521, lng: 103.8198, country: 'Singapore' },
  'paris': { lat: 48.8566, lng: 2.3522, country: 'France' },
  'milan': { lat: 45.4642, lng: 9.1900, country: 'Italy' },
  'rome': { lat: 41.9028, lng: 12.4964, country: 'Italy' },
  'barcelona': { lat: 41.3879, lng: 2.1699, country: 'Spain' },
  'madrid': { lat: 40.4168, lng: -3.7038, country: 'Spain' },
  'dubai': { lat: 25.2048, lng: 55.2708, country: 'UAE' },
  'london': { lat: 51.5074, lng: -0.1278, country: 'UK' },
  'new york': { lat: 40.7128, lng: -74.0060, country: 'USA' },
  'toronto': { lat: 43.6532, lng: -79.3832, country: 'Canada' },
  'st. petersburg': { lat: 59.9343, lng: 30.3351, country: 'Russia' },
  'hanoi': { lat: 21.0285, lng: 105.8542, country: 'Vietnam' },
  'kathmandu': { lat: 27.7172, lng: 85.3240, country: 'Nepal' },
  'colombo': { lat: 6.9271, lng: 79.8612, country: 'Sri Lanka' },
};

// Returns { lat, lng } with a tiny jitter so multiple users in the same city don't completely overlap
export function getCityCoordinates(cityName, index = 0) {
  if (!cityName) return { lat: 20.5937, lng: 78.9629 }; // India center
  const key = cityName.toLowerCase().trim();
  let base = CITY_COORDINATES[key];

  if (!base) {
    // Check partial match
    for (const [k, v] of Object.entries(CITY_COORDINATES)) {
      if (key.includes(k) || k.includes(key)) {
        base = v;
        break;
      }
    }
  }

  if (!base) {
    // Deterministic pseudo-random lat/lng for unmapped places based on hash
    let hash = 0;
    for (let i = 0; i < key.length; i++) hash = key.charCodeAt(i) + ((hash << 5) - hash);
    const lat = 15 + (Math.abs(hash) % 25);
    const lng = 72 + ((Math.abs(hash) >> 2) % 30);
    base = { lat, lng };
  }

  // Add subtle offset for distinct pins
  const jitterLat = ((index % 5) - 2) * 0.015;
  const jitterLng = ((Math.floor(index / 5) % 5) - 2) * 0.015;

  return {
    lat: base.lat + jitterLat,
    lng: base.lng + jitterLng,
    country: base.country || '',
  };
}
