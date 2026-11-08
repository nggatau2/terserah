import { View, Text } from 'react-native';
import { s, color } from './ui';
export function Picker({ label, value, onChange, mode }: { label: string; value: string; onChange: (v: string) => void; mode: 'date' | 'time'; timezone: string }) {
  return <View style={{ gap: 6 }}><Text style={s.label}>{label}</Text><input aria-label={label} type={mode} value={value}
    onChange={e => onChange(e.currentTarget.value)} style={{ minHeight: 46, width: '100%', boxSizing: 'border-box', padding: '8px 12px',
      borderRadius: 14, border: '1px solid ' + color.line, background: color.card, color: color.ink, fontSize: 16 }} /></View>;
}
