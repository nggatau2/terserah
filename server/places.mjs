import { createServer } from 'node:http';
import { Buffer } from 'node:buffer';
import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

const apiKey = process.env.GOOGLE_PLACES_KEY;
const embedKey = process.env.GOOGLE_MAPS_EMBED_KEY;
const accessCode = process.env.PLACES_ACCESS_CODE;
if (apiKey && !/^[A-Za-z0-9_-]{24,128}$/.test(accessCode ?? '')) {
  throw new Error('Set PLACES_ACCESS_CODE to a random, URL-safe code of at least 24 characters.');
}
const allowedOrigins = new Set((process.env.PLACES_ALLOWED_ORIGINS || 'http://localhost:8081,http://127.0.0.1:8081').split(',').map(origin => origin.trim()));
const publicUrl = (process.env.PLACES_PUBLIC_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:8787').replace(/\/$/, '');
const digest = value => createHash('sha256').update(value).digest();
const accessDigest = accessCode && digest('Bearer ' + accessCode);
const photoSigningKey = randomBytes(32);
const photoLifetimeMs = 60 * 60 * 1000;

function photoSignature(ref, expires) {
  return createHmac('sha256', photoSigningKey).update('photo:' + expires + ':' + ref).digest('hex');
}

function photoUrl(ref) {
  const expires = String(Date.now() + photoLifetimeMs);
  return publicUrl + '/photo?' + new URLSearchParams({ ref, expires, signature: photoSignature(ref, expires) });
}
const placeIdPattern = /^[A-Za-z0-9_-]{1,500}$/;
const fields = 'id,displayName,location,primaryType,types,photos,attributions';
const categoryTypes = {
  Cafe: ['cafe', 'coffee_shop', 'dessert_shop', 'bakery', 'ice_cream_shop'],
  Restaurant: ['restaurant', 'japanese_restaurant', 'fine_dining_restaurant', 'bar'],
  Activity: ['art_gallery', 'museum', 'bowling_alley', 'tourist_attraction'],
  Entertainment: ['movie_theater', 'amusement_center', 'performing_arts_theater'],
  Outdoor: ['park', 'garden', 'hiking_area', 'botanical_garden'],
};
const tagTypes = {
  cafe: ['Coffee'], coffee_shop: ['Coffee'], dessert_shop: ['Desserts'], bakery: ['Desserts'],
  ice_cream_shop: ['Desserts'], restaurant: ['Food'], japanese_restaurant: ['Food', 'Japanese Food'],
  fine_dining_restaurant: ['Food', 'Fine Dining'], art_gallery: ['Art'], museum: ['Art', 'Culture'],
  movie_theater: ['Movies'], bowling_alley: ['Games'], amusement_center: ['Games'],
  park: ['Nature'], garden: ['Nature'], hiking_area: ['Nature'], botanical_garden: ['Nature'],
};

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(data));
}
async function google(path, mask, body) {
  const response = await fetch('https://places.googleapis.com/v1/' + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'X-Goog-Api-Key': apiKey, ...(mask ? { 'X-Goog-FieldMask': mask } : {}), 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error('Google request failed: ' + response.status);
  return response.json();
}
function destination(p) {
  const types = [p.primaryType, ...(p.types ?? [])].filter(Boolean);
  const category = types.map(type => Object.keys(categoryTypes).find(key => categoryTypes[key].includes(type))).find(Boolean) ?? 'Activity';
  const photo = p.photos?.[0];
  return {
    placeId: p.id, name: p.displayName?.text ?? 'Google place', category,
    latitude: p.location.latitude, longitude: p.location.longitude, google: true,
    tags: [...new Set(types.flatMap(t => tagTypes[t] ?? []))],
    photoUrl: photo?.name ? photoUrl(photo.name) : undefined,
    attributions: [
      ...(p.attributions ?? []).map(a => ({ name: a.provider, uri: a.providerUri })),
      ...(photo?.authorAttributions ?? []).map(a => ({ name: 'Photo: ' + a.displayName, uri: a.uri })),
      ...(photo?.googleMapsUri ? [{ name: 'View photo on Google Maps', uri: photo.googleMapsUri }] : []),
    ].filter(a => a.name),
  };
}

let active = 0;
let windowStart = Date.now();
let requests = 0;
const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (origin) {
    if (!allowedOrigins.has(origin)) return send(res, 403, { error: 'Origin not allowed' });
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  if (req.method === 'OPTIONS' && origin) {
    res.writeHead(204, { 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Authorization' });
    return res.end();
  }
  if (req.method !== 'GET') return send(res, 405, { error: 'Use GET' });
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/health') return send(res, apiKey ? 200 : 503, { ready: Boolean(apiKey) });
  const id = url.searchParams.get('id') ?? '';
  const lat = Number(url.searchParams.get('lat'));
  const lng = Number(url.searchParams.get('lng'));
  const pointValid = Boolean(url.searchParams.get('lat') && url.searchParams.get('lng')) &&
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
  if (url.pathname === '/map') {
    if (!embedKey) return send(res, 503, { error: 'Maps Embed is not configured' });
    if (!pointValid || (id && !placeIdPattern.test(id))) return send(res, 400, { error: 'Invalid map center' });
    const center = lat + ',' + lng;
    const params = new URLSearchParams({ key: embedKey, center, zoom: '14' });
    if (id) params.set('q', 'place_id:' + id);
    const map = 'https://www.google.com/maps/embed/v1/' + (id ? 'place' : 'view') + '?' + params.toString().replaceAll('&', '&amp;');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Content-Security-Policy': "default-src 'none'; frame-src https://www.google.com; style-src 'unsafe-inline'" });
    return res.end('<!doctype html><html lang="en"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Google Map</title><iframe title="Google Map" style="position:fixed;inset:0;width:100%;height:100%;border:0" referrerpolicy="strict-origin-when-cross-origin" src="' + map + '"></iframe></html>');
  }
  if (!['/access', '/autocomplete', '/place', '/nearby', '/photo'].includes(url.pathname)) return send(res, 404, { error: 'Unknown route' });
  if (!apiKey) return send(res, 503, { error: 'Google Places is not configured' });
  if (url.pathname !== '/photo') {
    if (!timingSafeEqual(accessDigest, digest(req.headers.authorization ?? ''))) return send(res, 401, { error: 'Places access code required' });
    if (url.pathname === '/access') return send(res, 200, { ready: true });
  }
  if (Date.now() - windowStart > 60000) { windowStart = Date.now(); requests = 0; }
  if (active >= 24 || requests >= 180) return send(res, 429, { error: 'Too many requests' });
  requests++;
  active++;
  try {
    if (url.pathname === '/autocomplete') {
      const input = url.searchParams.get('q')?.trim() ?? '';
      if (input.length < 2 || input.length > 120) return send(res, 400, { error: 'Invalid query' });
      const data = await google('places:autocomplete', 'suggestions.placePrediction.placeId,suggestions.placePrediction.text', { input });
      return send(res, 200, (data.suggestions ?? []).flatMap(({ placePrediction: p }) => p?.placeId && p.text?.text
        ? [{ placeId: p.placeId, name: p.text.text }] : []));
    }
    if (url.pathname === '/place') {
      if (!placeIdPattern.test(id)) return send(res, 400, { error: 'Invalid place ID' });
      const p = await google('places/' + id, fields);
      return send(res, 200, destination(p));
    }
    if (url.pathname === '/nearby') {
      const radius = Number(url.searchParams.get('radius'));
      if (!pointValid || ![3, 5].includes(radius)) return send(res, 400, { error: 'Invalid location or radius' });
      const data = await google('places:searchNearby', fields.split(',').map(f => 'places.' + f).join(','), {
        includedTypes: Object.values(categoryTypes).flat(), maxResultCount: 20, rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: radius * 1000 } },
      });
      return send(res, 200, (data.places ?? []).filter(p => p.id && p.location).map(destination));
    }
    const ref = url.searchParams.get('ref') ?? '';
    if (!/^places\/[A-Za-z0-9_-]{1,500}\/photos\/[A-Za-z0-9_-]{1,1500}$/.test(ref)) return send(res, 400, { error: 'Invalid photo reference' });
    const expires = url.searchParams.get('expires') ?? '';
    const signature = url.searchParams.get('signature') ?? '';
    const now = Date.now();
    if (!/^\d{13}$/.test(expires) || Number(expires) <= now || Number(expires) > now + photoLifetimeMs ||
        !/^[a-f0-9]{64}$/.test(signature) || !timingSafeEqual(Buffer.from(signature, 'hex'), Buffer.from(photoSignature(ref, expires), 'hex'))) {
      return send(res, 401, { error: 'Photo link expired or invalid' });
    }
    const photo = await google(ref + '/media?maxWidthPx=480&skipHttpRedirect=true');
    if (typeof photo.photoUri !== 'string' || !photo.photoUri.startsWith('https://')) throw new Error('Invalid Google photo response');
    res.writeHead(302, { Location: photo.photoUri });
    res.end();
  } catch {
    send(res, 502, { error: 'Google request failed' });
  } finally {
    active--;
  }
});
const port = Number(process.env.PLACES_PORT ?? process.env.PORT ?? 8787);
server.listen(port, process.env.PLACES_HOST ?? '127.0.0.1', () => console.log('TERSRH Places bridge listening on port ' + port));
