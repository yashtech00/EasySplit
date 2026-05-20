import { useState, useEffect } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../../hooks/use-safe-router';
import { YStack, XStack, Text, Button, H1, Spinner, View, Card } from 'tamagui';
import { ChevronLeft, MoreVertical, Calendar, Clock, CheckCircle2, Timer } from '@tamagui/lucide-icons';
import { getExpenseDetails, deleteExpense } from '../../api/expense.service';
import { useAuthStore } from '../../store/auth.store';

export default function ExpenseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [expense, setExpense] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useSafeRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getExpenseDetails(id as string);
        setExpense(data);
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch expense details');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleDelete = async () => {
    Alert.alert(
      'Delete Expense?',
      'This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteExpense(id as string);
              router.back();
            } catch (error: any) {
              Alert.alert('Error', error.response?.data?.message || 'Failed to delete expense');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <YStack f={1} jc="center" ai="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  const myShare = expense.shares.find((s: any) => s.userId === user?.id);
  const otherShare = expense.shares.find((s: any) => s.userId !== user?.id);
  const isPayer = expense.addedBy.id === user?.id;

  return (
    <YStack f={1} bc="$background">
      <XStack p="$4" ai="center" jc="space-between" mt="$4">
        <XStack ai="center" gap="$4">
          <Button
            circular
            icon={<ChevronLeft size={24} />}
            onPress={() => router.back()}
            bc="transparent"
          />
          <H1 size="$7">{expense.title}</H1>
        </XStack>
        <Button circular icon={<MoreVertical size={24} />} bc="transparent" onPress={() => {
            // Show menu with Edit/Delete
            Alert.alert('Options', 'Choose an action', [
                { text: 'Edit', onPress: () => router.push(`/expense/${id}/edit`) },
                { text: 'Delete', onPress: handleDelete, style: 'destructive' },
                { text: 'Cancel', style: 'cancel' }
            ]);
        }} />
      </XStack>

      <ScrollView>
        <YStack p="$6" gap="$6">
          <YStack ai="center" gap="$2">
            <Text color="$gray10">Added by: {expense.addedBy.name}</Text>
            <XStack gap="$4">
              <XStack ai="center" gap="$1">
                <Calendar size={14} color="$gray9" />
                <Text color="$gray9">{new Date(expense.date).toLocaleDateString()}</Text>
              </XStack>
              <XStack ai="center" gap="$1">
                <Clock size={14} color="$gray9" />
                <Text color="$gray9">{new Date(expense.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </XStack>
            </XStack>
          </YStack>

          <Card 
            p="$6" 
            br="$8" 
            bw={1}
            boc="$gray3"
            bc="white" 
            elevation={0} 
            ai="center"
          >
            <Text color="$gray10" fontSize="$2.5" fontWeight="700" textTransform="uppercase" letterSpacing={0.5}>Total Amount</Text>
            <Text fontSize="$9" fontWeight="900" color="$blue10" mt="$1">₹{expense.amount}</Text>
          </Card>

          {expense.description && (
            <YStack gap="$2" backgroundColor="white" p="$4" br="$6" bw={1} boc="$gray3">
              <Text fontWeight="800" color="$gray12" fontSize="$2" textTransform="uppercase" letterSpacing={0.5}>Description</Text>
              <Text color="$gray10" fontSize="$4" fontWeight="500">{expense.description}</Text>
            </YStack>
          )}

          <YStack gap="$4">
            <Text fontWeight="800" color="$gray11" fontSize="$2.5" textTransform="uppercase" letterSpacing={0.5}>Split Details</Text>
            
            {/* Current User Share */}
            <XStack jc="space-between" ai="center" p="$4" bc="white" br="$8" bw={1} boc="$gray3">
              <YStack gap="$1">
                <Text fontWeight="700" color="$gray12" fontSize="$4">{isPayer ? 'You (Paid)' : 'You'}</Text>
                <Text color="$gray6" fontWeight="600" fontSize="$2.5">Share: ₹{myShare.shareAmount}</Text>
              </YStack>
              {myShare.isPaid ? (
                <XStack ai="center" gap="$1" bc="$green2" px="$2.5" py="$1" br="$4">
                  <CheckCircle2 size={14} color="$green11" />
                  <Text color="$green11" fontWeight="700" fontSize="$1" textTransform="uppercase" letterSpacing={0.5}>Paid</Text>
                </XStack>
              ) : (
                <XStack ai="center" gap="$1" bc="$orange2" px="$2.5" py="$1" br="$4">
                  <Timer size={14} color="$orange11" />
                  <Text color="$orange11" fontWeight="700" fontSize="$1" textTransform="uppercase" letterSpacing={0.5}>Pending</Text>
                </XStack>
              )}
            </XStack>

            {/* Other User Share */}
            <XStack jc="space-between" ai="center" p="$4" bc="white" br="$8" bw={1} boc="$gray3">
              <YStack gap="$1">
                <Text fontWeight="700" color="$gray12" fontSize="$4">{otherShare.user.name}</Text>
                <Text color="$gray6" fontWeight="600" fontSize="$2.5">Share: ₹{otherShare.shareAmount}</Text>
              </YStack>
              {otherShare.isPaid ? (
                <XStack ai="center" gap="$1" bc="$green2" px="$2.5" py="$1" br="$4">
                  <CheckCircle2 size={14} color="$green11" />
                  <Text color="$green11" fontWeight="700" fontSize="$1" textTransform="uppercase" letterSpacing={0.5}>Paid</Text>
                </XStack>
              ) : (
                <XStack ai="center" gap="$1" bc="$orange2" px="$2.5" py="$1" br="$4">
                  <Timer size={14} color="$orange11" />
                  <Text color="$orange11" fontWeight="700" fontSize="$1" textTransform="uppercase" letterSpacing={0.5}>Pending</Text>
                </XStack>
              )}
            </XStack>
          </YStack>

          {!isPayer && !myShare.isPaid && (
            <Button
              size="$5"
              bc="$blue10"
              hoverStyle={{ backgroundColor: '$blue11' }}
              pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
              onPress={() => router.push(`/payment/${myShare.id}`)}
              br="$9"
            >
              <Text color="white" fontWeight="700" letterSpacing={0.5}>PAY ₹{myShare.shareAmount}</Text>
            </Button>
          )}

          {isPayer && !otherShare.isPaid && (
            <Button
              size="$5"
              bc="$blue10"
              hoverStyle={{ backgroundColor: '$blue11' }}
              pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
              onPress={() => Alert.alert('Reminder', 'Reminder sent!')}
              br="$9"
            >
              <Text color="white" fontWeight="700" letterSpacing={0.5}>SEND PAYMENT REMINDER</Text>
            </Button>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
