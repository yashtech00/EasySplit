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
      <YStack ai="center" gap="$3">
        <YStack bc="$green2" p="$3" br="$9" mb="$2">
          <CheckCircle2 size={56} color="$green10" />
        </YStack>
        <H1 size="$8" color="$gray12" fontWeight="900" letterSpacing={-0.5} ta="center">Group Created! 🎉</H1>
        <Text fontSize="$4" color="$gray10" ta="center" fontWeight="600">Share this code with your friend:</Text>
      </YStack>

      <Card 
        p="$8" 
        br="$8" 
        bw={1}
        boc="$gray4"
        bc="white" 
        elevation={0} 
        ai="center"
        style={{
          borderStyle: 'dashed',
          borderWidth: 2,
        }}
      >
        <Text fontSize="$10" fontWeight="900" letterSpacing={4} color="$blue10">
          {code}
        </Text>
      </Card>

      <YStack gap="$4">
        <Button
          size="$5"
          bc="$blue10"
          hoverStyle={{ backgroundColor: '$blue11' }}
          pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
          icon={<Copy size={20} color="white" />}
          onPress={handleCopy}
          br="$9"
        >
          <Text color="white" fontWeight="700" letterSpacing={0.5}>{copied ? 'COPIED!' : 'COPY CODE'}</Text>
        </Button>

        <Button
          size="$5"
          bc="$green10"
          hoverStyle={{ backgroundColor: '$green11' }}
          pressStyle={{ backgroundColor: '$green9', scale: 0.98 }}
          icon={<Share2 size={20} color="white" />}
          onPress={handleShareWhatsApp}
          br="$9"
        >
          <Text color="white" fontWeight="700" letterSpacing={0.5}>SHARE VIA WHATSAPP</Text>
        </Button>

        <Button
          size="$5"
          bc="transparent"
          hoverStyle={{ backgroundColor: '$gray2' }}
          pressStyle={{ scale: 0.98 }}
          onPress={() => router.replace('/(tabs)')}
          br="$9"
        >
          <Text color="$gray10" fontWeight="700" letterSpacing={0.5}>SKIP TO HOME</Text>
        </Button>
      </YStack>
    </YStack>
  );
}
