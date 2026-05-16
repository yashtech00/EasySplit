import { useState } from 'react';
import { Alert, Linking } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, Text, Button, H1, Card, XStack } from 'tamagui';
import { Copy, Share2, CheckCircle2 } from '@tamagui/lucide-icons';
import * as Clipboard from 'expo-clipboard';

export default function InviteCodeScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const [copied, setCopied] = useState(false);
  const router = useRouter();

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareWhatsApp = () => {
    const message = `Join my SplitEasy group! Use code: ${code}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('Error', 'WhatsApp is not installed');
    });
  };

  return (
    <YStack f={1} bc="$background" jc="center" p="$6" gap="$8">
      <YStack ai="center" gap="$2">
        <CheckCircle2 size={64} color="$green10" />
        <H1 size="$8" color="$blue10">Group Created! ✅</H1>
        <Text fontSize="$5" color="$gray10" ta="center">Share this code with your friend:</Text>
      </YStack>

      <Card p="$8" br="$8" elevation={2} bc="$gray2" ai="center">
        <Text fontSize="$9" fontWeight="800" letterSpacing={2} color="$blue10">
          {code}
        </Text>
      </Card>

      <YStack gap="$4">
        <Button
          size="$5"
          bc="$blue10"
          icon={<Copy size={20} color="white" />}
          onPress={handleCopy}
        >
          <Text color="white" fontWeight="600">{copied ? 'COPIED!' : 'COPY CODE'}</Text>
        </Button>

        <Button
          size="$5"
          bc="$green10"
          icon={<Share2 size={20} color="white" />}
          onPress={handleShareWhatsApp}
        >
          <Text color="white" fontWeight="600">SHARE VIA WHATSAPP</Text>
        </Button>

        <Button
          size="$5"
          bc="transparent"
          onPress={() => router.replace('/(tabs)')}
        >
          <Text color="$gray10" fontWeight="600">Skip to Home</Text>
        </Button>
      </YStack>
    </YStack>
  );
}
