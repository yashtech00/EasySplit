import { useRouter } from 'expo-router';
import { YStack, Text, Button, H1, H2, Card } from 'tamagui';
import { Users, Link } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

export default function GroupChoiceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <YStack f={1} bc="$background" jc="center" p="$6" gap="$8">
      <YStack ai="center" gap="$2">
        <H1 size="$8" color="$blue10" ta="center">Welcome to SplitEasy, {user?.name}!</H1>
        <Text fontSize="$5" color="$gray10" ta="center">Let's get you started 🚀</Text>
      </YStack>

      <YStack gap="$4">
        <Card
          p="$6"
          br="$8"
          elevation={2}
          pressStyle={{ scale: 0.98 }}
          onPress={() => router.push('/(onboarding)/create-group')}
        >
          <YStack ai="center" gap="$4">
            <YStack bc="$blue4" p="$4" br="$6">
              <Users size={40} color="$blue10" />
            </YStack>
            <YStack ai="center">
              <H2 size="$6" fontWeight="700">CREATE A GROUP</H2>
              <Text color="$gray10" ta="center">Start fresh with a friend</Text>
            </YStack>
          </YStack>
        </Card>

        <Card
          p="$6"
          br="$8"
          elevation={2}
          pressStyle={{ scale: 0.98 }}
          onPress={() => router.push('/(onboarding)/join-group')}
        >
          <YStack ai="center" gap="$4">
            <YStack bc="$green4" p="$4" br="$6">
              <Link size={40} color="$green10" />
            </YStack>
            <YStack ai="center">
              <H2 size="$6" fontWeight="700">JOIN A GROUP</H2>
              <Text color="$gray10" ta="center">Have an invite code?</Text>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </YStack>
  );
}
