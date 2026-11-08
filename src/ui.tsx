import { router } from 'expo-router';
import { type ReactNode } from 'react';
import { Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Destination } from './model';
import { googleEnabled } from './places-provider';

export const color = { ink: '#111619', muted: '#4c5b65', green: '#36ed68', darkGreen: '#116630', card: '#eaf1f5', line: '#cbd9e0', red: '#f45055' };
export function Logo({ large = false }: { large?: boolean }) {
  return <View accessibilityLabel="TERSRH" accessible style={{ alignItems: 'center', paddingTop: large ? 24 : 0, paddingBottom: large ? 28 : 0 }}>
    <Text style={[s.logo, large && s.bigLogo, { color: color.green }]}>ter</Text>
    <Text style={[s.logo, large && s.bigLogo]}>srh</Text>
  </View>;
}
export function Button({ label, onPress, secondary, disabled, selected }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean; selected?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled, selected }} onPress={onPress} disabled={disabled}
    style={({ pressed }) => [s.button, secondary && s.secondary, (disabled || pressed) && { opacity: 0.55 }]}>
    <Text style={s.buttonText}>{label}</Text>
  </Pressable>;
}
export function Field({ label, ...props }: TextInputProps & { label: string }) {
  return <View style={{ gap: 6 }}><Text style={s.label}>{label}</Text>
    <TextInput accessibilityLabel={label} placeholderTextColor={color.muted} {...props} style={s.input} />
  </View>;
}
export function Shell({ children, footer, home, back }: { children: ReactNode; footer?: ReactNode; home?: boolean; back?: () => void }) {
  return <SafeAreaView style={s.safe}>
    {!home && <View style={s.header}>
      <Pressable accessibilityLabel="Back" accessibilityRole="button" onPress={back ?? (() => router.canGoBack() ? router.back() : router.replace('/'))} style={s.back}>
        <Text style={{ fontSize: 25, color: color.ink }}>←</Text>
      </Pressable>
      <Logo />
    </View>}
    <ScrollView style={{ flex: 1 }} contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">{children}</ScrollView>
    {footer && <View style={s.footer}>{footer}</View>}
  </SafeAreaView>;
}
export function Heading({ title, description }: { title: string; description?: string }) {
  return <View style={{ gap: 7 }}><Text accessibilityRole="header" style={s.heading}>{title}</Text>{description && <Text style={s.body}>{description}</Text>}</View>;
}
export function Message({ text }: { text: string }) {
  return text ? <Text accessibilityRole="alert" style={s.error}>{text}</Text> : null;
}
export function Sheet({ children, onClose }: { children: ReactNode; onClose: () => void }) {
  return <Modal transparent animationType="fade" visible onRequestClose={onClose}>
    <View style={s.overlay}><ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={s.modalScroll}>
      <View accessibilityViewIsModal style={s.modal}>{children}</View>
    </ScrollView></View>
  </Modal>;
}
const marks = { Cafe: '☕', Restaurant: '🍴', Activity: '✦', Entertainment: '🎬', Outdoor: '🌿' };
const washes = { Cafe: '#f7e7d8', Restaurant: '#fbe0d8', Activity: '#eae3f9', Entertainment: '#dfeaf8', Outdoor: '#dcefdc' };
export function PlaceCard({ place, selected, action, children }: { place: Destination; selected?: boolean; action?: () => void; children?: ReactNode }) {
  return <View style={s.card}>
    <View style={s.placeRow}>
      {place.photoUrl ? <Image accessibilityLabel={place.name + ' photo'} source={{ uri: place.photoUrl }} style={s.thumbnail} />
        : <View style={[s.thumbnail, { backgroundColor: washes[place.category], alignItems: 'center', justifyContent: 'center' }]}><Text style={{ fontSize: 27 }}>{marks[place.category]}</Text></View>}
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={s.label}>{place.name}</Text>
        <Text style={s.body}>{place.category}{place.distanceKm !== undefined ? ' · ' + place.distanceKm.toFixed(1) + ' km' : ''}</Text>
        {place.unavailable && <Text style={s.body}>Venue details unavailable</Text>}
      </View>
      {action ? <Pressable accessibilityRole="button" accessibilityLabel={(selected ? 'Remove ' : 'Select ') + place.name}
        accessibilityState={{ selected }} onPress={action} style={[s.check, selected && { backgroundColor: color.green }]}>
        <Text style={s.checkText}>{selected ? '✓' : '+'}</Text>
      </Pressable> : selected && <View style={[s.check, { backgroundColor: color.green }]}><Text style={s.checkText}>✓</Text></View>}
    </View>
    {place.attributions?.map((a, i) => <Text key={i} style={s.caption} onPress={a.uri ? () => { if (a.uri?.startsWith('https://')) void Linking.openURL(a.uri); } : undefined}>{a.name}</Text>)}
    {children}
  </View>;
}
export function GoogleCredit() {
  return googleEnabled ? <View style={{ paddingHorizontal: 10, paddingTop: 10, paddingBottom: 5, alignSelf: 'flex-start' }}>
    <Image accessibilityLabel="Google Maps" resizeMode="contain" source={require('../assets/google-maps-attribution.png')} style={{ width: 104, height: 18 }} />
  </View> : null;
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'white' },
  content: { padding: 20, paddingBottom: 28, gap: 16, width: '100%', maxWidth: 560, alignSelf: 'center' },
  header: { minHeight: 70, justifyContent: 'center', borderBottomWidth: 1, borderColor: '#eef2f4', alignItems: 'center' },
  back: { position: 'absolute', left: 14, zIndex: 1, padding: 10 },
  logo: { fontSize: 28, lineHeight: 23, fontWeight: '900', letterSpacing: -1.7, color: color.ink },
  bigLogo: { fontSize: 74, lineHeight: 57, letterSpacing: -5 },
  heading: { fontSize: 29, lineHeight: 34, fontWeight: '900', letterSpacing: -0.6, color: color.ink },
  label: { fontSize: 16, fontWeight: '800', color: color.ink },
  body: { fontSize: 14, lineHeight: 20, color: color.muted },
  caption: { fontSize: 12, lineHeight: 17, color: color.muted },
  card: { backgroundColor: color.card, borderRadius: 20, padding: 15, gap: 12 },
  footer: { gap: 10, padding: 14, width: '100%', maxWidth: 560, alignSelf: 'center', backgroundColor: 'white' },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 },
  button: { minHeight: 46, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 9, backgroundColor: color.green, borderRadius: 16 },
  secondary: { backgroundColor: color.card },
  buttonText: { color: color.ink, fontSize: 14, fontWeight: '800', textAlign: 'center' },
  input: { minHeight: 46, paddingHorizontal: 13, paddingVertical: 9, borderRadius: 14, backgroundColor: color.card, color: color.ink, borderWidth: 1, borderColor: color.line, fontSize: 16 },
  error: { color: '#9b2630', fontSize: 14, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: '#101a2577' },
  modalScroll: { flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modal: { backgroundColor: 'white', width: '100%', maxWidth: 450, borderRadius: 24, padding: 20, gap: 14 },
  placeRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  thumbnail: { width: 68, height: 68, borderRadius: 14, backgroundColor: color.line },
  check: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#d4dee5', alignItems: 'center', justifyContent: 'center' },
  checkText: { fontWeight: '900', fontSize: 22, color: color.ink },
});
