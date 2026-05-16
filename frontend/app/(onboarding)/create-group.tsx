import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner, useTheme } from 'tamagui';
import { ChevronLeft, ArrowRight } from '@tamagui/lucide-icons';
import { createGroup } from '../../api/group.service';
import { useAuthStore } from '../../store/auth.store';

export default function CreateGroupScreen() {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { updateUser } = useAuthStore();

  const handleCreateGroup = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a group name');
      return;
    }

    setLoading(true);
    try {
      const data = await createGroup(name);
      updateUser({ hasGroup: true, groupId: data.id });
      router.push({
        pathname: '/(onboarding)/invite-code',
        params: { code: data.inviteCode }
      });
    } catch (error: any) {
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack f={1} bc="$background" p="$6" gap="$6">
      <XStack ai="center" mt="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          bc="transparent"
        />
        <H1 size="$7">Create Group</H1>
      </XStack>

      <YStack gap="$6" mt="$4">
        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">GROUP NAME</Label>
          <Input
            size="$5"
            placeholder="e.g. Me & Rohan, Roommates"
            value={name}
            onChangeText={setName}
            autoFocus
          />
          <Text color="$gray10" fontSize="$3">Example: "Me & Sarah", "Roommates"</Text>
        </YStack>

        <Button
          size="$5"
          bc="$blue10"
          onPress={handleCreateGroup}
          disabled={loading}
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
        >
          <Text color="white" fontWeight="600" fontSize="$5">
            {loading ? 'Creating...' : 'CREATE GROUP'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
