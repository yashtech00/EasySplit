import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/auth.store';
import { StatusBar } from 'expo-status-bar';
import { TamaguiProvider, Theme, YStack, H1, Text, Spinner } from 'tamagui';
import config from '../tamagui.config';
import { getUserStats } from '../api/user.service';
import { Wallet } from '@tamagui/lucide-icons';

export default function RootLayout() {
  const { token, user, isLoading, loadFromStorage, updateUser } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    loadFromStorage();
  }, []);

  useEffect(() => {
    const checkGroup = async () => {
      if (token && user?.name && !user?.groupId) {
        try {
          const stats = await getUserStats();
          if (stats.primaryGroupId) {
            updateUser({ hasGroup: true, groupId: stats.primaryGroupId });
          }
        } catch (error) {
          console.error('Failed to fetch user stats in layout:', error);
        }
      }
    };
    checkGroup();
  }, [token, user?.name, user?.groupId]);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';
    const inOnboarding = segments[0] === '(onboarding)';

    if (!token && !inAuth) {
      // Not logged in and not in auth screens → go to login
      router.replace('/(auth)/login');
    } else if (token && !user?.name) {
      // Token but profile incomplete → complete profile
      router.replace('/(auth)/complete-profile');
    } else if (token && user?.name && !user?.groupId && !inOnboarding) {
      // Token and profile complete but no group and not in onboarding → go to onboarding
      router.replace('/(onboarding)/group-choice');
    } else if (token && user?.name && user?.groupId && (inAuth || inOnboarding)) {
      // All good and in auth/onboarding → go to home
      router.replace('/(tabs)');
    }
  }, [token, user, isLoading, segments]);

  if (isLoading) {
    return (
      <TamaguiProvider config={config} defaultTheme="light">
        <Theme name="light">
          <YStack flex={1} backgroundColor="$background" alignItems="center" justifyContent="center" gap="$4">
            <YStack backgroundColor="$blue4" padding="$4" borderRadius="$6">
              <Wallet size={64} color="$blue10" />
            </YStack>
            <H1 color="$blue10" fontWeight="800">SplitEasy</H1>
            <Text color="$gray10">Split bills, stay friends</Text>
            <Spinner size="large" color="$blue10" marginTop="$4" />
          </YStack>
        </Theme>
      </TamaguiProvider>
    );
  }

  return (
    <TamaguiProvider config={config} defaultTheme="light">
      <Theme name="light">
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </Theme>
    </TamaguiProvider>
  );
}
