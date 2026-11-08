import { PlanLocation } from './model';
import { Text } from 'react-native';
import { s } from './ui';
export function LiveMap({ point }: { point: PlanLocation }) {
  return <Text style={s.body}>Map center: {point.name}</Text>;
}
