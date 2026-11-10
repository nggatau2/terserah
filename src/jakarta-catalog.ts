import catalog from './data/jakarta.json';
import { sampleAreas, type Category, type Destination, type PlanLocation } from './model';

export const jakartaPlaces: Destination[] = catalog.venues.map(venue => ({
  ...venue, category: venue.category as Category, osm: true,
}));

// Keep the app's familiar starting areas ahead of the full neighbourhood index.
export const jakartaAreas: PlanLocation[] = sampleAreas;
const featuredNames = new Set(jakartaAreas.map(area => area.name.toLowerCase()));
const allAreas = [...jakartaAreas, ...catalog.neighbourhoods.filter(area => !featuredNames.has(area.name.toLowerCase()))];

export function jakartaSuggestions(query: string): PlanLocation[] {
  const search = query.trim().toLowerCase();
  if (!search) return jakartaAreas;
  const matches = (place: PlanLocation) => place.name.toLowerCase().includes(search);
  const areas = allAreas.filter(matches);
  if (areas.length >= 8) return areas.slice(0, 8);
  const venues = jakartaPlaces.filter(matches).slice(0, 8 - areas.length);
  return [...areas, ...venues.map(({ name, latitude, longitude }) => ({ name, latitude, longitude }))];
}
