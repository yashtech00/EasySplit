import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking, AppState, Image } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, XStack, Text, Button, H1, Spinner, View, Card } from 'tamagui';
import { ChevronLeft, Smartphone, CheckCircle2, XCircle } from '@tamagui/lucide-icons';
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import { initiatePayment, recordUpiApp, confirmPayment } from '../../api/payment.service';

const UPI_APPS = [
  { id: 'gpay', name: 'GPay', icon: 'https://cdn-icons-png.flaticon.com/512/6124/6124998.png' },
  { id: 'phonepe', name: 'PhonePe', icon: 'https://cdn-icons-png.flaticon.com/512/825/825454.png' },
  { id: 'paytm', name: 'Paytm', icon: 'https://cdn-icons-png.flaticon.com/512/825/825454.png' }, // Placeholder icons
  { id: 'bhim', name: 'BHIM', icon: 'https://cdn-icons-png.flaticon.com/512/825/825454.png' },
];

export default function PaymentScreen() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const router = useRouter();
  const bottomSheetRef = useRef<BottomSheet>(null);

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      try {
        const data = await initiatePayment(shareId as string);
        setPaymentData(data);
      } catch (error: any) {
        const message = error.response?.data?.message || 'Failed to initiate payment';
        Alert.alert('Error', message);
        router.back();
      } finally {
        setLoading(false);
      }
    };
    fetchPaymentInfo();
  }, [shareId]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && status === 'PENDING') {
        // User returned from UPI app
        showConfirmationDialog();
      }
    });
    return () => subscription.remove();
  }, [status]);

  const showConfirmationDialog = () => {
    Alert.alert(
      'Payment Completed?',
      'Did you successfully complete the payment in the UPI app?',
      [
        { text: 'No, Retry', style: 'cancel', onPress: () => setStatus('IDLE') },
        { 
          text: 'Yes, Paid', 
          onPress: async () => {
            try {
              await confirmPayment(paymentData.paymentId, 'CONFIRMED');
              setStatus('SUCCESS');
            } catch (error) {
              Alert.alert('Error', 'Failed to confirm payment. Please try again.');
              setStatus('IDLE');
            }
          }
        }
      ]
    );
  };

  const handleAppSelect = async (appId: string) => {
    try {
      await recordUpiApp(paymentData.paymentId, appId as any);
      const upiUrl = paymentData.upiLinks[appId] || paymentData.upiLinks.bhim;
      const canOpen = await Linking.canOpenURL(upiUrl);
      
      if (canOpen) {
        setStatus('PENDING');
        await Linking.openURL(upiUrl);
      } else {
        Alert.alert('Error', `${appId} is not installed on your device.`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to open payment app');
    }
  };

  if (loading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  if (status === 'SUCCESS') {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$6" gap="$6">
        <CheckCircle2 size={100} color="$green10" />
        <H1 color="$green10">Payment Successful!</H1>
        <Text fontSize="$5" color="$gray10" textAlign="center">
          You paid ₹{paymentData.shareAmount} to {paymentData.payee.name}
        </Text>
        <Button size="$5" backgroundColor="$blue10" onPress={() => router.replace('/(tabs)')}>
          <Text color="white" fontWeight="700">Back to Home</Text>
        </Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack padding="$4" alignItems="center" marginTop="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          backgroundColor="transparent"
        />
        <H1 size="$7">Payment</H1>
      </XStack>

      <YStack padding="$6" gap="$6" alignItems="center">
        <Card padding="$8" borderRadius="$8" elevation={2} alignItems="center" width="100%">
          <Text color="$gray10" fontSize="$4">Pay to {paymentData.payee.name}</Text>
          <Text fontSize="$9" fontWeight="800" color="$blue10">₹{paymentData.shareAmount}</Text>
          <Text color="$gray9" marginTop="$2">UPI ID: {paymentData.payee.upiId}</Text>
        </Card>

        <YStack width="100%" gap="$4">
          <Text fontWeight="700" color="$gray11">Select Payment App</Text>
          <XStack justifyContent="space-between" flexWrap="wrap" gap="$4">
            {UPI_APPS.map((app) => (
              <YStack 
                key={app.id} 
                alignItems="center" 
                gap="$2" 
                onPress={() => handleAppSelect(app.id)}
                width="22%"
              >
                <YStack backgroundColor="$gray2" padding="$3" borderRadius="$4" alignItems="center" justifyContent="center">
                  <Smartphone size={32} color="$blue10" />
                </YStack>
                <Text fontSize="$2" fontWeight="600">{app.name}</Text>
              </YStack>
            ))}
          </XStack>
        </YStack>
      </YStack>

      <View marginTop="auto" padding="$6">
        <Text textAlign="center" color="$gray9" fontSize="$2">
          Only installed apps will work. If an app doesn't open, try another one or use BHIM/Other.
        </Text>
      </View>
    </YStack>
  );
}
