import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { Plan } from '../../model';
import { hasPlacesAccess, hydrate } from '../../places-provider';
import { PlacesAccess } from '../../places-access';
import { usePlans } from '../../state';
import { Button, GoogleCredit, Heading, Message, PlaceCard, Shell, s } from '../../ui';

export default function PlanDetails() {
  const { id, saved } = useLocalSearchParams<{ id: string; saved?: string }>();
  const { plans, ready, storageError, setDraft, save } = usePlans();
  const stored = plans.find(p => p.id === id);
  const [resolved, setResolved] = useState<{ source: Plan; plan: Plan }>();
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [unlocked, setUnlocked] = useState(hasPlacesAccess);
  const writing = useRef(false);
  useEffect(() => {
    if (!stored || !unlocked || !needsLookup(stored)) return;
    let active = true;
    hydrate(stored).then(plan => { if (active) setResolved({ source: stored, plan }); });
    return () => { active = false; };
  }, [stored, unlocked]);
  if (!ready) return <Shell><ActivityIndicator accessibilityLabel="Loading saved plan" /></Shell>;
  if (storageError) return <Shell><Message text={storageError} /></Shell>;
  if (!stored) return <Redirect href="/" />;
  const plan = resolved?.source === stored ? resolved.plan : stored;
  const loading = needsLookup(stored) && resolved?.source !== stored;
  async function setStatus(status: Plan['status']) {
    if (writing.current) return;
    writing.current = true;
    setBusy(true); setMessage('');
    try { await save({ ...plan, status, updatedAt: new Date().toISOString() }); }
    catch { setMessage('Could not update this plan. Try again.'); }
    finally { setBusy(false); writing.current = false; }
  }
  return <Shell footer={<Button label="Edit plan" disabled={busy || loading} onPress={() => {
    const { participants, destinations, mode, location, scheduledDate, startTime, endTime, timezone } = plan;
    setDraft({ participants, destinations, mode, location, scheduledDate, startTime, endTime, timezone, editingId: plan.id });
    router.push('/review');
  }} />}>
    {saved === '1' && <Text accessibilityRole="alert" style={s.label}>Plan saved</Text>}
    <Heading title={plan.name} description={plan.location?.name} />
    <Message text={message} />
    <View style={s.card}>
      <Text style={s.label}>{plan.status[0].toUpperCase() + plan.status.slice(1)}</Text>
      <Text style={s.body}>{plan.scheduledDate ? [plan.scheduledDate, plan.startTime, plan.endTime && 'to ' + plan.endTime, plan.timezone].filter(Boolean).join(' · ') : 'No date or time set'}</Text>
      {plan.participants.map(p => <Text key={p.id} style={s.body}>{p.name}{p.interests.length ? ' · ' + p.interests.join(', ') : ''}</Text>)}
    </View>
    <Heading title="Itinerary" />
    {loading && (unlocked
      ? <ActivityIndicator accessibilityLabel="Loading venue details" />
      : <PlacesAccess onUnlock={() => setUnlocked(true)} />)}
    {plan.destinations.some(p => p.google) && <GoogleCredit />}
    {plan.destinations.map((p, i) => <PlaceCard key={p.placeId} place={p} selected><Text style={s.body}>Stop {i + 1}{p.arrivalTime ? ' · ' + p.arrivalTime : ''}</Text></PlaceCard>)}
    <View style={s.row}>
      {plan.status === 'planned' && <Button label="Mark completed" disabled={busy} onPress={() => void setStatus('completed')} secondary />}
      {plan.status !== 'archived' && <Button label="Archive plan" disabled={busy} onPress={() => void setStatus('archived')} secondary />}
      {plan.status !== 'planned' && <Button label="Move back to Plans" disabled={busy} onPress={() => void setStatus('planned')} secondary />}
    </View>
  </Shell>;
}
function needsLookup(plan: Plan) {
  return plan.location?.name === 'Saved Google area' || plan.destinations.some(p => p.google && p.name === 'Saved Google place');
}
