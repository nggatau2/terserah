import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { ScheduleFields } from '../schedule';
import { scheduleError } from '../model';
import { usePlans } from '../state';
import { Button, Heading, Message, Shell } from '../ui';

export default function WhenScreen() {
  const { draft, setDraft } = usePlans();
  const [message, setMessage] = useState('');
  if (!draft || draft.mode !== 'plan_ahead') return <Redirect href="/" />;
  return <Shell footer={<Button label="Next" onPress={() => {
    const error = scheduleError(draft, true);
    setMessage(error);
    if (!error) router.push('/location');
  }} />}>
    <Heading title="When’s the Date?" description="Choose a date and start time. You can change them before saving." />
    <Message text={message} />
    <ScheduleFields value={draft} change={patch => { setDraft(prev => prev && ({ ...prev, ...patch })); setMessage(''); }} />
  </Shell>;
}
