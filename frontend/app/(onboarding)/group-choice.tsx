import { useRouter } from 'expo-router';
import { YStack, Text, Button, H1, H2, Card } from 'tamagui';
import { Users, Link } from '@tamagui/lucide-icons';
import { useAuthStore } from '../../store/auth.store';

export default function GroupChoiceScreen() {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <YStack f={1} bc="$background" jc="center" p="$6" gap="$8">
      <YStack ai="center" gap="$3">
        <H1 size="$8" color="$gray12" ta="center" fontWeight="900" letterSpacing={-0.5}>Welcome, {user?.name}!</H1>
        <Text fontSize="$4" color="$gray10" ta="center" fontWeight="600">Let's get you started 🚀</Text>
      </YStack>

      <YStack gap="$5">
        <Card
          p="$6"
          br="$9"
          bw={1}
          boc="$gray3"
          bc="white"
          elevation={0}
          pressStyle={{ scale: 0.98, bc: '$gray2' }}
          hoverStyle={{ boc: '$blue4' }}
          onPress={() => router.push('/(onboarding)/create-group')}
        >
          <YStack ai="center" gap="$4">
            <YStack bc="$blue2" p="$4" br="$9" width={72} height={72} ai="center" jc="center">
              <Users size={32} color="$blue10" />
            </YStack>
            <YStack ai="center" gap="$1">
              <H2 size="$5" fontWeight="800" color="$gray12" letterSpacing={0.5}>CREATE A GROUP</H2>
              <Text color="$gray10" ta="center" fontWeight="500" fontSize="$2.5">Start fresh with a friend</Text>
            </YStack>
          </YStack>
        </Card>

        <Card
          p="$6"
          br="$9"
          bw={1}
          boc="$gray3"
          bc="white"
          elevation={0}
          pressStyle={{ scale: 0.98, bc: '$gray2' }}
          hoverStyle={{ boc: '$green4' }}
          onPress={() => router.push('/(onboarding)/join-group')}
        >
          <YStack ai="center" gap="$4">
            <YStack bc="$green2" p="$4" br="$9" width={72} height={72} ai="center" jc="center">
              <Link size={32} color="$green10" />
            </YStack>
            <YStack ai="center" gap="$1">
              <H2 size="$5" fontWeight="800" color="$gray12" letterSpacing={0.5}>JOIN A GROUP</H2>
              <Text color="$gray10" ta="center" fontWeight="500" fontSize="$2.5">Have an invite code?</Text>
            </YStack>
          </YStack>
        </Card>
      </YStack>
    </YStack>
  );
}
