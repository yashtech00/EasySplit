import { useState } from 'react';
import { Alert } from 'react-native';
import { useSafeRouter } from '../../hooks/use-safe-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner } from 'tamagui';
import { ChevronLeft, ArrowRight } from '@tamagui/lucide-icons';
import { joinGroup } from '../../api/group.service';
import { useAuthStore } from '../../store/auth.store';

export default function JoinGroupScreen() {
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();
  const { user, updateUser } = useAuthStore();

  const handleJoinGroup = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    setLoading(true);
    try {
      const data = await joinGroup(inviteCode.toUpperCase());
      updateUser({ hasGroup: true, groupId: data.id });
      router.replace('/(tabs)');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid code or group is full';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" padding="$6" gap="$6">
      <XStack alignItems="center" marginTop="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          backgroundColor="transparent"
        />
        <H1 size="$7">Join Group</H1>
      </XStack>

      <YStack gap="$5" marginTop="$4" backgroundColor="white" padding="$6" borderRadius="$8" borderWidth={1} borderColor="$gray3">
        <YStack gap="$2.5">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>INVITE CODE</Label>
          <XStack 
            alignItems="center" 
            backgroundColor="white" 
            borderWidth={1}
            borderColor="$gray4"
            borderRadius="$6" 
            px="$3.5"
            height={52}
            focusStyle={{ borderColor: '$blue10' }}
          >
            <Input
              flex={1}
              borderWidth={0}
              placeholder="GRP-XXXX"
              value={inviteCode}
              onChangeText={(text) => setInviteCode(text.toUpperCase())}
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="700"
              color="$gray12"
              autoFocus
            />
          </XStack>
          <Text color="$gray9" fontSize="$2.5" fontWeight="500">Enter the invite code you received</Text>
        </YStack>

        <YStack gap="$2.5">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>YOUR UPI ID</Label>
          <XStack 
            alignItems="center" 
            backgroundColor="$gray2" 
            borderWidth={1}
            borderColor="$gray4"
            borderRadius="$6" 
            px="$3.5"
            height={52}
          >
            <Input
              flex={1}
              borderWidth={0}
              value={user?.upiId || 'No UPI ID Added'}
              disabled
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="600"
              color="$gray8"
            />
          </XStack>
          <Text color="$gray9" fontSize="$2.5" fontWeight="500">(for receiving payments)</Text>
        </YStack>

        <Button
          size="$5"
          backgroundColor="$blue10"
          hoverStyle={{ backgroundColor: '$blue11' }}
          pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
          onPress={handleJoinGroup}
          disabled={loading}
          br="$9"
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
          marginTop="$2"
        >
          <Text color="white" fontWeight="700" fontSize="$4" letterSpacing={0.5}>
            {loading ? 'JOINING...' : 'JOIN GROUP'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
