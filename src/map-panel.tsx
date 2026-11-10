import { Pressable, Text, View, StyleSheet } from 'react-native';
import { Destination, PlanLocation } from './model';
import { LiveMap, liveMapAvailable } from './live-map';
import { color, s } from './ui';

export function MapPanel({ center, places = [], chosen = [], onPress }: {
  center: PlanLocation; places?: Destination[]; chosen?: string[]; onPress?: (p: Destination) => void;
}) {
  if (liveMapAvailable) return <LiveMap point={center} />;
  return <View style={styles.map}>
    <View style={styles.park} /><View style={styles.road} /><View style={styles.road2} /><View style={styles.road3} />
    <Text style={styles.center}>◎</Text>
    {places.map(p => <Pressable key={p.placeId} accessibilityRole="button" accessibilityLabel={'Map marker: ' + p.name}
      onPress={() => onPress?.(p)} style={[styles.pin, {
        left: Math.max(5, Math.min(92, 48 + (p.longitude - center.longitude) * 900)) + '%',
        top: Math.max(10, Math.min(78, 46 - (p.latitude - center.latitude) * 900)) + '%',
        backgroundColor: chosen.includes(p.placeId) ? color.green : 'white',
      } as const]}><Text style={s.caption}>{chosen.includes(p.placeId) ? '✓' : '•'}</Text></Pressable>)}
    <View style={styles.label}><Text style={s.caption}>Area sketch · {center.name}</Text></View>
  </View>;
}
const styles = StyleSheet.create({
  map: { height: 216, backgroundColor: '#e4eddf', borderRadius: 20, overflow: 'hidden' },
  park: { position: 'absolute', width: '34%', height: '36%', top: '5%', left: '5%', backgroundColor: '#c8e2b7', borderRadius: 14, transform: [{ rotate: '-12deg' }] },
  road: { position: 'absolute', width: '130%', height: 14, top: '49%', left: '-10%', backgroundColor: 'white', transform: [{ rotate: '-16deg' }] },
  road2: { position: 'absolute', width: 13, height: '135%', top: '-10%', left: '48%', backgroundColor: '#fafff8', transform: [{ rotate: '21deg' }] },
  road3: { position: 'absolute', width: '120%', height: 7, top: '76%', left: '-10%', backgroundColor: '#fafff8', transform: [{ rotate: '9deg' }] },
  center: { position: 'absolute', left: '48%', top: '43%', color: color.darkGreen, fontSize: 24 },
  pin: { position: 'absolute', height: 25, width: 25, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderColor: color.darkGreen, borderWidth: 1 },
  label: { position: 'absolute', left: 9, bottom: 8, padding: 6, borderRadius: 6, backgroundColor: 'white' },
});
