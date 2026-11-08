import { Destination, Plan, PlanLocation, sampleAreas, samplePlaces } from './model';
import { Point, distance } from './planner';

export const placesOrigin = process.env.EXPO_PUBLIC_PLACES_URL?.replace(/\/$/, '');
export const googleEnabled = Boolean(placesOrigin);
export type Suggestion = { name: string; placeId: string };
async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  signal?.addEventListener('abort', abort, { once: true });
  if (signal?.aborted) abort();
  const timer = setTimeout(abort, 10000);
  try {
    const response = await fetch(placesOrigin + path, { signal: controller.signal });
    if (!response.ok) throw new Error('Google Places is temporarily unavailable. Please try again.');
    return await response.json() as T;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);
  }
}
export async function suggest(input: string, signal: AbortSignal): Promise<Suggestion[]> {
  return request('/autocomplete?q=' + encodeURIComponent(input), signal);
}
export function sampleSuggestions(query: string): PlanLocation[] {
  const q = query.trim().toLowerCase();
  const options = [...sampleAreas, ...samplePlaces.map(({ name, latitude, longitude }) => ({ name, latitude, longitude }))];
  return q ? options.filter(p => p.name.toLowerCase().includes(q)).slice(0, 8) : sampleAreas;
}
export function lookup(placeId: string): Promise<Destination> {
  return request('/place?id=' + encodeURIComponent(placeId));
}
export async function nearby(point: Point, radius: number, signal: AbortSignal): Promise<Destination[]> {
  if (!googleEnabled) return samplePlaces;
  return request('/nearby?lat=' + point.latitude + '&lng=' + point.longitude + '&radius=' + radius, signal);
}
export async function hydrate(plan: Plan): Promise<Plan> {
  if (!googleEnabled) return plan;
  const area = plan.location;
  const locationPromise = area?.placeId ? lookup(area.placeId)
    .then(p => ({ name: p.name, latitude: p.latitude, longitude: p.longitude, placeId: p.placeId }))
    .catch(() => area) : Promise.resolve(area);
  const destinationPromise = Promise.all(plan.destinations.map(p => p.google ? lookup(p.placeId)
    .then(details => ({ ...details, arrivalTime: p.arrivalTime }))
    .catch(() => ({ ...p, unavailable: true })) : p));
  const [location, destinations] = await Promise.all([locationPromise, destinationPromise]);
  return { ...plan, location, destinations: destinations.map(p => p.google && !p.unavailable && location && location.name !== 'Saved Google area'
    ? { ...p, distanceKm: distance(location, p) } : p) };
}
