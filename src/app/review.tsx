import { Redirect, router } from 'expo-router';
import { useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { Destination, Plan, Schedule, scheduleError, validTime } from '../model';
import { Picker } from '../picker';
import { ScheduleFields } from '../schedule';
import { usePlans } from '../state';
import { Button, Field, GoogleCredit, Heading, Message, PlaceCard, Sheet, Shell, s } from '../ui';

export default function ReviewScreen() {
  const { draft, setDraft, plans, ready, save } = usePlans();
  const [scheduleVisible, setScheduleVisible] = useState(false);
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [nameError, setNameError] = useState('');
  const [busy, setBusy] = useState(false);
  const saving = useRef(false);
  if (!draft?.location) return <Redirect href="/" />;
  const editing = plans.find(p => p.id === draft.editingId);
  const showSchedule = draft.mode === 'plan_ahead' || !!draft.scheduledDate || scheduleVisible;
  const updateStops = (change: (list: Destination[]) => Destination[]) => {
    setDraft(prev => prev && ({ ...prev, destinations: change(prev.destinations) }));
    setMessage('');
  };
  function move(i: number, delta: number) {
    updateStops(list => {
      const next = [...list];
      [next[i], next[i + delta]] = [next[i + delta], next[i]];
      return next;
    });
  }
  function changeSchedule(patch: Partial<Schedule>) {
    setDraft(prev => prev && ({ ...prev, ...patch }));
    setMessage('');
  }
  async function persist() {
    if (saving.current || !draft) return;
    if (!name.trim()) { setNameError('Enter a name for your plan.'); return; }
    const now = new Date().toISOString();
    const { editingId, ...details } = draft;
    const plan: Plan = {
      ...details, id: editingId ?? Date.now().toString(36) + '-' + Math.random().toString(36).slice(2),
      name: name.trim(), status: editing?.status ?? 'planned', createdAt: editing?.createdAt ?? now, updatedAt: now,
    };
    saving.current = true;
    setBusy(true);
    try {
      await save(plan);
      setNaming(false);
      router.dismissTo('/');
      router.push({ pathname: '/plan/[id]', params: { id: plan.id, saved: '1' } });
    } catch { setNameError('Your plan could not be saved. Try again.'); }
    finally { setBusy(false); saving.current = false; }
  }
  return <Shell footer={<>
    <Button label={editing ? 'Save Changes' : 'Save'} disabled={busy || !ready} onPress={() => {
      const error = scheduleError(draft, draft.mode === 'plan_ahead');
      if (error) { setScheduleVisible(true); setMessage(error); return; }
      if (!draft.destinations.length) { setMessage('Add at least one destination.'); return; }
      if (draft.destinations.some(p => p.arrivalTime && !validTime(p.arrivalTime))) { setMessage('Enter valid arrival times.'); return; }
      setName(editing?.name ?? name); setNameError(''); setMessage(''); setNaming(true);
    }} />
  </>}>
    <Heading title={editing ? 'Edit your plan' : 'Final review'} description={draft.location.name + ' · ' + draft.destinations.length + ' stops'} />
    {draft.participants.length > 0 && <Text style={s.body}>{draft.participants.map(p => p.name).join(' + ')}</Text>}
    <Message text={message} />
    <Heading title="Date & time" />
    {showSchedule ? <View style={s.card}><ScheduleFields value={draft} change={changeSchedule} />
      {draft.mode === 'quick_discovery' && <Button label="Clear schedule" secondary onPress={() => {
        changeSchedule({ scheduledDate: '', startTime: '', endTime: '' }); setScheduleVisible(false);
      }} />}
    </View> : <Button label="Add date & time (optional)" secondary onPress={() => setScheduleVisible(true)} />}
    <Heading title="Itinerary" description="Set your own arrival times and put the stops in order." />
    {draft.destinations.some(p => p.google) && <GoogleCredit />}
    {draft.destinations.map((p, i) => <PlaceCard key={p.placeId} place={p} selected>
      <Picker label={'Arrival time for stop ' + (i + 1) + ' (optional)'} mode="time" timezone={draft.timezone}
        value={p.arrivalTime ?? ''} onChange={arrivalTime => updateStops(list => list.map(stop => stop.placeId === p.placeId ? { ...stop, arrivalTime } : stop))} />
      <View style={s.row}>
        <Button label={'Move stop ' + (i + 1) + ' up'} onPress={() => move(i, -1)} disabled={i === 0} secondary />
        <Button label={'Move stop ' + (i + 1) + ' down'} onPress={() => move(i, 1)} disabled={i === draft.destinations.length - 1} secondary />
        <Button label={'Remove stop ' + (i + 1)} secondary onPress={() => updateStops(list => list.filter(stop => stop.placeId !== p.placeId))} />
        {!!p.arrivalTime && <Button label={'Clear arrival time for stop ' + (i + 1)} secondary onPress={() => updateStops(list => list.map(stop => stop.placeId === p.placeId ? { ...stop, arrivalTime: '' } : stop))} />}
      </View>
    </PlaceCard>)}
    <Button label="Edit destinations" secondary onPress={() => {
      if (draft.location?.name === 'Saved Google area') router.push('/location');
      else if (editing || !router.canGoBack()) router.push('/discover');
      else router.back();
    }} />
    {naming && <Sheet onClose={() => { if (!busy) setNaming(false); }}>
      <Heading title={editing ? 'Save changes' : 'Name Your Plan'} />
      <Field label="Plan name" placeholder="Saturday Night in Menteng" value={name} maxLength={70} editable={!busy}
        onChangeText={value => { setName(value); setNameError(''); }} onSubmitEditing={() => void persist()} />
      <Message text={nameError} />
      <Button label={busy ? 'Saving…' : 'Save Plan'} disabled={busy} onPress={() => void persist()} />
      <Button label="Cancel" secondary disabled={busy} onPress={() => setNaming(false)} />
    </Sheet>}
  </Shell>;
}
