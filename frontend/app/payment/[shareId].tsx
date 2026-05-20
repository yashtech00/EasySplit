import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState, Image, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useSafeRouter } from '../../hooks/use-safe-router';
import { YStack, XStack, Text, Button, H1, Spinner, View, Card } from 'tamagui';
import { ChevronLeft, Smartphone, CheckCircle2, XCircle, CreditCard } from '@tamagui/lucide-icons';
import { initiatePayment, recordUpiApp, confirmPayment } from '../../api/payment.service';

export default function PaymentScreen() {
  const { shareId } = useLocalSearchParams<{ shareId: string }>();
  const [paymentData, setPaymentData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'IDLE' | 'PENDING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const router = useSafeRouter();

  useEffect(() => {
    const fetchPaymentInfo = async () => {
      console.log(`💳 [PaymentScreen] Fetching info for ShareId: ${shareId}`);
      try {
        const data = await initiatePayment(shareId as string);
        console.log('✅ [PaymentScreen] Payment data received');
        setPaymentData(data);
      } catch (error: any) {
        console.error('❌ [PaymentScreen] Initiation failed:', error.response?.data || error.message);
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
            } catch (error: any) {
              Alert.alert('Error', 'Failed to confirm payment. Please try again.');
              setStatus('IDLE');
            }
          }
        }
      ]
    );
  };

  const handleSimplePay = async () => {
    // Ultra-simple trigger: just opens any UPI app chooser. 
    // This is the most reliable way to avoid bank/QR errors.
    const url = 'upi://pay';
    
    console.log('🚀 [PaymentScreen] Opening generic UPI app chooser');

    try {
      // We don't set PENDING here anymore because we want the user to click "Mark as Paid" manually
      await Linking.openURL(url);
    } catch (err) {
      console.error('🔥 [PaymentScreen] Error opening UPI apps:', err);
      Alert.alert('Error', 'Could not open any UPI apps. Please ensure GPay, PhonePe, or Paytm is installed.');
    }
  };

  const handleMarkAsPaid = async () => {
    console.log('💸 [PaymentScreen] User clicked Mark as Paid, verifying with backend...');
    try {
      await confirmPayment(paymentData.paymentId, 'CONFIRMED');
      console.log('✅ [PaymentScreen] Payment confirmed by backend');
      setStatus('SUCCESS');
    } catch (error: any) {
      console.error('❌ [PaymentScreen] Confirmation failed:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to mark as paid. Please try again.');
    }
  };

  if (loading || !paymentData) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
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

      <YStack padding="$6" gap="$6" alignItems="center" flex={1}>
        <Card padding="$8" borderRadius="$8" elevation={2} alignItems="center" width="100%" backgroundColor="$blue1">
          <Text color="$gray10" fontSize="$5">Pay to</Text>
          <H1 size="$8" color="$blue10" marginTop="$2">{paymentData.payee.name}</H1>
          <Text color="$gray9" marginTop="$1">{paymentData.payee.upiId}</Text>
          
          <YStack marginTop="$6" alignItems="center" gap="$2">
            <Text color="$gray10" fontSize="$4">Amount to Pay</Text>
            <Text fontSize="$9" fontWeight="800" color="$blue11">₹{paymentData.shareAmount}</Text>
          </YStack>

          <Button
            marginTop="$6"
            size="$4"
            backgroundColor="$green10"
            pressStyle={{ backgroundColor: '$green11', scale: 0.98 }}
            icon={<CheckCircle2 size={18} color="white" />}
            onPress={handleMarkAsPaid}
            width="100%"
          >
            <Text color="white" fontWeight="700">MARK AS PAID</Text>
          </Button>
        </Card>

        <YStack width="100%" gap="$4" marginTop="$4">
          <Text fontWeight="700" color="$gray11" textAlign="center">
            MANUAL PAYMENT STEPS
          </Text>
          
          <Button
            size="$6"
            backgroundColor="$blue10"
            pressStyle={{ backgroundColor: '$blue11', scale: 0.98 }}
            icon={<Smartphone size={24} color="white" />}
            onPress={handleSimplePay}
          >
            <Text color="white" fontWeight="800" fontSize="$6">OPEN ANY UPI APP</Text>
          </Button>

          <YStack backgroundColor="$gray2" padding="$4" borderRadius="$4" gap="$2">
            <Text textAlign="center" color="$gray10" fontSize="$3">
              1. Open your UPI app (GPay, PhonePe, etc.)
            </Text>
            <Text textAlign="center" color="$gray10" fontSize="$3">
              2. Manually pay to: <Text fontWeight="800" color="$blue10">{paymentData.payee.upiId}</Text>
            </Text>
            <Text textAlign="center" color="$gray10" fontSize="$3">
              3. Enter amount: <Text fontWeight="800" color="$blue10">₹{paymentData.shareAmount}</Text>
            </Text>
            <Text textAlign="center" color="$gray10" fontSize="$3">
              4. Return here and click <Text fontWeight="700" color="$green10">MARK AS PAID</Text>
            </Text>
          </YStack>
        </YStack>

        <YStack marginTop="auto" padding="$4" backgroundColor="$orange1" borderRadius="$4" borderWidth={1} borderColor="$orange4">
          <Text color="$orange10" fontSize="$2" textAlign="center" fontWeight="600">
            Note: We are using a simplified payment method to bypass bank-imposed limits. You must enter the amount yourself in the payment app.
          </Text>
        </YStack>
      </YStack>
    </YStack>
  );
}
