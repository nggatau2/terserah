import { Redirect, router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { MapPanel } from '../map-panel';
import { categories, Category, Destination, matchingInterests, rankPlaces } from '../model';
import { randomPlace } from '../planner';
import { googleEnabled, nearby } from '../places-provider';
import { usePlans } from '../state';
import { Button, GoogleCredit, Heading, Message, OsmCredit, PlaceCard, Sheet, Shell, s } from '../ui';

const maxDestinations = 5;
const pageSize = 30;
export default function DiscoverScreen() {
  const { draft, setDraft } = usePlans();
  const center = draft?.location;
  const radius = draft?.mode === 'plan_ahead' ? 3 : 5;
  const [result, setResult] = useState<{ key: string; places: Destination[] | null }>();
  const [attempt, setAttempt] = useState(0);
  const [filter, setFilter] = useState<Category | 'All'>('All');
  const [visibleCount, setVisibleCount] = useState(pageSize);
  const [random, setRandom] = useState<Destination | null>(null);
  const [message, setMessage] = useState('');
  const key = [center?.latitude, center?.longitude, radius, attempt].join(':');
  const places = result?.key === key ? result.places : null;
  const failure = result?.key === key && result.places === null;
  useEffect(() => {
    if (!center) return;
    const controller = new AbortController();
    nearby(center, radius, controller.signal).then(list => {
      if (!controller.signal.aborted) setResult({ key, places: list });
    }).catch(() => { if (!controller.signal.aborted) setResult({ key, places: null }); });
    return () => controller.abort();
  }, [center, radius, key]);
  const participants = draft?.participants;
  const ranked = useMemo(() => center && places ? rankPlaces(places, center, radius, participants ?? []) : [],
    [places, center, radius, participants]);
  if (!draft || !center) return <Redirect href="/" />;
  const filtered = filter === 'All' ? ranked : ranked.filter(p => p.category === filter);
  const chosen = draft.destinations.map(p => p.placeId);
  const pool = draft.destinations.length ? draft.destinations : filtered;
  function toggle(place: Destination) {
    if (!chosen.includes(place.placeId) && chosen.length >= maxDestinations) {
      setMessage('Choose up to five destinations. Remove a stop to add another.');
      return;
    }
    setMessage('');
    setDraft(prev => prev && ({
      ...prev, destinations: chosen.includes(place.placeId)
        ? prev.destinations.filter(p => p.placeId !== place.placeId) : [...prev.destinations, place],
    }));
  }
  function pick(previous?: string) {
    // The original picker excludes the current result when alternatives exist.
    const candidates = pool.map(p => ({ id: p.placeId, place: p }));
    const next = randomPlace(candidates, [], pool.length > 1 ? previous : undefined);
    setRandom(next?.place ?? null);
  }
  return <Shell footer={<>
    <Button label="Help Me Decide" secondary disabled={!pool.length} onPress={() => pick()} />
    <Button label={'Next · ' + chosen.length + ' selected'} onPress={() => {
      if (!chosen.length) setMessage('Select at least one place before continuing.');
      else { setMessage(''); router.push('/review'); }
    }} />
  </>}>
    <Heading title="Discover places" description={center.name + ' · within ' + radius + ' km'} />
    <MapPanel center={center} places={filtered.slice(0, 14)} chosen={chosen} onPress={toggle} />
    <View style={s.row}>{(['All', ...categories] as const).map(c =>
      <Button key={c} label={c} secondary={c !== filter} selected={c === filter}
        onPress={() => { setFilter(c); setVisibleCount(pageSize); setMessage(''); }} />
    )}</View>
    <Message text={message} />
    {googleEnabled ? <GoogleCredit /> : <OsmCredit />}
    {failure && <><Message text="Could not load nearby places." /><Button label="Retry" onPress={() => setAttempt(i => i + 1)} secondary /></>}
    {!places && !failure && <ActivityIndicator accessibilityLabel="Loading nearby places" />}
    {places && !filtered.length && <Text style={s.body}>{ranked.length ? 'No places in this category. Try another filter.' : 'No nearby places found. Try a different area.'}</Text>}
    {filtered.slice(0, visibleCount).map(p => {
      const matches = matchingInterests(p, draft.participants);
      return <PlaceCard key={p.placeId} place={p} selected={chosen.includes(p.placeId)} action={() => toggle(p)}>
        {!!matches.length && <Text style={s.caption}>Matches {matches.join(', ')}</Text>}
      </PlaceCard>;
    })}
    {filtered.length > visibleCount && <Button label="Show more places" secondary onPress={() => setVisibleCount(count => count + pageSize)} />}
    {random && <Sheet onClose={() => setRandom(null)}>
      <Heading title="How about this?" description={chosen.length ? 'Picked from your selected places.' : 'Picked from your current results.'} />
      {random.google && <GoogleCredit />}
      {random.osm && <OsmCredit />}
      <PlaceCard place={random}>
        {!!matchingInterests(random, draft.participants).length && <Text style={s.caption}>Matches {matchingInterests(random, draft.participants).join(', ')}</Text>}
      </PlaceCard>
      <Button label="Choose This Place" onPress={() => {
        setDraft(prev => prev && ({ ...prev, destinations: [random] }));
        setRandom(null);
        router.push('/review');
      }} />
      <Button label="Try Again" onPress={() => pick(random.placeId)} disabled={pool.length < 2} secondary />
      <Button label="Cancel" onPress={() => setRandom(null)} secondary />
    </Sheet>}
  </Shell>;
}
