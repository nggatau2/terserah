import { Redirect, router } from 'expo-router';
import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MapPanel } from '../map-panel';
import { PlanLocation, sampleAreas } from '../model';
import { googleEnabled, hasPlacesAccess, lookup, sampleSuggestions, suggest, Suggestion } from '../places-provider';
import { PlacesAccess } from '../places-access';
import { usePlans } from '../state';
import { Button, Field, GoogleCredit, Heading, Message, Shell, s } from '../ui';

export default function LocationScreen() {
  const { draft, setDraft } = usePlans();
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<{ query: string; matches: Suggestion[] | null }>();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [unlocked, setUnlocked] = useState(hasPlacesAccess);
  const active = useRef(false);
  useEffect(() => { active.current = true; return () => { active.current = false; }; }, []);
  const search = query.trim();
  const searching = googleEnabled && search.length >= 2 && result?.query !== search;
  const matches = result?.query === search ? result.matches ?? [] : [];
  const searchError = result?.query === search && !result.matches ? 'Location search is unavailable. Check your connection and try again.' : '';
  useEffect(() => {
    if (!googleEnabled || !unlocked || search.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggest(search, controller.signal).then(matches => {
        if (!controller.signal.aborted) setResult({ query: search, matches });
      }).catch(() => {
        if (!controller.signal.aborted) setResult({ query: search, matches: null });
      });
    }, 320);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [search, unlocked]);
  if (!draft) return <Redirect href="/" />;
  if (!unlocked) return <Shell>
    <PlacesAccess onUnlock={() => setUnlocked(true)} />
    <MapPanel center={draft.location ?? sampleAreas[0]} />
  </Shell>;
  const quick = draft.mode === 'quick_discovery';
  function choose(location: PlanLocation) {
    if (!active.current) return;
    setDraft(prev => {
      if (!prev) return prev;
      const same = prev.location?.latitude === location.latitude && prev.location?.longitude === location.longitude;
      return { ...prev, location, destinations: same ? prev.destinations : [] };
    });
    setMessage('');
  }
  async function useGps() {
    setBusy(true); setMessage('');
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!active.current) return;
      if (!permission.granted) { setMessage('Location permission was declined. Search for an area instead.'); return; }
      const result = await Promise.race([
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
        new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error()), 15000); }),
      ]);
      choose({ name: 'Current location', latitude: result.coords.latitude, longitude: result.coords.longitude });
      setQuery('');
    } catch { setMessage('Could not get your location. Try again or search for an area.'); }
    finally { clearTimeout(timer); setBusy(false); }
  }
  async function chooseGoogle(id: string) {
    setBusy(true); setMessage('');
    try {
      const { name, latitude, longitude, placeId } = await lookup(id);
      choose({ name, latitude, longitude, placeId });
      setQuery('');
    } catch { setMessage('Could not open this location. Try another result.'); }
    finally { setBusy(false); }
  }
  return <Shell footer={<Button label={quick ? 'Find Nearby Places' : 'Get Recommended Places'}
    disabled={busy || !draft.location} onPress={() => router.push('/discover')} />}>
    <Heading title={quick ? 'Quick Discovery' : 'Where’s the date?'} description={quick
      ? 'Use your location or pick an area to discover places within 5 km.'
      : 'Choose an area to find places within 3 km that match your interests.'} />
    <Field label="Search area or place" placeholder={googleEnabled ? 'Neighborhood, city or place' : 'Try Menteng, Kemang or Senopati'} value={query}
      maxLength={120} editable={!busy} onChangeText={value => { setQuery(value); setMessage(''); }} />
    <Button label={busy ? 'Getting location…' : '◎ Use Current Location'} secondary disabled={busy} onPress={useGps} />
    <Message text={message || searchError} />
    {searching && <ActivityIndicator accessibilityLabel="Searching locations" />}
    {!googleEnabled && <Text style={s.caption}>Sample data · fictional venues for development</Text>}
    {googleEnabled && <GoogleCredit />}
    <View style={s.row}>
      {googleEnabled ? matches.map(a => <Button label={a.name} key={a.placeId} disabled={busy} secondary onPress={() => void chooseGoogle(a.placeId)} />)
        : sampleSuggestions(query).map(a => <Button label={a.name} key={a.name} disabled={busy} secondary={draft.location?.name !== a.name} onPress={() => choose(a)} />)}
    </View>
    {!!search && !searching && !message && !searchError && (googleEnabled ? search.length >= 2 && !matches.length : !sampleSuggestions(query).length) &&
      <Text style={s.body}>No matching locations. Try a different search.</Text>}
    {draft.location && <Text style={s.label}>Selected area · {draft.location.name}</Text>}
    <MapPanel center={draft.location ?? sampleAreas[0]} />
  </Shell>;
}
