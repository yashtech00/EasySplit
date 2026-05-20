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

      <YStack gap="$6" marginTop="$4">
        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">INVITE CODE</Label>
          <Input
            size="$5"
            placeholder="GRP-XXXX"
            value={inviteCode}
            onChangeText={(text) => setInviteCode(text.toUpperCase())}
            autoFocus
          />
          <Text color="$gray10" fontSize="$3">Enter the invite code you received</Text>
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">YOUR UPI ID</Label>
          <Input
            size="$5"
            value={user?.upiId || ''}
            disabled
            backgroundColor="$gray2"
          />
          <Text color="$gray10" fontSize="$3">(for receiving payments)</Text>
        </YStack>

        <Button
          size="$5"
          backgroundColor="$blue10"
          onPress={handleJoinGroup}
          disabled={loading}
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
        >
          <Text color="white" fontWeight="600" fontSize="$5">
            {loading ? 'Joining...' : 'JOIN GROUP'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
