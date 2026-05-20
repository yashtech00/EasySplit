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
              <Card 
                padding="$4" 
                borderRadius="$8" 
                borderWidth={1}
                borderColor="$gray3"
                backgroundColor="white"
                elevation={0}
              >
                <XStack justifyContent="space-between" alignItems="center" gap="$3">
                  <XStack gap="$4" alignItems="center" f={1}>
                    <YStack 
                      backgroundColor={isPayer ? '$red2' : '$green2'} 
                      padding="$3" 
                      borderRadius="$9"
                      width={52}
                      height={52}
                      alignItems="center"
                      justifyContent="center"
                    >
                      {isPayer ? (
                        <ArrowUpRight size={22} color="$red11" />
                      ) : (
                        <ArrowDownLeft size={22} color="$green11" />
                      )}
                    </YStack>
                    <YStack gap="$0.5" f={1}>
                      <Text fontSize="$4" fontWeight="700" color="$gray12" numberOfLines={1}>
                        {isPayer ? `Paid to ${item.payee.name}` : `Received from ${item.payer.name}`}
                      </Text>
                      <Text fontSize="$2.5" color="$gray6" fontWeight="600">{item.share.expense.title}</Text>
                      <Text fontSize="$2" color="$gray5" fontWeight="500">
                        {new Date(item.confirmedAt || item.initiatedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </Text>
                    </YStack>
                  </XStack>
                  <YStack alignItems="flex-end" gap="$1.5" jc="center">
                    <Text fontSize="$5" fontWeight="800" color={isPayer ? '$red11' : '$green11'}>
                      {isPayer ? '-' : '+'}₹{item.amount}
                    </Text>
                    <XStack 
                      backgroundColor={item.status === 'CONFIRMED' ? '$green2' : '$orange2'} 
                      px="$2.5" 
                      py="$1" 
                      borderRadius="$4"
                      ai="center"
                      jc="center"
                    >
                      <Text fontSize="$1" fontWeight="800" color={item.status === 'CONFIRMED' ? '$green11' : '$orange11'} letterSpacing={0.5}>
                        {item.status}
                      </Text>
                    </XStack>
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
