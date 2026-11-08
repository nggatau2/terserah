import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PlanProvider } from '../state';

export default function RootLayout() {
  return <PlanProvider><StatusBar style="dark" /><Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: 'white' } }} /></PlanProvider>;
}
