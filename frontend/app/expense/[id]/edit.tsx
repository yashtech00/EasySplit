import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../../../hooks/use-safe-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner, TextArea } from 'tamagui';
import { ChevronLeft, Save, Calendar as CalendarIcon, Clock } from '@tamagui/lucide-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getExpenseDetails, updateExpense } from '../../../api/expense.service';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const router = useSafeRouter();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const data = await getExpenseDetails(id as string);
        // Check if any payments have been made
        const hasPayments = data.shares.some((s: any) => s.isPaid && s.userId !== data.addedBy.id);
        if (hasPayments) {
          Alert.alert('Cannot Edit', 'This expense has already been partially paid.');
          router.back();
          return;
        }

        setTitle(data.title);
        setAmount(data.amount.toString());
        setDescription(data.description || '');
        setDate(new Date(data.date));
      } catch (error) {
        Alert.alert('Error', 'Failed to fetch expense details');
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [id]);

  const handleUpdateExpense = async () => {
    setSaving(true);
    try {
      await updateExpense(id as string, {
        description,
        date: date.toISOString(),
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', 'Failed to update expense');
    } finally {
      setSaving(false);
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

  if (loading) {
    return (
      <YStack f={1} jc="center" ai="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

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
          <H1 size="$7">Edit Expense</H1>
        </XStack>
        <Button
          bc="transparent"
          onPress={handleUpdateExpense}
          disabled={saving}
        >
          <Text color="$blue10" fontWeight="700">SAVE</Text>
        </Button>
      </XStack>

      <YStack gap="$4" f={1}>
        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">TITLE (READ-ONLY)</Label>
          <Input size="$5" value={title} disabled bc="$gray2" />
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">AMOUNT (₹) (READ-ONLY)</Label>
          <Input size="$5" value={amount} disabled bc="$gray2" />
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

        <Button
          mt="auto"
          size="$5"
          bc="$blue10"
          onPress={handleUpdateExpense}
          disabled={saving}
          iconAfter={saving ? <Spinner color="white" /> : <Save color="white" />}
        >
          <Text color="white" fontWeight="600" fontSize="$5">
            {saving ? 'Saving...' : 'SAVE CHANGES'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
