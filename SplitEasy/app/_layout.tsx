import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  const { token, user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!token) {
      // Not logged in → go to login
      router.replace('/(auth)/login');
    } else if (token && !user?.name) {
      // Token but profile incomplete → complete profile
      router.replace('/(auth)/complete-profile');
    } else if (token && user?.name && inAuth) {
      // All good → go to home
      router.replace('/(tabs)');
    }
  }, [token, user, isLoading, segments]);

  if (isLoading) {
    return null; // Or a loading screen
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
