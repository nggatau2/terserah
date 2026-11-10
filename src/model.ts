import { areas, distance, places, Point } from './planner';

export type Participant = { id: string; name: string; interests: string[] };
export type PlanLocation = Point & { name: string; placeId?: string };
export const categories = ['Cafe', 'Restaurant', 'Activity', 'Entertainment', 'Outdoor'] as const;
export type Category = typeof categories[number];
export type Destination = Point & {
  placeId: string; name: string; category: Category; tags: string[];
  distanceKm?: number; arrivalTime?: string; google?: boolean; osm?: boolean; unavailable?: boolean;
  photoUrl?: string; attributions?: { name: string; uri?: string }[];
};
export type Schedule = { scheduledDate: string; startTime: string; endTime: string; timezone: string };
export type Draft = Schedule & {
  mode: 'plan_ahead' | 'quick_discovery'; participants: Participant[];
  location?: PlanLocation; destinations: Destination[]; editingId?: string;
};
export type Plan = Draft & {
  id: string; name: string; status: 'planned' | 'completed' | 'archived';
  createdAt: string; updatedAt: string;
};
export const sampleAreas = [...areas, { name: 'Senopati', latitude: -6.233, longitude: 106.811 }];
const tags = {
  Food: ['Food', 'Japanese Food', 'Fine Dining'], Coffee: ['Coffee', 'Desserts'],
  Art: ['Art'], Outdoors: ['Nature', 'Outdoors'], Games: ['Games', 'Movies'],
};
const group = { Food: 'Restaurant', Coffee: 'Cafe', Art: 'Activity', Outdoors: 'Outdoor', Games: 'Entertainment' } as const;
export const samplePlaces: Destination[] = places.map(p => ({
  latitude: p.latitude, longitude: p.longitude, placeId: p.id,
  name: p.name, category: group[p.category], tags: tags[p.category],
}));
export const emptySchedule: Schedule = { scheduledDate: '', startTime: '', endTime: '', timezone: 'Asia/Jakarta' };
export function newDraft(mode: Draft['mode']): Draft {
  return { mode, ...emptySchedule, participants: mode === 'plan_ahead' ? [
    { id: '1', name: '', interests: [] }, { id: '2', name: '', interests: [] },
  ] : [], destinations: [] };
}
export function matchingInterests(p: Destination, people: Participant[]) {
  const vocabulary = [p.category, ...p.tags].map(t => t.toLowerCase());
  return [...new Set(people.flatMap(person => person.interests.map(i => i.toLowerCase())))]
    .filter(i => vocabulary.includes(i));
}
export function rankPlaces(list: Destination[], center: Point, radius: number, people: Participant[]) {
  const score = (p: Destination) => {
    const matches = matchingInterests(p, people);
    const support = matches.map(tag => people.filter(person => person.interests.some(i => i.toLowerCase() === tag)).length);
    return { shared: Math.max(0, ...support), people: people.filter(person => matchingInterests(p, [person]).length).length };
  };
  return list.map(p => ({ ...p, distanceKm: distance(center, p) }))
    .filter(p => p.distanceKm <= radius)
    .sort((a, b) => score(b).shared - score(a).shared || score(b).people - score(a).people || a.distanceKm - b.distanceKm);
}
export const validTime = (value: string) => /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
export function scheduleError(s: Schedule, required: boolean) {
  try { new Intl.DateTimeFormat('en', { timeZone: s.timezone }); }
  catch { return 'Enter a timezone such as Asia/Jakarta.'; }
  if (!s.timezone) return 'Enter a timezone.';
  if (!required && !s.scheduledDate && !s.startTime && !s.endTime) return '';
  const date = new Date(s.scheduledDate + 'T00:00:00Z');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s.scheduledDate) || !Number.isFinite(+date) || date.toISOString().slice(0, 10) !== s.scheduledDate) return 'Choose a valid date.';
  if (!validTime(s.startTime)) return 'Choose a start time.';
  if (s.endTime && (!validTime(s.endTime) || s.endTime <= s.startTime)) return 'Choose an end time after the start on the same day.';
  return '';
}
export function forStorage(plan: Plan): Plan {
  // Google place IDs can be stored. Venue details are retrieved when a plan opens.
  const location = plan.location?.placeId ? { placeId: plan.location.placeId, name: 'Saved Google area', latitude: 0, longitude: 0 } : plan.location;
  const destinations = plan.destinations.map(p => p.google ? {
    placeId: p.placeId, google: true, name: 'Saved Google place', category: 'Activity' as const,
    latitude: 0, longitude: 0, tags: [], arrivalTime: p.arrivalTime,
  } : p);
  return { ...plan, location, destinations };
}
