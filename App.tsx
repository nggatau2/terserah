import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Location from 'expo-location';
import { areas, distance, interests, Person, Place, Point, randomPlace, recommendations } from './src/planner';

type ButtonProps = { label: string; onPress: () => void; disabled?: boolean; primary?: boolean };
function Button({ label, onPress, disabled = false, primary = false }: ButtonProps) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.button, primary && styles.primary, disabled && { opacity: 0.4 }]}><Text style={[styles.buttonText, primary && { color: 'white' }]}>{label}</Text></Pressable>;
}
export default function App() {
  const [mode, setMode] = useState<'advance' | 'quick'>('advance');
  const [area, setArea] = useState(0);
  const [gps, setGps] = useState<Point | null>(null);
  const [demo, setDemo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [people, setPeople] = useState<Person[]>([{ id: 1, name: 'You', interests: ['Food', 'Coffee'] }, { id: 2, name: 'Your person', interests: ['Art', 'Outdoors'] }]);
  const [slots, setSlots] = useState<(Place | null)[]>([null, null, null]);
  const [editing, setEditing] = useState<number | null>(null);
  const [review, setReview] = useState(false);
  const center = mode === 'advance' ? areas[area] : demo ? areas[0] : gps;
  const radius = mode === 'advance' ? 3 : 5;
  const candidates = useMemo(() => center ? recommendations(center, radius, people) : [], [center, radius, people]);
  const selected = slots.filter((p): p is Place => !!p);
  function reset() { setSlots([null, null, null]); setEditing(null); setReview(false); setMessage(''); }
  function update(next: (Place | null)[]) { setSlots(next); setReview(false); }
  function shuffle(index: number) {
    const p = randomPlace(candidates, selected.map(p => p.id), slots[index]?.id);
    if (!p) { setMessage('No other places available here. Try another area or remove a stop.'); return; }
    update(slots.map((s, i) => i === index ? p : s)); setMessage('');
  }
  function shuffleAll() {
    if (!candidates.length) { setMessage('Choose a demo area or get your location first.'); return; }
    if (!slots.length) { setMessage('Add a destination slot first.'); return; }
    const chosen: Place[] = [];
    slots.forEach(() => { const p = randomPlace(candidates, chosen.map(p => p.id)); if (p) chosen.push(p); });
    update(slots.map((_, i) => chosen[i] ?? null)); setMessage('');
  }
  async function locate() {
    setBusy(true); setMessage('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') { setMessage('Location permission was declined. You can still use demo discovery.'); return; }
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('Location timed out. Try outdoors or use demo discovery.')), 15000); }),
      ]);
      setGps(result.coords); setDemo(false); reset();
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Could not get location. Try demo discovery.'); }
    finally { clearTimeout(timer); setBusy(false); }
  }
  return <View style={styles.screen}><StatusBar style="dark" /><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <View style={styles.header}><Text style={styles.brand}>TeRSeraH<Text style={{ color: '#db624b' }}> ♥</Text></Text><Text style={styles.eyebrow}>LESS “UP TO YOU.” MORE US.</Text></View>
    <Text style={styles.title}>A little plan.{'\n'}A lovely day.</Text><Text style={styles.subtitle}>Find your next bite, adventure, or excuse to spend time together.</Text>
    <View style={styles.notice}><Text style={styles.small}>SAMPLE EDITION · Fictional places in Jakarta. No bookings or live venue information.</Text></View>
    <View style={styles.row}>{(['advance', 'quick'] as const).map(m => <Button key={m} primary={mode === m} label={m === 'advance' ? 'Plan ahead · 3 km' : 'Quick discovery · 5 km'} onPress={() => { setMode(m); reset(); }} />)}</View>
    <View style={styles.card}><Text style={styles.heading}>01  Where shall we go?</Text>
      {mode === 'advance' ? <><Text style={styles.body}>Pick an area for a future date. Distances are measured from its center.</Text><View style={styles.row}>{areas.map((a, i) => <Button key={a.name} label={a.name} primary={area === i} onPress={() => { setArea(i); reset(); }} />)}</View></> : <><Text style={styles.body}>Find sample places within 5 km of your GPS location. Outside the sample areas, results may be empty.</Text><View style={styles.row}><Button label={busy ? 'Finding you…' : 'Use my location'} disabled={busy} onPress={locate} primary /><Button label="Try Menteng demo" disabled={busy} onPress={() => { setDemo(true); reset(); }} /></View><Text style={styles.small}>{demo ? 'Demo location: Menteng (GPS is not used)' : gps ? 'Using your GPS location · kept in memory only' : 'Location has not been requested.'}</Text></>}
    </View>
    <View style={styles.card}><Text style={styles.heading}>02  Make it your kind of date</Text><Text style={styles.body}>Tap each person’s interests. Places liked by more people appear first; all nearby places stay available.</Text>
      {people.map(person => <View key={person.id} style={styles.person}><View style={styles.row}><TextInput accessibilityLabel={`Name for person ${person.id}`} value={person.name} maxLength={30} placeholder="Name" onChangeText={name => setPeople(people.map(p => p.id === person.id ? { ...p, name } : p))} style={styles.input} />{people.length > 1 && <Button label={`Remove person ${person.id}`} onPress={() => setPeople(people.filter(p => p.id !== person.id))} />}</View><View style={styles.row}>{interests.map(interest => <Button key={interest} label={interest} primary={person.interests.includes(interest)} onPress={() => setPeople(people.map(p => p.id !== person.id ? p : { ...p, interests: p.interests.includes(interest) ? p.interests.filter(x => x !== interest) : [...p.interests, interest] }))} />)}</View></View>)}
      <Button label="+ Add person" onPress={() => setPeople([...people, { id: Math.max(...people.map(p => p.id)) + 1, name: `Person ${people.length + 1}`, interests: [] }])} />
    </View>
    <View style={styles.section}><Text style={styles.heading}>03  Your date, your stops</Text><Text style={styles.body}>{selected.length} chosen · up to 5 stops · {candidates.length} nearby sample places</Text><Button label="Surprise us · fill all slots" onPress={shuffleAll} primary /></View>
    {message ? <Text accessibilityRole="alert" style={styles.message}>{message}</Text> : null}
    {center && !candidates.length && <Text style={styles.message}>No sample places within {radius} km. Try Menteng demo or a different sample area.</Text>}
    {slots.map((place, i) => <View key={i} style={styles.card}><View style={styles.row}><Text style={styles.number}>{String(i + 1).padStart(2, '0')}</Text><Text style={styles.heading}>{place ? place.category : 'An open possibility'}</Text></View><Text style={styles.place}>{place?.name ?? 'Pick a place together'}</Text><Text style={styles.body}>{place ? `${place.description} ${center ? distance(center, place).toFixed(1) : '?'} km from search center.` : 'Choose from the nearby list or let fate decide.'}</Text><View style={styles.row}><Button label={`Choose stop ${i + 1}`} onPress={() => setEditing(editing === i ? null : i)} /><Button label={`Shuffle stop ${i + 1}`} disabled={!candidates.length} onPress={() => shuffle(i)} /><Button label={`Remove stop ${i + 1}`} onPress={() => { update(slots.filter((_, n) => n !== i)); setEditing(null); }} /></View>
      {editing === i && <View style={styles.choices}><Text style={styles.small}>NEARBY · ORDERED BY SHARED INTERESTS</Text>{!candidates.length && <Text style={styles.body}>No sample places here. Try another area or Menteng demo.</Text>}{candidates.filter(p => !selected.some(s => s.id === p.id) || p.id === place?.id).map(p => <Pressable accessibilityRole="button" key={p.id} onPress={() => { update(slots.map((s, n) => n === i ? p : s)); setEditing(null); }} style={styles.choice}><Text style={styles.buttonText}>{p.name}</Text><Text style={styles.small}>{p.category} · {center && distance(center, p).toFixed(1)} km · liked by {people.filter(person => person.interests.includes(p.category)).length}</Text></Pressable>)}</View>}
    </View>)}
    <Button label={slots.length === 5 ? 'All 5 slots added' : '+ Add destination slot'} disabled={slots.length >= 5} onPress={() => update([...slots, null])} />
    <Button label="Review our date" disabled={!selected.length} primary onPress={() => { setReview(true); setEditing(null); }} />
    {review && <View style={styles.card}><Text style={styles.heading}>It’s a date ♥</Text><Text style={styles.body}>{people.map(p => p.name.trim() || 'Someone special').join(' + ')}</Text>{selected.map((p, i) => <Text key={p.id} style={styles.body}>{i + 1}. {p.name}</Text>)}<Text style={styles.small}>Plan stays here while the app is open. Distances are straight-line, not travel distances. Check actual venues and opening hours before going.</Text></View>}
    <Text style={styles.footer}>Made for the moments between “where?” and “let’s go.”</Text>
  </ScrollView></View>;
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#f8f5ee' }, page: { padding: 22, paddingTop: 54, paddingBottom: 45, maxWidth: 720, width: '100%', alignSelf: 'center', gap: 14 }, header: { marginBottom: 10 }, brand: { fontSize: 28, fontWeight: '900', color: '#233c31' }, eyebrow: { fontSize: 10, letterSpacing: 2, color: '#627366', marginTop: 6 }, title: { fontSize: 42, lineHeight: 46, fontWeight: '800', color: '#233c31' }, subtitle: { fontSize: 16, lineHeight: 24, color: '#627366', marginBottom: 6 }, notice: { backgroundColor: '#ede6d5', padding: 13, borderRadius: 12 }, card: { backgroundColor: '#fffefa', padding: 18, borderRadius: 20, borderWidth: 1, borderColor: '#e5e7db', gap: 12 }, heading: { fontSize: 16, fontWeight: '700', color: '#233c31', flexShrink: 1 }, body: { fontSize: 14, color: '#627366', lineHeight: 21 }, small: { fontSize: 12, color: '#647064', lineHeight: 18 }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }, button: { paddingHorizontal: 14, paddingVertical: 12, backgroundColor: '#edf0e6', borderRadius: 13, minHeight: 44 }, primary: { backgroundColor: '#294d3e' }, buttonText: { color: '#294d3e', fontSize: 13, fontWeight: '600' }, person: { gap: 10, paddingBottom: 12, borderBottomWidth: 1, borderColor: '#eceee4' }, input: { backgroundColor: '#f4f3eb', borderRadius: 10, padding: 12, fontSize: 16, color: '#233c31', minWidth: 130, flex: 1 }, section: { gap: 10, marginTop: 12 }, number: { color: '#b0523d', fontSize: 22, fontWeight: '800' }, place: { fontSize: 22, fontWeight: '700', color: '#233c31' }, choices: { gap: 10, paddingTop: 8 }, choice: { paddingVertical: 14, borderTopWidth: 1, borderColor: '#e5e7db', gap: 4 }, message: { color: '#983b27', lineHeight: 21 }, footer: { textAlign: 'center', color: '#627366', fontSize: 12, lineHeight: 20, marginTop: 12 },
});
