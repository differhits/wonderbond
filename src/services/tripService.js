import { getToken } from './authService';
import { API_URLS } from './apiConfig';

const BASE = API_URLS.TRIPS;
const headers = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${getToken()}`,
});

export const getCommunityTripsAPI = async () => {
  const res = await fetch(`${BASE}/community`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch community trips');
  return res.json();
};

export const getMyTripsAPI = async () => {
  const res = await fetch(`${BASE}/mine`, { headers: headers() });
  if (!res.ok) throw new Error('Failed to fetch my trips');
  return res.json();
};

export const createTripAPI = async (tripData) => {
  const res = await fetch(`${BASE}`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(tripData),
  });
  if (!res.ok) throw new Error('Failed to create trip');
  return res.json();
};

export const deleteTripAPI = async (tripId) => {
  const res = await fetch(`${BASE}/${tripId}`, {
    method: 'DELETE',
    headers: headers(),
  });
  if (!res.ok) throw new Error('Failed to delete trip');
  return res.json();
};
