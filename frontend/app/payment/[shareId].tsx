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
      
      // Determine the best link to use based on platform and availability
      let upiUrl = '';
      const { upiLinks } = paymentData;

      if (Platform.OS === 'android') {
        // Use android specific intent links if available, otherwise fallback to top-level or generic
        upiUrl = upiLinks.android?.[appId] || upiLinks[appId] || upiLinks.generic;
      } else if (Platform.OS === 'ios') {
        // Use ios specific custom schemes if available, otherwise fallback to top-level or generic
        upiUrl = upiLinks.ios?.[appId] || upiLinks[appId] || upiLinks.generic;
      } else {
        // Web or other: Use generic upi link
        upiUrl = upiLinks.generic;
      }

      console.log(`Attempting to open UPI link for ${appId}:`, upiUrl);

      // On Android, intent:// links often fail canOpenURL check even if the app is installed.
      // We try to open directly and catch the error.
      if (Platform.OS === 'android' && upiUrl.startsWith('intent://')) {
        setStatus('PENDING');
        try {
          await Linking.openURL(upiUrl);
        } catch (err) {
          console.error('Failed to open intent link:', err);
          
          // Fallback 1: Extract the upi:// part from the intent:// link
          // intent://pay?...#Intent;scheme=upi;... -> upi://pay?...
          const intentParts = upiUrl.split('#Intent;');
          if (intentParts.length > 0) {
            const rawPath = intentParts[0].replace('intent://', 'upi://');
            console.log('Fallback 1: Attempting to open extracted upi:// link:', rawPath);
            try {
              await Linking.openURL(rawPath);
              return;
            } catch (fallbackErr) {
              console.error('Fallback 1 failed:', fallbackErr);
            }
          }

          // Fallback 2: Use generic upi:// link if intent fails
          if (upiLinks.clean || upiLinks.generic) {
            const finalFallback = upiLinks.clean || upiLinks.generic;
            console.log('Fallback 2: Attempting to open clean/generic upi:// link:', finalFallback);
            try {
              await Linking.openURL(finalFallback);
            } catch (finalErr) {
              console.error('Fallback 2 failed:', finalErr);
              Alert.alert('Error', `Could not open ${appId}. Please ensure it is installed or use another app.`);
              setStatus('IDLE');
            }
          } else {
            Alert.alert('Error', `Could not open ${appId}. Please ensure it is installed.`);
            setStatus('IDLE');
          }
        }
        return;
      }

      // For standard upi:// or app-specific schemes (gpay://, phonepe://)
      const canOpen = await Linking.canOpenURL(upiUrl);
      if (canOpen) {
        setStatus('PENDING');
        await Linking.openURL(upiUrl);
      } else {
        // Try generic fallback before giving up
        if (upiUrl !== upiLinks.generic && upiLinks.generic) {
          setStatus('PENDING');
          await Linking.openURL(upiLinks.generic);
        } else {
          Alert.alert('Error', `${appId} is not installed on your device.`);
        }
      }
    } catch (error) {
      console.error('Payment app redirection error:', error);
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
