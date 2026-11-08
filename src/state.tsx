import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Draft, Plan, forStorage } from './model';

const storageKey = 'tersrh-plans-v1';
type State = {
  plans: Plan[]; ready: boolean; storageError: string; draft: Draft | null;
  setDraft: React.Dispatch<React.SetStateAction<Draft | null>>; save: (plan: Plan) => Promise<void>;
};
const Context = createContext<State | null>(null);
export function PlanProvider({ children }: { children: ReactNode }) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState('');
  const [draft, setDraft] = useState<Draft | null>(null);
  const current = useRef<Plan[]>([]);
  const writes = useRef(Promise.resolve());
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(storageKey).then(raw => {
      if (!active) return;
      const stored: unknown = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(stored)) throw new Error('Invalid stored plans');
      current.current = stored;
      setPlans(stored);
    }).catch(() => { if (active) setStorageError('Saved plans could not be loaded. Reload the app to try again.'); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  function save(plan: Plan) {
    const write = writes.current.then(async () => {
      if (!ready || storageError) throw new Error('Storage is unavailable.');
      const next = [plan, ...current.current.filter(p => p.id !== plan.id)];
      await AsyncStorage.setItem(storageKey, JSON.stringify(next.map(forStorage)));
      current.current = next;
      setPlans(next);
    });
    writes.current = write.catch(() => {});
    return write;
  }
  return <Context.Provider value={{ plans, ready, storageError, draft, setDraft, save }}>{children}</Context.Provider>;
}
export function usePlans() {
  const state = useContext(Context);
  if (!state) throw new Error('Plan provider missing');
  return state;
}
