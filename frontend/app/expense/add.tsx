import { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeRouter } from '../../hooks/use-safe-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner, TextArea } from 'tamagui';
import { ChevronLeft, Save, Calendar as CalendarIcon, Clock } from '@tamagui/lucide-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { addExpense } from '../../api/expense.service';
import { useAuthStore } from '../../store/auth.store';

export default function AddExpenseScreen() {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();
  const { user } = useAuthStore();

  const handleAddExpense = async () => {
    if (!title.trim() || !amount) {
      Alert.alert('Error', 'Please enter title and amount');
      return;
    }

    if (!user?.groupId) {
      Alert.alert('Error', 'No active group found');
      return;
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      await addExpense({
        groupId: user.groupId,
        title,
        amount: numAmount,
        description,
        date: date.toISOString(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to add expense');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const newDate = new Date(date);
      newDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
      setDate(newDate);
    }
  };

  const onTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      const newDate = new Date(date);
      newDate.setHours(selectedTime.getHours(), selectedTime.getMinutes());
      setDate(newDate);
    }
  };

  return (
    <YStack f={1} bc="$background" p="$6" gap="$6">
      <XStack ai="center" mt="$4" jc="space-between">
        <XStack ai="center" gap="$4">
          <Button
            circular
            icon={<ChevronLeft size={24} />}
            onPress={() => router.back()}
            bc="transparent"
          />
          <H1 size="$7">Add Expense</H1>
        </XStack>
        <Button
          bc="transparent"
          onPress={handleAddExpense}
          disabled={loading}
        >
          <Text color="$blue10" fontWeight="700">SAVE</Text>
        </Button>
      </XStack>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        <YStack gap="$5" backgroundColor="white" padding="$5" borderRadius="$8" borderWidth={1} borderColor="$gray3">
          <YStack gap="$2">
            <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>TITLE *</Label>
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
                placeholder="e.g. Auto, Lunch"
                value={title}
                onChangeText={setTitle}
                backgroundColor="transparent"
                fontSize="$4"
                fontWeight="600"
                color="$gray12"
                autoFocus
              />
            </XStack>
          </YStack>

        <YStack gap="$2">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>AMOUNT (₹) *</Label>
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
            <Text color="$gray9" fontWeight="700" marginRight="$2">₹</Text>
            <Input
              flex={1}
              borderWidth={0}
              placeholder="0.00"
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="700"
              color="$gray12"
            />
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>DESCRIPTION (OPTIONAL)</Label>
          <XStack 
            alignItems="center" 
            backgroundColor="white" 
            borderWidth={1}
            borderColor="$gray4"
            borderRadius="$6" 
            px="$3.5"
            py="$2"
            height={100}
            focusStyle={{ borderColor: '$blue10' }}
          >
            <TextArea
              flex={1}
              borderWidth={0}
              placeholder="What was this for?"
              value={description}
              onChangeText={setDescription}
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="600"
              color="$gray12"
              h="100%"
            />
          </XStack>
        </YStack>

        <XStack gap="$4">
          <YStack f={1} gap="$2">
            <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>DATE</Label>
            <Button
              bc="$gray2"
              borderWidth={1}
              borderColor="$gray3"
              height={48}
              br="$6"
              icon={<CalendarIcon size={18} color="$gray9" />}
              onPress={() => setShowDatePicker(true)}
            >
              <Text color="$gray11" fontWeight="600">{date.toLocaleDateString('en-IN')}</Text>
            </Button>
          </YStack>

          <YStack f={1} gap="$2">
            <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>TIME</Label>
            <Button
              bc="$gray2"
              borderWidth={1}
              borderColor="$gray3"
              height={48}
              br="$6"
              icon={<Clock size={18} color="$gray9" />}
              onPress={() => setShowTimePicker(true)}
            >
              <Text color="$gray11" fontWeight="600">
                {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Button>
          </YStack>
        </XStack>

        <YStack mt="$2" p="$4" bc="$blue1" br="$6" bw={1} boc="$blue3" gap="$2.5">
          <Text fontWeight="800" color="$blue10" fontSize="$2.5" letterSpacing={0.5} textTransform="uppercase">Split Details</Text>
          <Text color="$gray12" fontWeight="700" fontSize="$3.5">✓ Equal split (₹{(parseFloat(amount) || 0) / 2} each)</Text>
          <XStack jc="space-between" mt="$1">
            <Text color="$gray7" fontWeight="600">Your share:</Text>
            <XStack bc="$green2" px="$2" py="$0.5" br="$3">
              <Text fontWeight="700" color="$green11" fontSize="$2">₹{(parseFloat(amount) || 0) / 2} • PAID</Text>
            </XStack>
          </XStack>
          <XStack jc="space-between">
            <Text color="$gray7" fontWeight="600">Friend's share:</Text>
            <XStack bc="$orange2" px="$2" py="$0.5" br="$3">
              <Text fontWeight="700" color="$orange11" fontSize="$2">₹{(parseFloat(amount) || 0) / 2} • PENDING</Text>
            </XStack>
          </XStack>
        </YStack>

          <Button
            size="$5"
            bc="$blue10"
            hoverStyle={{ backgroundColor: '$blue11' }}
            pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
            onPress={handleAddExpense}
            disabled={loading}
            br="$9"
            iconAfter={loading ? <Spinner color="white" /> : <Save color="white" />}
          >
            <Text color="white" fontWeight="700" letterSpacing={0.5}>
              {loading ? 'ADDING...' : 'ADD EXPENSE'}
            </Text>
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
