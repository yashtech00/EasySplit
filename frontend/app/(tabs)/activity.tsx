import { useState, useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { YStack, XStack, Text, H2, Card, Spinner, View } from 'tamagui';
import { ReceiptText, ArrowUpRight, ArrowDownLeft } from '@tamagui/lucide-icons';
import { getPaymentHistory } from '../../api/payment.service';
import { useAuthStore } from '../../store/auth.store';

export default function ActivityScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [payments, setPayments] = useState<any[]>([]);
  const { user } = useAuthStore();

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
      <YStack f={1} jc="center" ai="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <YStack f={1} bc="$background">
      <XStack p="$4" ai="center" mt="$4">
        <H2 size="$7" fontWeight="800" color="$blue10">Activity</H2>
      </XStack>

      <FlatList
        data={payments}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isPayer = item.payer.id === user?.id;
          return (
            <View px="$4" py="$2">
              <Card p="$4" br="$6" elevation={1} bc="$background">
                <XStack jc="space-between" ai="center">
                  <XStack gap="$4" ai="center">
                    <YStack bc={isPayer ? '$red2' : '$green2'} p="$3" br="$5">
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
                  <YStack ai="flex-end" gap="$2">
                    <Text fontSize="$5" fontWeight="800" color={isPayer ? '$red10' : '$green10'}>
                      {isPayer ? '-' : '+'}₹{item.amount}
                    </Text>
                    <View bc={item.status === 'CONFIRMED' ? '$green4' : '$orange4'} px="$2" py="$1" br="$2">
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
        ListEmptyComponent={
          <YStack ai="center" jc="center" p="$10" gap="$4">
            <ReceiptText size={48} color="$gray5" />
            <Text color="$gray10" fontSize="$5">No recent activity.</Text>
          </YStack>
        }
      />
    </YStack>
  );
}
