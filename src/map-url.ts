import { PlanLocation } from './model';
import { placesOrigin } from './places-provider';
export function mapUrl(point: PlanLocation) {
  const query = new URLSearchParams({ lat: String(point.latitude), lng: String(point.longitude) });
  if (point.placeId) query.set('id', point.placeId);
  return placesOrigin + '/map?' + query;
}
