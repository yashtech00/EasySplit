import { useState, useEffect, useCallback, useRef } from 'react';
import { FlatList, RefreshControl, Alert, View as RNView, NativeSyntheticEvent, NativeScrollEvent, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, H2, View, Spinner, Avatar, useTheme } from 'tamagui';
import { Plus, Menu, User as UserIcon } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BalanceCard } from '../../components/BalanceCard';
import { ExpenseCard } from '../../components/ExpenseCard';
import { getGroupExpenses } from '../../api/expense.service';
import { getGroupBalance, sendReminder } from '../../api/group.service';
import { getUserStats } from '../../api/user.service';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const { user } = useAuthStore();
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { isTabBarVisible, setTabBarVisible, isHeaderVisible, setHeaderVisible } = useUIStore();
  
  // Calculate dynamic bottom padding and tab bar height to position FAB properly above it
  const bottomPadding = insets.bottom > 0 ? insets.bottom : (Platform.OS === 'ios' ? 20 : 12);
  const tabBarHeight = 50 + bottomPadding + 10;
  const fabBottom = isTabBarVisible 
    ? tabBarHeight + 20 
    : (insets.bottom > 0 ? insets.bottom + 15 : 20);
  
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

  const fetchData = useCallback(async () => {
    if (!user?.groupId) return;
    
    try {
      const [userStats, groupBalance] = await Promise.all([
        getUserStats(),
        getGroupBalance(user.groupId), 
      ]);
      
      const expenseData = await getGroupExpenses(user.groupId);
      
      setStats(userStats);
      setBalance(groupBalance);
      setExpenses(expenseData.expenses);
    } catch (error) {
      console.error('Error fetching home data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleRemind = async () => {
    if (!user?.groupId) return;
    try {
      await sendReminder(user.groupId, balance.netBalance.person.id);
      Alert.alert('Success', 'Reminder sent!');
    } catch (error: any) {
      if (error.response?.status === 429) {
        Alert.alert('Slow down', 'Already reminded today');
      } else {
        Alert.alert('Error', 'Failed to send reminder');
      }
    }
  };

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={isHeaderVisible ? insets.top : 0}>
      {/* Header */}
      {isHeaderVisible && (
        <XStack 
          paddingHorizontal="$4" 
          paddingVertical="$2"
          alignItems="center" 
          justifyContent="center" 
          backgroundColor="$background" 
          elevation={1}
          zIndex={10}
        >
        <H2 size="$6" fontWeight="800" color="$blue10" textTransform="uppercase">SplitEasy</H2>
        </XStack>
      )}

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => (
          <View paddingHorizontal="$4" paddingVertical="$2">
            <ExpenseCard
              title={item.title}
              amount={item.amount}
              date={item.date}
              shareStatus={
                item.isSettled ? 'SETTLED' : 
                item.addedBy.id === user?.id ? 'OWES_YOU' : 'YOU_OWE'
              }
              shareAmount={item.myShare.shareAmount}
              onPress={() => router.push(`/expense/${item.id}`)}
            />
          </View>
        )}
        ListHeaderComponent={
          <YStack padding="$4" gap="$6">
            <BalanceCard
              direction={balance?.netBalance?.direction || 'SETTLED'}
              amount={balance?.netBalance?.amount || 0}
              personName={balance?.netBalance?.person?.name}
              totalGroupSpend={balance?.totalGroupSpend || 0}
              onRemind={handleRemind}
              onPress={() => router.push(`/group/${user?.groupId}/balance`)}
            />
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$6" fontWeight="700">Recent Expenses</Text>
              <Button size="$2" backgroundColor="transparent" onPress={onRefresh}>
                <Text color="$blue10">See All</Text>
              </Button>
            </XStack>
          </YStack>
        }
        ListEmptyComponent={
          <YStack alignItems="center" justifyContent="center" padding="$10" gap="$4">
            <Text color="$gray10" fontSize="$5">No expenses yet. Add your first expense!</Text>
          </YStack>
        }
        refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={{ paddingBottom: 120 }}
        />

      {/* FAB */}
      <Button
        position="absolute"
        bottom={fabBottom}
        right={20}
        size="$6"
        circular
        backgroundColor="$blue10"
        elevation={5}
        icon={<Plus size={32} color="white" />}
        onPress={() => router.push('/expense/add')}
        zIndex={100}
      />
    </YStack>
  );
}
