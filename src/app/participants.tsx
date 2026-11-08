import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { Participant } from '../model';
import { usePlans } from '../state';
import { Button, Field, Heading, Message, Shell, s } from '../ui';

export default function ParticipantsScreen() {
  const { draft, setDraft } = usePlans();
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  if (!draft || draft.mode !== 'plan_ahead') return <Redirect href="/" />;
  const change = (id: string, update: Partial<Participant>) => setDraft(prev => prev && ({
    ...prev, participants: prev.participants.map(p => p.id === id ? { ...p, ...update } : p),
  }));
  function addInterest(person: Participant) {
    const interest = inputs[person.id]?.trim();
    if (!interest) return;
    if (!person.interests.some(i => i.toLowerCase() === interest.toLowerCase())) change(person.id, { interests: [...person.interests, interest] });
    setInputs(prev => ({ ...prev, [person.id]: '' }));
  }
  return <Shell footer={<Button label="Next" onPress={() => {
    if (draft.participants.some(p => !p.name.trim())) { setMessage('Enter a name for each person.'); return; }
    setDraft(prev => prev && ({ ...prev, participants: prev.participants.map(p => {
      const pending = inputs[p.id]?.trim();
      const interests = pending && !p.interests.some(i => i.toLowerCase() === pending.toLowerCase()) ? [...p.interests, pending] : p.interests;
      return { ...p, name: p.name.trim(), interests };
    }) }));
    setInputs({});
    setMessage('');
    router.push('/when');
  }} />}>
    <Heading title="Who’s coming?" description="Add everyone’s interests to find places you’ll enjoy together." />
    <Message text={message} />
    {draft.participants.map((person, i) => <View style={s.card} key={person.id}>
      <Text style={s.label}>Person {i + 1}</Text>
      <Field label={'Name for person ' + (i + 1)} value={person.name} maxLength={40} onChangeText={name => change(person.id, { name })} />
      <Field label={'Interest for person ' + (i + 1)} value={inputs[person.id] ?? ''} maxLength={40}
        placeholder="Coffee, Art, Japanese Food…" returnKeyType="done"
        onChangeText={value => setInputs(prev => ({ ...prev, [person.id]: value }))} onSubmitEditing={() => addInterest(person)} />
      <View style={s.row}>
        {person.interests.map(interest => <Button key={interest} label={interest + ' ×'} onPress={() => change(person.id, { interests: person.interests.filter(x => x !== interest) })} />)}
        <Button label="Add interest" secondary onPress={() => addInterest(person)} />
        {draft.participants.length > 1 && <Button label={'Remove person ' + (i + 1)} secondary onPress={() => setDraft(prev => prev && ({ ...prev, participants: prev.participants.filter(p => p.id !== person.id) }))} />}
      </View>
    </View>)}
    <Button label="+ Add Person" secondary onPress={() => setDraft(prev => prev && ({
      ...prev, participants: [...prev.participants, { id: Math.random().toString(36).slice(2), name: '', interests: [] }],
    }))} />
  </Shell>;
}
