import { useState, useCallback } from 'react';

/**
 * useLocation — detects user's GPS location and reverse-geocodes to city/country.
 * Uses the free BigDataCloud API (no key required).
 */
export function useLocation() {
  const [location, setLocation] = useState({
    city: null,
    country: null,
    lat: null,
    lng: null,
    loading: false,
    error: null,
    granted: false,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({ ...prev, error: 'Geolocation not supported by your browser.' }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        try {
          const res = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
          );
          const data = await res.json();
          setLocation({
            city: data.city || data.locality || data.principalSubdivision || 'Unknown City',
            country: data.countryName || '',
            lat,
            lng,
            loading: false,
            error: null,
            granted: true,
          });
        } catch {
          setLocation({
            city: 'Your Location',
            country: '',
            lat,
            lng,
            loading: false,
            error: null,
            granted: true,
          });
        }
      },
      (err) => {
        let msg = 'Location access denied.';
        if (err.code === 1) msg = 'Permission denied. Please allow location access.';
        if (err.code === 2) msg = 'Location unavailable.';
        if (err.code === 3) msg = 'Location request timed out.';
        setLocation(prev => ({ ...prev, loading: false, error: msg, granted: false }));
      },
      { timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { ...location, requestLocation };
}

export default useLocation;
