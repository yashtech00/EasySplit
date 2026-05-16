import { useState, useEffect } from 'react';
import { FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, H2, Card, Spinner, View } from 'tamagui';
import { Users as UsersIcon, Plus, ChevronRight, Copy } from '@tamagui/lucide-icons';
import * as Clipboard from 'expo-clipboard';
import { getMyGroups } from '../../api/group.service';
import { useAuthStore } from '../../store/auth.store';

export default function GroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const router = useRouter();
  const { updateUser } = useAuthStore();

  const handleCopy = async (code: string) => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Success', 'Invite code copied!');
  };

  const fetchGroups = async () => {
    try {
      const data = await getMyGroups();
      setGroups(data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchGroups();
  };

  if (loading) {
    return (
      <YStack f={1} jc="center" ai="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <YStack f={1} bc="$background">
      <XStack p="$4" ai="center" jc="space-between" mt="$4">
        <H2 size="$7" fontWeight="800" color="$blue10">My Groups</H2>
        <Button circular icon={<Plus size={24} />} bc="$blue10" onPress={() => router.push('/(onboarding)/create-group')} />
      </XStack>

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View px="$4" py="$2">
            <Card
              p="$4"
              br="$6"
              elevation={1}
              bc="$background"
              onPress={() => {
                updateUser({ groupId: item.id, hasGroup: true });
                router.push('/');
              }}
              pressStyle={{ scale: 0.98 }}
            >
              <XStack jc="space-between" ai="center">
                <XStack gap="$4" ai="center">
                  <YStack bc="$blue4" p="$3" br="$5">
                    <UsersIcon size={24} color="$blue10" />
                  </YStack>
                  <YStack>
                    <Text fontSize="$5" fontWeight="700">{item.name}</Text>
                    <XStack ai="center" gap="$2">
                      <Text fontSize="$3" color="$gray10">{item.membersCount} members</Text>
                      <Text fontSize="$3" color="$gray8">•</Text>
                      <XStack ai="center" gap="$1" onPress={() => handleCopy(item.inviteCode)}>
                        <Text fontSize="$3" color="$blue10" fontWeight="600">{item.inviteCode}</Text>
                        <Copy size={12} color="$blue10" />
                      </XStack>
                    </XStack>
                  </YStack>
                </XStack>
                <ChevronRight size={20} color="$gray9" />
              </XStack>
            </Card>
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <YStack ai="center" jc="center" p="$10" gap="$4">
            <Text color="$gray10" fontSize="$5">You are not in any groups yet.</Text>
            <Button bc="$blue10" onPress={() => router.push('/(onboarding)/group-choice')}>
              <Text color="white">Create or Join Group</Text>
            </Button>
          </YStack>
        }
      />
    </YStack>
  );
}
