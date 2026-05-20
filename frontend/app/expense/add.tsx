import { useState } from 'react';
import { Alert, Platform } from 'react-native';
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

      <YStack gap="$4" f={1}>
        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">TITLE *</Label>
          <Input
            size="$5"
            placeholder="e.g. Auto, Lunch"
            value={title}
            onChangeText={setTitle}
            autoFocus
          />
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">AMOUNT (₹) *</Label>
          <Input
            size="$5"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
          />
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">DESCRIPTION (OPTIONAL)</Label>
          <TextArea
            size="$5"
            placeholder="What was this for?"
            value={description}
            onChangeText={setDescription}
            h={100}
          />
        </YStack>

        <XStack gap="$4">
          <YStack f={1} gap="$2">
            <Label fontWeight="600" color="$gray11">DATE</Label>
            <Button
              bc="$gray2"
              icon={<CalendarIcon size={20} color="$gray9" />}
              onPress={() => setShowDatePicker(true)}
            >
              <Text color="$gray11">{date.toLocaleDateString('en-IN')}</Text>
            </Button>
          </YStack>

          <YStack f={1} gap="$2">
            <Label fontWeight="600" color="$gray11">TIME</Label>
            <Button
              bc="$gray2"
              icon={<Clock size={20} color="$gray9" />}
              onPress={() => setShowTimePicker(true)}
            >
              <Text color="$gray11">
                {date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </Button>
          </YStack>
        </XStack>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onDateChange}
          />
        )}

        {showTimePicker && (
          <DateTimePicker
            value={date}
            mode="time"
            is24Hour={true}
            display="default"
            onChange={onTimeChange}
          />
        )}

        <YStack mt="$4" p="$4" bc="$blue1" br="$4" gap="$2">
          <Text fontWeight="700" color="$blue10">Split Details</Text>
          <Text color="$gray11">✓ Equal split (₹{(parseFloat(amount) || 0) / 2} each)</Text>
          <XStack jc="space-between" mt="$2">
            <Text color="$gray10">Your share:</Text>
            <Text fontWeight="600">₹{(parseFloat(amount) || 0) / 2} [✓ Paid]</Text>
          </XStack>
          <XStack jc="space-between">
            <Text color="$gray10">Friend's share:</Text>
            <Text fontWeight="600" color="$orange10">₹{(parseFloat(amount) || 0) / 2} [⏳ Pending]</Text>
          </XStack>
        </YStack>

        <Button
          mt="auto"
          size="$5"
          bc="$blue10"
          onPress={handleAddExpense}
          disabled={loading}
          iconAfter={loading ? <Spinner color="white" /> : <Save color="white" />}
        >
          <Text color="white" fontWeight="600" fontSize="$5">
            {loading ? 'Adding...' : 'ADD EXPENSE'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
