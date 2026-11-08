import { View } from 'react-native';
import { Schedule } from './model';
import { Picker } from './picker';
import { Button, Field, s } from './ui';
export function ScheduleFields({ value, change }: { value: Schedule; change: (patch: Partial<Schedule>) => void }) {
  return <View style={{ gap: 13 }}>
    <Picker mode="date" label="Date" timezone={value.timezone} value={value.scheduledDate} onChange={scheduledDate => change({ scheduledDate })} />
    <Picker mode="time" label="Start time" timezone={value.timezone} value={value.startTime} onChange={startTime => change({ startTime })} />
    <Picker mode="time" label="End time (optional)" timezone={value.timezone} value={value.endTime} onChange={endTime => change({ endTime })} />
    <Field label="Timezone" value={value.timezone} onChangeText={timezone => change({ timezone })} autoCapitalize="none" placeholder="Asia/Jakarta" />
    {!!value.endTime && <View style={s.row}><Button label="Clear end time" onPress={() => change({ endTime: '' })} secondary /></View>}
  </View>;
}
