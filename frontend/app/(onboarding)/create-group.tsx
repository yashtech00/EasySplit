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
    <YStack flex={1} backgroundColor="$background" padding="$6" gap="$6">
      <XStack alignItems="center" marginTop="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          backgroundColor="transparent"
        />
        <H1 size="$7">Create Group</H1>
      </XStack>

      <YStack gap="$5" mt="$4" backgroundColor="white" padding="$6" borderRadius="$8" borderWidth={1} borderColor="$gray3">
        <YStack gap="$2.5">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>GROUP NAME</Label>
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
              placeholder="e.g. Roommates"
              value={name}
              onChangeText={setName}
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="600"
              color="$gray12"
              autoFocus
            />
          </XStack>
          <Text color="$gray9" fontSize="$2.5" fontWeight="500">Example: "Me & Sarah", "Roommates"</Text>
        </YStack>

        <Button
          size="$5"
          bc="$blue10"
          hoverStyle={{ backgroundColor: '$blue11' }}
          pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
          onPress={handleCreateGroup}
          disabled={loading}
          br="$9"
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
          marginTop="$2"
        >
          <Text color="white" fontWeight="700" fontSize="$4" letterSpacing={0.5}>
            {loading ? 'CREATING...' : 'CREATE GROUP'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
