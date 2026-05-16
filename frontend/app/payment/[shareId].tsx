import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, Linking, AppState, Image, Platform } from 'react-native';
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
      console.log(`💳 [PaymentScreen] Fetching info for ShareId: ${shareId}`);
      try {
        const data = await initiatePayment(shareId as string);
        console.log('✅ [PaymentScreen] Payment data received:', JSON.stringify(data, null, 2));
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
      console.log(`📱 [PaymentScreen] AppState changed to: ${nextAppState}, Status: ${status}`);
      if (nextAppState === 'active' && status === 'PENDING') {
        console.log('🔄 [PaymentScreen] User returned from payment app, showing dialog');
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
        { 
          text: 'No, Retry', 
          style: 'cancel', 
          onPress: () => {
            console.log('🔁 [PaymentScreen] User clicked Retry');
            setStatus('IDLE');
          }
        },
        { 
          text: 'Yes, Paid', 
          onPress: async () => {
            console.log('💸 [PaymentScreen] User confirmed payment, verifying with backend...');
            try {
              await confirmPayment(paymentData.paymentId, 'CONFIRMED');
              console.log('✅ [PaymentScreen] Payment confirmed by backend');
              setStatus('SUCCESS');
            } catch (error: any) {
              console.error('❌ [PaymentScreen] Confirmation failed:', error.response?.data || error.message);
              Alert.alert('Error', 'Failed to confirm payment. Please try again.');
              setStatus('IDLE');
            }
          }
        }
      ]
    );
  };

  const handleAppSelect = async (appId: string) => {
    console.log(`🔘 [PaymentScreen] App selected: ${appId}`);
    try {
      console.log(`📡 [PaymentScreen] Recording selected app (${appId}) in backend...`);
      await recordUpiApp(paymentData.paymentId, appId as any);
      
      let upiUrl = '';
      const { upiLinks } = paymentData;

      if (Platform.OS === 'android') {
        upiUrl = upiLinks.android?.[appId] || upiLinks[appId] || upiLinks.generic;
        console.log(`🤖 [PaymentScreen] Android path - Selection: ${upiUrl}`);
      } else if (Platform.OS === 'ios') {
        upiUrl = upiLinks.ios?.[appId] || upiLinks[appId] || upiLinks.generic;
        console.log(`🍎 [PaymentScreen] iOS path - Selection: ${upiUrl}`);
      } else {
        upiUrl = upiLinks.generic;
        console.log(`🌐 [PaymentScreen] Other path - Selection: ${upiUrl}`);
      }

      // Special handling for the "Bank Limit" error you saw
      // If we are retrying or the specific app link failed, we use the "clean" link
      if (status === 'IDLE' && upiLinks.clean) {
        console.log('🧹 [PaymentScreen] Status was IDLE, using clean link for better limit compatibility');
        upiUrl = upiLinks.clean;
      }

      console.log(`🚀 [PaymentScreen] Final URI to open: ${upiUrl}`);

      if (Platform.OS === 'android' && upiUrl.startsWith('intent://')) {
        setStatus('PENDING');
        try {
          console.log('⚡ [PaymentScreen] Attempting direct Intent open...');
          await Linking.openURL(upiUrl);
        } catch (err) {
          console.warn('⚠️ [PaymentScreen] Intent failed, attempting Fallback 1 (Extracted UPI)...');
          const intentParts = upiUrl.split('#Intent;');
          if (intentParts.length > 0) {
            const rawPath = intentParts[0].replace('intent://', 'upi://');
            console.log(`⚡ [PaymentScreen] Fallback 1 URI: ${rawPath}`);
            try {
              await Linking.openURL(rawPath);
              return;
            } catch (fallbackErr) {
              console.error('❌ [PaymentScreen] Fallback 1 failed');
            }
          }

          if (upiLinks.clean || upiLinks.generic) {
            const finalFallback = upiLinks.clean || upiLinks.generic;
            console.log(`⚡ [PaymentScreen] Fallback 2 (Clean/Generic) URI: ${finalFallback}`);
            try {
              await Linking.openURL(finalFallback);
            } catch (finalErr) {
              console.error('❌ [PaymentScreen] Fallback 2 failed');
              Alert.alert('Error', `Could not open ${appId}. Please ensure it is installed or use another app.`);
              setStatus('IDLE');
            }
          }
        }
        return;
      }

      console.log('⚡ [PaymentScreen] Checking if URI can be opened...');
      const canOpen = await Linking.canOpenURL(upiUrl);
      console.log(`📡 [PaymentScreen] canOpenURL result: ${canOpen}`);
      
      if (canOpen) {
        setStatus('PENDING');
        await Linking.openURL(upiUrl);
      } else {
        const fallback = upiLinks.clean || upiLinks.generic;
        console.warn(`⚠️ [PaymentScreen] Primary URI blocked, trying fallback: ${fallback}`);
        if (fallback) {
          setStatus('PENDING');
          await Linking.openURL(fallback);
        } else {
          Alert.alert('Error', `${appId} is not installed on your device.`);
        }
      }
    } catch (error) {
      console.error('🔥 [PaymentScreen] Redirection error:', error);
      Alert.alert('Error', 'Failed to open payment app');
      setStatus('IDLE');
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
