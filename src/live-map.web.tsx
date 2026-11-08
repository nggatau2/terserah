import { PlanLocation } from './model';
import { mapUrl } from './map-url';
export function LiveMap({ point }: { point: PlanLocation }) {
  return <iframe title="Interactive Google Map" src={mapUrl(point)}
    style={{ height: 245, width: '100%', border: 0, borderRadius: 20 }} />;
}
