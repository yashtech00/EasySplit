import { useState, useEffect, useCallback } from 'react';
import { FlatList, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Button, H2, View, Spinner, Avatar } from 'tamagui';
import { Plus, Menu, User as UserIcon } from '@tamagui/lucide-icons';
import { BalanceCard } from '../../components/BalanceCard';
import { ExpenseCard } from '../../components/ExpenseCard';
import { getGroupExpenses } from '../../api/expense.service';
import { getGroupBalance, sendReminder } from '../../api/group.service';
import { getUserStats } from '../../api/user.service';
import { useAuthStore } from '../../store/auth.store';

export default function HomeScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [balance, setBalance] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const { user } = useAuthStore();
  const router = useRouter();

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
      <YStack f={1} jc="center" ai="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <YStack f={1} bc="$background">
      {/* Header */}
      <XStack p="$4" ai="center" jc="space-between" bc="$background" elevation={1}>
        <Button circular icon={<Menu size={24} />} bc="transparent" />
        <H2 size="$6" fontWeight="800" color="$blue10">SplitEasy</H2>
        <Button 
          circular 
          icon={<UserIcon size={24} />} 
          bc="transparent" 
          onPress={() => router.push('/profile')}
        />
      </XStack>

      <FlatList
        data={expenses}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View px="$4" py="$2">
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
          <YStack p="$4" gap="$6">
            <BalanceCard
              direction={balance?.netBalance?.direction || 'SETTLED'}
              amount={balance?.netBalance?.amount || 0}
              personName={balance?.netBalance?.person?.name}
              totalGroupSpend={balance?.totalGroupSpend || 0}
              onRemind={handleRemind}
              onPress={() => router.push(`/group/${user?.groupId}/balance`)}
            />
            <XStack jc="space-between" ai="center">
              <Text fontSize="$6" fontWeight="700">Recent Expenses</Text>
              <Button size="$2" bc="transparent" onPress={onRefresh}>
                <Text color="$blue10">See All</Text>
              </Button>
            </XStack>
          </YStack>
        }
        ListEmptyComponent={
          <YStack ai="center" jc="center" p="$10" gap="$4">
            <Text color="$gray10" fontSize="$5">No expenses yet. Add your first expense!</Text>
          </YStack>
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 100 }}
      />

      {/* FAB */}
      <Button
        position="absolute"
        bottom={30}
        right={30}
        size="$6"
        circular
        bc="$blue10"
        elevation={5}
        icon={<Plus size={32} color="white" />}
        onPress={() => router.push('/expense/add')}
      />
    </YStack>
  );
}
