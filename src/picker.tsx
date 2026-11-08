import { Field } from './ui';
export function Picker({ label, value, onChange, mode }: { label: string; value: string; onChange: (v: string) => void; mode: 'date' | 'time'; timezone: string }) {
  return <Field label={label} value={value} onChangeText={onChange} placeholder={mode === 'date' ? 'YYYY-MM-DD' : 'HH:MM'} />;
}
