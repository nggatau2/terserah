import { WebView } from 'react-native-webview';
import { View } from 'react-native';
import { PlanLocation } from './model';
import { mapUrl } from './map-url';
export function LiveMap({ point }: { point: PlanLocation }) {
  return <View style={{ height: 245, overflow: 'hidden', borderRadius: 20 }}>
    <WebView accessibilityLabel="Interactive Google Map" source={{ uri: mapUrl(point) }} />
  </View>;
}
