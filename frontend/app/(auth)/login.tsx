import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner, useTheme } from 'tamagui';
import { Wallet, Smartphone, ArrowRight } from '@tamagui/lucide-icons';
import { sendOtp } from '../../api/auth.service';

export default function LoginScreen() {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const theme = useTheme();

  const handleSendOtp = async () => {
    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      Alert.alert('Error', 'Please enter a valid 10-digit mobile number');
      return;
    }

    setLoading(true);
    try {
      const response = await sendOtp(mobile);
      if (response.success) {
        router.push({
          pathname: '/(auth)/verify-otp',
          params: { mobile }
        });
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send OTP';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" justifyContent="center" padding="$6" gap="$6">
      <YStack alignItems="center" gap="$2">
        <YStack backgroundColor="$blue4" padding="$4" borderRadius="$6" alignItems="center" justifyContent="center">
          <Wallet size={48} color="$blue10" />
        </YStack>
        <H1 size="$9" color="$blue10" fontWeight="800">SplitEasy</H1>
        <Text color="$gray10" fontSize="$5">Split bills, stay friends</Text>
      </YStack>

      <YStack gap="$4" backgroundColor="$background" padding="$6" borderRadius="$8" elevation={2}>
        <YStack gap="$2">
          <Label htmlFor="mobile" fontWeight="600" color="$gray11">MOBILE NUMBER</Label>
          <XStack alignItems="center" backgroundColor="$gray2" borderRadius="$4" paddingHorizontal="$3">
            <Text color="$gray9" fontWeight="600" marginRight="$2">+91</Text>
            <Input
              id="mobile"
              flex={1}
              borderWidth={0}
              placeholder="9876543210"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
              maxLength={10}
              backgroundColor="transparent"
            />
          </XStack>
        </YStack>

        <Button
          marginTop="$4"
          size="$5"
          backgroundColor="$blue10"
          hoverStyle={{ backgroundColor: '$blue11' }}
          pressStyle={{ backgroundColor: '$blue9' }}
          onPress={handleSendOtp}
          disabled={loading}
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
        >
          <Text color="white" fontWeight="600" fontSize="$5">
            {loading ? 'Sending OTP...' : 'GET OTP'}
          </Text>
        </Button>
      </YStack>

      <Text textAlign="center" color="$gray9" fontSize="$3" paddingHorizontal="$4">
        By continuing, you agree to our{' '}
        <Text color="$blue10" fontWeight="600">Terms</Text> and{' '}
        <Text color="$blue10" fontWeight="600">Privacy Policy</Text>.
      </Text>
    </YStack>
  );
}
