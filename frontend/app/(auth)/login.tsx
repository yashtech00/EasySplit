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
      <YStack alignItems="center" gap="$3">
        <YStack backgroundColor="$blue2" padding="$4" borderRadius="$8" alignItems="center" justifyContent="center">
          <Wallet size={48} color="$blue10" />
        </YStack>
        <H1 size="$9" color="$gray12" fontWeight="900" letterSpacing={-0.5}>SplitEasy</H1>
        <Text color="$gray10" fontSize="$4" fontWeight="600">Split bills, stay friends</Text>
      </YStack>

      <YStack 
        gap="$5" 
        backgroundColor="white" 
        padding="$6" 
        borderRadius="$8" 
        borderWidth={1}
        borderColor="$gray3"
        elevation={0}
      >
        <YStack gap="$2.5">
          <Label htmlFor="mobile" fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>MOBILE NUMBER</Label>
          <XStack 
            alignItems="center" 
            backgroundColor="white" 
            borderWidth={1}
            borderColor="$gray4"
            borderRadius="$6" 
            paddingHorizontal="$3.5"
            height={52}
            focusStyle={{ borderColor: '$blue10' }}
          >
            <Text color="$gray9" fontWeight="700" marginRight="$2">+91</Text>
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
              fontSize="$4"
              fontWeight="600"
              color="$gray12"
            />
          </XStack>
        </YStack>

        <Button
          marginTop="$2"
          size="$5"
          backgroundColor="$blue10"
          hoverStyle={{ backgroundColor: '$blue11' }}
          pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
          onPress={handleSendOtp}
          disabled={loading}
          br="$9"
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
        >
          <Text color="white" fontWeight="700" fontSize="$4" letterSpacing={0.5}>
            {loading ? 'SENDING OTP...' : 'GET OTP'}
          </Text>
        </Button>
      </YStack>

      <Text textAlign="center" color="$gray10" fontSize="$2.5" paddingHorizontal="$4" fontWeight="500">
        By continuing, you agree to our{' '}
        <Text color="$blue10" fontWeight="700">Terms</Text> and{' '}
        <Text color="$blue10" fontWeight="700">Privacy Policy</Text>.
      </Text>
    </YStack>
  );
}
