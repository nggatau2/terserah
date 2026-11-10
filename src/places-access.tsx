import { useState } from 'react';
import { unlockPlaces } from './places-provider';
import { Button, Field, Heading, Message } from './ui';

export function PlacesAccess({ onUnlock }: { onUnlock: () => void }) {
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function unlock() {
    if (busy || !code.trim()) return;
    setBusy(true);
    setError('');
    try {
      await unlockPlaces(code);
      onUnlock();
    } catch (failure) {
      setError(failure instanceof Error && failure.message === 'The Places access code was rejected.'
        ? failure.message : 'Could not reach venue search. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <Heading title="Unlock live venues" description="Enter the access code from the TERSRH owner. It stays in this session." />
    <Field label="Places access code" value={code} onChangeText={setCode} editable={!busy}
      secureTextEntry autoCapitalize="none" autoCorrect={false} maxLength={128} onSubmitEditing={() => void unlock()} />
    <Button label={busy ? 'Connecting to venue search…' : 'Unlock venues'} disabled={busy || !code.trim()} onPress={() => void unlock()} />
    <Message text={error} />
  </>;
}
