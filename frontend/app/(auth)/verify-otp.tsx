import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner } from 'tamagui';
import { CheckCircle2, ChevronLeft, ArrowRight } from '@tamagui/lucide-icons';
import { verifyOtp, sendOtp } from '../../api/auth.service';
import { useAuthStore } from '../../store/auth.store';

export default function VerifyOtpScreen() {
  const { mobile } = useLocalSearchParams<{ mobile: string }>();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [timer, setTimer] = useState(30);
  const router = useRouter();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [timer]);

  const handleVerify = async () => {
    if (!otp || !/^\d{6}$/.test(otp)) {
      Alert.alert('Error', 'Please enter a valid 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const data = await verifyOtp(mobile || '', otp);
      await setAuth(data.accessToken, data.refreshToken, data.user);
      
      if (data.user.isNewUser || !data.user.name) {
        router.replace('/(auth)/complete-profile');
      } else if (!data.user.groupId) {
        router.replace('/(onboarding)/group-choice');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid or expired OTP';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (timer > 0) return;
    
    setResending(true);
    try {
      await sendOtp(mobile || '');
      setTimer(30);
      Alert.alert('Success', 'OTP resent successfully');
    } catch (error: any) {
      Alert.alert('Error', 'Failed to resend OTP');
    } finally {
      setResending(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" padding="$6" gap="$6">
      <XStack alignItems="center" marginTop="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          backgroundColor="transparent"
        />
        <H1 size="$7">Verify OTP</H1>
      </XStack>

      <YStack gap="$2">
        <Text color="$gray10" fontSize="$5">
          We've sent a 6-digit code to
        </Text>
        <Text fontWeight="700" fontSize="$6" color="$blue10">
          +91 {mobile}
        </Text>
      </YStack>

      <YStack gap="$6" marginTop="$4" backgroundColor="white" padding="$6" borderRadius="$8" borderWidth={1} borderColor="$gray3">
        <YStack gap="$2.5">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>ENTER OTP</Label>
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
            <Input
              flex={1}
              borderWidth={0}
              placeholder="000000"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              letterSpacing={10}
              textAlign="center"
              fontWeight="800"
              fontSize="$6"
              color="$gray12"
              backgroundColor="transparent"
              autoFocus
            />
          </XStack>
        </YStack>

        <YStack gap="$4">
          <Button
            size="$5"
            backgroundColor="$blue10"
            hoverStyle={{ backgroundColor: '$blue11' }}
            pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
            onPress={handleVerify}
            disabled={loading}
            br="$9"
            iconAfter={loading ? <Spinner color="white" /> : <CheckCircle2 color="white" />}
          >
            <Text color="white" fontWeight="700" fontSize="$4" letterSpacing={0.5}>
              {loading ? 'VERIFYING...' : 'VERIFY & CONTINUE'}
            </Text>
          </Button>

          <XStack justifyContent="center" alignItems="center" gap="$2">
            <Text color="$gray10" fontSize="$3" fontWeight="500">Didn't receive code?</Text>
            <Button
              padding={0}
              height="auto"
              backgroundColor="transparent"
              onPress={handleResend}
              disabled={timer > 0 || resending}
            >
              <Text color={timer > 0 ? '$gray8' : '$blue10'} fontWeight="700" fontSize="$3">
                {resending ? 'Resending...' : timer > 0 ? `Resend in ${timer}s` : 'Resend Now'}
              </Text>
            </Button>
          </XStack>
        </YStack>
      </YStack>
    </YStack>
  );
}
