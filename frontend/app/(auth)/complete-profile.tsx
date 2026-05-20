import { useState } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner } from 'tamagui';
import { User, CreditCard, ArrowRight } from '@tamagui/lucide-icons';
import { completeProfile } from '../../api/auth.service';
import { useAuthStore } from '../../store/auth.store';

export default function CompleteProfileScreen() {
  const [name, setName] = useState('');
  const [upiId, setUpiId] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { user, updateUser } = useAuthStore();

  const handleComplete = async () => {
    if (!name || name.trim().length < 2) {
      Alert.alert('Error', 'Please enter your full name');
      return;
    }

    setLoading(true);
    try {
      const updatedUser = await completeProfile(name, upiId);
      updateUser(updatedUser);
      
      // After profile completion, check for group
      if (!updatedUser.groupId) {
        router.replace('/(onboarding)/group-choice');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" p="$6" gap="$6" justifyContent="center">
      <YStack alignItems="center" gap="$3">
        <H1 size="$9" color="$gray12" fontWeight="900" letterSpacing={-0.5} textAlign="center">Welcome!</H1>
        <Text color="$gray10" fontSize="$4" textAlign="center" fontWeight="600">
          Just a few more details to get started
        </Text>
      </YStack>

      <YStack 
        gap="$5" 
        backgroundColor="white" 
        p="$6" 
        borderRadius="$8" 
        borderWidth={1}
        borderColor="$gray3"
        elevation={0}
      >
        <YStack gap="$2.5">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>FULL NAME</Label>
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
            <User size={20} color="$gray9" />
            <Input
              flex={1}
              borderWidth={0}
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="600"
              color="$gray12"
            />
          </XStack>
        </YStack>

        <YStack gap="$2.5">
          <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>UPI ID (FOR RECEIVING MONEY)</Label>
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
            <CreditCard size={20} color="$gray9" />
            <Input
              flex={1}
              borderWidth={0}
              placeholder="johndoe@okaxis"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              backgroundColor="transparent"
              fontSize="$4"
              fontWeight="600"
              color="$gray12"
            />
          </XStack>
          <Text fontSize="$2" color="$gray9" fontWeight="500">Optional: You can add this later in profile</Text>
        </YStack>

        <Button
          marginTop="$2"
          size="$5"
          backgroundColor="$blue10"
          hoverStyle={{ backgroundColor: '$blue11' }}
          pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
          onPress={handleComplete}
          disabled={loading}
          br="$9"
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
        >
          <Text color="white" fontWeight="700" fontSize="$4" letterSpacing={0.5}>
            {loading ? 'SAVING...' : 'START SPLITTING'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
