import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Text, View } from 'react-native';
import { Button, s } from './ui';
export function Picker({ label, value, onChange, mode }: { label: string; value: string; onChange: (v: string) => void; mode: 'date' | 'time'; timezone: string }) {
  const open = () => {
    // The picker selects wall-clock values. The itinerary stores its timezone separately.
    const initial = mode === 'date' ? new Date(value + 'T12:00:00') : new Date('2000-01-01T' + value + ':00');
    DateTimePickerAndroid.open({ mode, value: Number.isFinite(+initial) ? initial : new Date(), is24Hour: true,
      onValueChange: (_, date) => {
        const pad = (n: number) => String(n).padStart(2, '0');
        onChange(mode === 'date'
          ? [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())].join('-')
          : [pad(date.getHours()), pad(date.getMinutes())].join(':'));
      },
    });
  };
  return <View style={{ gap: 6 }}><Text style={s.label}>{label}</Text><Button label={value || (mode === 'date' ? 'Choose date' : 'Choose time')} onPress={open} secondary /></View>;
}
