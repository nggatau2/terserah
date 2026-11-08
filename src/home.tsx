import { router } from 'expo-router';
import { ActivityIndicator, Pressable, Text, View, StyleSheet } from 'react-native';
import { newDraft } from './model';
import { usePlans } from './state';
import { Heading, Logo, Message, Shell, color, s } from './ui';

export function Home({ history = false }: { history?: boolean }) {
  const { plans, ready, storageError, setDraft } = usePlans();
  const listed = plans.filter(p => history ? p.status !== 'planned' : p.status === 'planned');
  const start = (quick: boolean) => {
    setDraft(newDraft(quick ? 'quick_discovery' : 'plan_ahead'));
    router.push(quick ? '/location' : '/participants');
  };
  const action = (quick: boolean) => <Pressable accessibilityRole="button" onPress={() => start(quick)} style={styles.action}>
    <View style={[styles.plus, { backgroundColor: quick ? color.red : color.green }]}><Text style={styles.plusText}>+</Text></View>
    <Text style={styles.actionText}>{quick ? 'QUICK DISCOVERY' : 'New Plan'}</Text>
  </Pressable>;
  const tabs = <View style={styles.tabs}>{['Plans', 'History'].map((tab, i) => {
    const active = Boolean(i) === history;
    const tint = active ? color.darkGreen : color.ink;
    return <Pressable key={tab} accessibilityRole="tab" accessibilityState={{ selected: active }}
      onPress={() => { if (!active) router.replace(i ? '/history' : '/'); }}
      style={[styles.tab, { borderTopColor: active ? color.green : color.ink }]}>
      <Text style={{ fontSize: 25, color: tint, fontWeight: '800' }}>{i ? '◷' : '☰'}</Text>
      <Text style={{ fontWeight: '800', color: tint }}>{tab}</Text>
    </Pressable>;
  })}</View>;
  return <Shell home footer={<>{!history && action(true)}{tabs}</>}>
    <Logo large />
    <Heading title={history ? 'History' : 'Your plans'} />
    <Message text={storageError} />
    {!ready && <ActivityIndicator color={color.darkGreen} />}
    {ready && !storageError && !listed.length && <View style={s.card}><Text style={s.label}>{history ? 'No past plans yet' : 'Nothing planned yet'}</Text>
      <Text style={s.body}>{history ? 'Completed and archived plans will show up here.' : 'Start with a new plan and see where the date takes you.'}</Text></View>}
    {listed.map(plan => <Pressable accessibilityRole="button" key={plan.id} style={s.card} onPress={() => router.push({ pathname: '/plan/[id]', params: { id: plan.id } })}>
      <Text style={styles.planName}>{plan.name}</Text>
      <Text style={s.body}>Near {plan.location?.name ?? 'your selected area'}</Text>
      <Text style={s.caption}>{[plan.scheduledDate, plan.startTime, history ? plan.status : undefined].filter(Boolean).join(' · ') || 'Anytime'}</Text>
    </Pressable>)}
    {!history && action(false)}
  </Shell>;
}
const styles = StyleSheet.create({
  action: { minHeight: 68, borderRadius: 20, backgroundColor: color.card, alignItems: 'center', flexDirection: 'row', gap: 14, padding: 12 },
  plus: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  plusText: { fontSize: 31, lineHeight: 34, color: color.ink, fontWeight: '700' },
  actionText: { color: color.ink, fontWeight: '900', fontSize: 17 },
  planName: { color: color.ink, fontWeight: '900', fontSize: 21 },
  tabs: { flexDirection: 'row', gap: 16 },
  tab: { flex: 1, borderTopWidth: 3, minHeight: 59, alignItems: 'center', justifyContent: 'center', gap: 3 },
});
