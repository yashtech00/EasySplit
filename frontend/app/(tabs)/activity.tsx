import { useState, useEffect, useRef } from 'react';
import { FlatList, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { YStack, XStack, Text, H2, Card, Spinner, View } from 'tamagui';
import { ReceiptText, ArrowUpRight, ArrowDownLeft } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPaymentHistory } from '../../api/payment.service';
import { useAuthStore } from '../../store/auth.store';
import { useUIStore } from '../../store/ui.store';

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const { user } = useAuthStore();
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

  const fetchActivity = async () => {
    try {
      const data = await getPaymentHistory();
      setPayments(data.payments);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchActivity();
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
        <XStack padding="$4" alignItems="center">
          <H2 size="$7" fontWeight="800" color="$blue10">Activity</H2>
        </XStack>
      )}

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        onScroll={onScroll}
        scrollEventThrottle={16}
        renderItem={({ item }) => {
          const isPayer = item.payer.id === user?.id;
          return (
            <View paddingHorizontal="$4" paddingVertical="$2">
              <Card padding="$4" borderRadius="$6" elevation={1} backgroundColor="$background">
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$4" alignItems="center">
                    <YStack backgroundColor={isPayer ? '$red2' : '$green2'} padding="$3" borderRadius="$5">
                      {isPayer ? (
                        <ArrowUpRight size={24} color="$red10" />
                      ) : (
                        <ArrowDownLeft size={24} color="$green10" />
                      )}
                    </YStack>
                    <YStack>
                      <Text fontSize="$4" fontWeight="700">
                        {isPayer ? `Paid to ${item.payee.name}` : `Received from ${item.payer.name}`}
                      </Text>
                      <Text fontSize="$3" color="$gray10">{item.share.expense.title}</Text>
                      <Text fontSize="$2" color="$gray8">
                        {new Date(item.confirmedAt || item.initiatedAt).toLocaleDateString()}
                      </Text>
                    </YStack>
                  </XStack>
                  <YStack alignItems="flex-end" gap="$2">
                    <Text fontSize="$5" fontWeight="800" color={isPayer ? '$red10' : '$green10'}>
                      {isPayer ? '-' : '+'}₹{item.amount}
                    </Text>
                    <View backgroundColor={item.status === 'CONFIRMED' ? '$green4' : '$orange4'} paddingHorizontal="$2" paddingVertical="$1" borderRadius="$2">
                      <Text fontSize="$1" fontWeight="700" color={item.status === 'CONFIRMED' ? '$green10' : '$orange10'}>
                        {item.status}
                      </Text>
                    </View>
                  </YStack>
                </XStack>
              </Card>
            </View>
          );
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={{ paddingBottom: 120 }}
        ListEmptyComponent={
          <YStack alignItems="center" justifyContent="center" padding="$10" gap="$4">
            <ReceiptText size={48} color="$gray5" />
            <Text color="$gray10" fontSize="$5">No recent activity.</Text>
          </YStack>
        }
      />
    </YStack>
  );
}
