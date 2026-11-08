import { PlanLocation } from './model';
import { mapUrl } from './map-url';
import { googleEnabled } from './places-provider';

const embedKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_EMBED_KEY;
export const liveMapAvailable = Boolean(embedKey) || googleEnabled;

export function LiveMap({ point }: { point: PlanLocation }) {
  const params = new URLSearchParams({
    key: embedKey ?? '', center: [point.latitude, point.longitude].join(','), zoom: '14',
  });
  if (point.placeId) params.set('q', 'place_id:' + point.placeId);
  const mode = point.placeId ? 'place' : 'view';
  const url = embedKey ? 'https://www.google.com/maps/embed/v1/' + mode + '?' + params : mapUrl(point);
  return <iframe title="Interactive Google Map" src={url} referrerPolicy="strict-origin-when-cross-origin"
    style={{ height: 245, width: '100%', border: 0, borderRadius: 20 }} />;
}
