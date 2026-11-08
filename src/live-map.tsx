import { PlanLocation } from './model';
import { Text } from 'react-native';
import { s } from './ui';
export { googleEnabled as liveMapAvailable } from './places-provider';
export function LiveMap({ point }: { point: PlanLocation }) {
  return <Text style={s.body}>Map center: {point.name}</Text>;
}
