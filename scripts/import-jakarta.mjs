import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { argv } from 'node:process';

const input = argv[2];
if (!input) throw new Error('Usage: node scripts/import-jakarta.mjs <overpass-response.json>');
const raw = JSON.parse(await readFile(input, 'utf8'));
const asOf = raw.osm3s?.timestamp_osm_base?.slice(0, 10);
if (raw.remark || !asOf || !Array.isArray(raw.elements)) {
  throw new Error('The OpenStreetMap response is incomplete. The catalog was not changed.');
}

const classifications = {
  cafe: ['Cafe', 'Coffee'], restaurant: ['Restaurant', 'Food'],
  cinema: ['Entertainment', 'Movies'], theatre: ['Entertainment', 'Theatre'],
  arts_centre: ['Activity', 'Art'], bowling_alley: ['Activity', 'Games'],
  museum: ['Activity', 'Culture'], gallery: ['Activity', 'Art'], zoo: ['Activity', 'Nature'],
  aquarium: ['Activity', 'Nature'], theme_park: ['Entertainment', 'Games'],
  park: ['Outdoor', 'Nature', 'Outdoors'], garden: ['Outdoor', 'Nature', 'Outdoors'],
  water_park: ['Entertainment', 'Swimming'], escape_game: ['Activity', 'Games'],
  miniature_golf: ['Activity', 'Games'],
};
const neighbourhoods = new Map();
const venues = [];
const duplicates = new Map();

for (const element of raw.elements) {
  const tags = element.tags ?? {};
  const name = tags.name?.trim().replace(/\s+/g, ' ');
  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  if (!name || !Number.isFinite(latitude) || !Number.isFinite(longitude)) continue;
  const point = { name, latitude: Number(latitude.toFixed(6)), longitude: Number(longitude.toFixed(6)) };
  if (tags.place) {
    neighbourhoods.set(name.toLowerCase(), point);
    continue;
  }
  const match = [tags.amenity, tags.tourism, tags.leisure].find(tag => Object.hasOwn(classifications, tag));
  if (!match || ['private', 'no', 'customers'].includes(tags.access) && match === 'garden') continue;
  if (tags.access === 'private' || tags.access === 'no' || tags.disused === 'yes' || tags.abandoned === 'yes') continue;
  const [category, ...interests] = classifications[match];
  if (tags.cuisine?.split(';').includes('japanese')) interests.push('Japanese Food');
  const identity = category + ':' + name.toLowerCase();
  const existing = duplicates.get(identity) ?? [];
  if (existing.some(p => Math.hypot(p.latitude - latitude, p.longitude - longitude) < 0.00025)) continue;
  existing.push(point);
  duplicates.set(identity, existing);
  venues.push({ ...point, placeId: 'osm-' + element.type + '-' + element.id, category, tags: interests });
}

if (venues.length < 300 || neighbourhoods.size < 20) {
  throw new Error('The OpenStreetMap response is too small for Jakarta. The catalog was not changed.');
}
const byName = (a, b) => a.name.localeCompare(b.name) || a.latitude - b.latitude || a.longitude - b.longitude;
const rows = list => list.sort(byName).map(p => '    ' + JSON.stringify(p)).join(',\n');
const target = new URL('../src/data/', import.meta.url);
await mkdir(target, { recursive: true });
await writeFile(new URL('jakarta.json', target),
  '{\n  "license": "ODbL-1.0",\n  "source": "OpenStreetMap contributors",\n  "asOf": ' + JSON.stringify(asOf) +
  ',\n  "neighbourhoods": [\n' + rows([...neighbourhoods.values()]) + '\n  ],\n  "venues": [\n' + rows(venues) + '\n  ]\n}\n');
console.log('Imported ' + venues.length + ' venues and ' + neighbourhoods.size + ' areas from ' + asOf);
