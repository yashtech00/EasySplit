import { useState, useEffect } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../../../hooks/use-safe-router';
import { YStack, XStack, Text, Button, H1, Spinner, Card, Separator } from 'tamagui';
import { ChevronLeft, Send, BarChart3, TrendingUp, TrendingDown } from '@tamagui/lucide-icons';
import { getGroupBalance, sendReminder } from '../../../api/group.service';
import { useAuthStore } from '../../../store/auth.store';

export default function BalanceSummaryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [reminding, setReminding] = useState(false);
  const router = useSafeRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await getGroupBalance(id as string);
        setBalance(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch balance summary');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchBalance();
  }, [id]);

  const handleRemind = async () => {
    if (!balance?.netBalance?.person?.id) return;
    setReminding(true);
    try {
      await sendReminder(id as string, balance.netBalance.person.id);
      Alert.alert('Success', 'Reminder sent!');
    } catch (error: any) {
      if (error.response?.status === 429) {
        Alert.alert('Slow down', 'Already reminded today');
      } else {
        Alert.alert('Error', 'Failed to send reminder');
      }
    } finally {
      setReminding(false);
    }
  };

  if (loading) {
    return (
      <YStack f={1} jc="center" ai="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  const isOwed = balance.netBalance.direction === 'THEY_OWE_YOU';
  const isSettled = balance.netBalance.direction === 'SETTLED';

  return (
    <YStack f={1} bc="$background">
      <XStack p="$4" ai="center" mt="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          bc="transparent"
        />
        <H1 size="$7">Balance Summary</H1>
      </XStack>

      <ScrollView>
        <YStack p="$6" gap="$6">
          <Card p="$8" br="$8" elevation={2} bc="$blue1" ai="center">
            <BarChart3 size={40} color="$blue10" />
            <Text mt="$4" color="$gray10" fontSize="$4">Overall Balance</Text>
            {isSettled ? (
              <Text fontSize="$8" fontWeight="800" color="$gray10" mt="$2">All Settled ✅</Text>
            ) : (
              <>
                <Text fontSize="$9" fontWeight="800" color={isOwed ? '$green10' : '$red10'} mt="$2">
                  ₹{balance.netBalance.amount}
                </Text>
                <Text color="$gray11" fontSize="$4" mt="$1">
                  {isOwed ? `${balance.netBalance.person.name} owes you` : `You owe ${balance.netBalance.person.name}`}
                </Text>
              </>
            )}
            
            {!isSettled && isOwed && (
              <Button
                mt="$6"
                size="$4"
                bc="$blue10"
                onPress={handleRemind}
                disabled={reminding}
                icon={reminding ? <Spinner color="white" /> : <Send size={18} color="white" />}
              >
                <Text color="white" fontWeight="700">SEND REMINDER</Text>
              </Button>
            )}
          </Card>

          <YStack gap="$4">
            <Text fontWeight="700" color="$gray11" fontSize="$5">Group Statistics</Text>
            <XStack jc="space-between" p="$4" bc="$gray2" br="$4">
              <Text color="$gray10">Total Group Spend</Text>
              <Text fontWeight="700">₹{balance.totalGroupSpend}</Text>
            </XStack>
          </YStack>

          <Separator />

          <YStack gap="$4">
            <Text fontWeight="700" color="$gray11" fontSize="$5">Your Share</Text>
            <YStack p="$4" bc="$gray2" br="$4" gap="$2">
              <XStack jc="space-between">
                <Text color="$gray10">Total Target</Text>
                <Text fontWeight="700">₹{balance.yourShare}</Text>
              </XStack>
              <XStack jc="space-between">
                <Text color="$gray10">Status</Text>
                <XStack ai="center" gap="$2">
                  {!isOwed && !isSettled ? (
                    <TrendingDown size={16} color="$red10" />
                  ) : (
                    <TrendingUp size={16} color="$green10" />
                  )}
                  <Text fontWeight="600" color={!isOwed && !isSettled ? '$red10' : '$green10'}>
                    {!isOwed && !isSettled ? 'Pending' : 'Settled'}
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </YStack>

          <YStack gap="$4">
            <Text fontWeight="700" color="$gray11" fontSize="$5">Friend's Share</Text>
            <YStack p="$4" bc="$gray2" br="$4" gap="$2">
              <XStack jc="space-between">
                <Text color="$gray10">Total Target</Text>
                <Text fontWeight="700">₹{balance.theirShare}</Text>
              </XStack>
              <XStack jc="space-between">
                <Text color="$gray10">Status</Text>
                <XStack ai="center" gap="$2">
                  {isOwed ? (
                    <TrendingDown size={16} color="$red10" />
                  ) : (
                    <TrendingUp size={16} color="$green10" />
                  )}
                  <Text fontWeight="600" color={isOwed ? '$red10' : '$green10'}>
                    {isOwed ? 'Pending' : 'Settled'}
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
