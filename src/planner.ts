export type Point = { latitude: number; longitude: number };
export const interests = ['Food', 'Coffee', 'Outdoors', 'Art', 'Games'] as const;
export type Interest = typeof interests[number];
export type Person = { id: number; name: string; interests: Interest[] };
export const areas = [
  { name: 'Menteng', latitude: -6.195, longitude: 106.838 },
  { name: 'Kemang', latitude: -6.26, longitude: 106.813 },
  { name: 'Kota Tua', latitude: -6.135, longitude: 106.813 },
];
export type Place = Point & { id: string; name: string; category: Interest; description: string };
const names = ['Garden Table', 'Little Roastery', 'Pocket Park', 'Color Studio', 'Board & Together', 'Noodle Corner', 'Cloud Cafe', 'Riverside Walk', 'Paper Gallery', 'Playroom', 'Sunset Kitchen', 'Slow Coffee'];
export const places: Place[] = areas.flatMap((area, a) => names.map((name, i) => ({
  id: `${a}-${i}`, name: `${name} · ${area.name}`, category: interests[i % 5],
  description: ['A relaxed bite and time to catch up.', 'Something warm, something sweet.', 'A little fresh air together.', 'Make room for a little creativity.', 'A little friendly competition.'][i % 5],
  latitude: area.latitude + Math.cos(i * 2.4) * (0.004 + i * 0.0025),
  longitude: area.longitude + Math.sin(i * 2.4) * (0.004 + i * 0.0025),
})));
export function distance(a: Point, b: Point) {
  const rad = (n: number) => n * Math.PI / 180;
  const x = Math.sin(rad(b.latitude - a.latitude) / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(rad(b.longitude - a.longitude) / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}
export function recommendations(center: Point, radius: number, people: Person[]) {
  const score = (p: Place) => people.reduce((n, person) => n + (person.interests.includes(p.category) ? 1 : 0), 0);
  return places.filter(p => distance(center, p) <= radius).sort((a, b) => score(b) - score(a) || distance(center, a) - distance(center, b));
}
export function randomPlace<T extends { id: string }>(candidates: T[], selected: string[], current?: string, random = Math.random) {
  const available = candidates.filter(p => !selected.includes(p.id) && p.id !== current);
  return available.length ? available[Math.floor(random() * available.length)] : undefined;
}
