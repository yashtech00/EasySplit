import { useState, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, Alert, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, H2, Card, Spinner, View } from 'tamagui';
import { Users as UsersIcon, Plus, ChevronRight, Copy } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { getMyGroups } from '../../api/group.service';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';

export default function GroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [groups, setGroups] = useState<any[]>([]);
  const router = useRouter();
  const { updateUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { setTabBarVisible, isHeaderVisible, setHeaderVisible } = useUIStore();
  const lastScrollY = useRef(0);

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const currentOffset = event.nativeEvent.contentOffset.y;
    const direction = currentOffset > lastScrollY.current ? 'down' : 'up';
    
    if (Math.abs(currentOffset - lastScrollY.current) > 10) {
      if (direction === 'down' && currentOffset > 50) {
        setTabBarVisible(false);
        setHeaderVisible(false);
      } else {
        setTabBarVisible(true);
        setHeaderVisible(true);
      }
      lastScrollY.current = currentOffset;
    }
  };

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
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={isHeaderVisible ? insets.top : 0}>
      {isHeaderVisible && (
        <XStack padding="$4" alignItems="center" justifyContent="space-between">
          <H2 size="$7" fontWeight="800" color="$blue10">My Groups</H2>
          <Button circular icon={<Plus size={24} />} backgroundColor="$blue10" onPress={() => router.push('/(onboarding)/create-group')} />
        </XStack>
      )}

      <FlatList
        data={groups}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View paddingHorizontal="$4" paddingVertical="$2">
            <Card
              padding="$4"
              borderRadius="$6"
              elevation={1}
              backgroundColor="$background"
              onPress={() => {
                updateUser({ groupId: item.id, hasGroup: true });
                router.push('/');
              }}
              pressStyle={{ scale: 0.98 }}
            >
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$4" alignItems="center">
                  <YStack backgroundColor="$blue4" padding="$3" borderRadius="$5">
                    <UsersIcon size={24} color="$blue10" />
                  </YStack>
                  <YStack>
                    <Text fontSize="$5" fontWeight="700">{item.name}</Text>
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize="$3" color="$gray10">{item.membersCount} members</Text>
                      <Text fontSize="$3" color="$gray8">•</Text>
                      <XStack alignItems="center" gap="$1" onPress={() => handleCopy(item.inviteCode)}>
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
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <YStack alignItems="center" justifyContent="center" padding="$10" gap="$4">
            <UsersIcon size={48} color="$gray5" />
            <Text color="$gray10" fontSize="$5">You're not in any groups yet.</Text>
            <Button backgroundColor="$blue10" onPress={() => router.push('/(onboarding)/create-group')}>
              Create a Group
            </Button>
            <Text color="$gray8">or</Text>
            <Button variant="outlined" borderColor="$blue10" onPress={() => router.push('/(onboarding)/join-group')}>
              <Text color="$blue10">Join a Group</Text>
            </Button>
          </YStack>
        }
      />
    </YStack>
  );
}
