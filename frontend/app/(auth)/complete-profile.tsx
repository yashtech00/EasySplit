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
      <YStack alignItems="center" gap="$2">
        <H1 size="$8" color="$blue10" fontWeight="800">Welcome!</H1>
        <Text color="$gray10" fontSize="$5" textAlign="center">
          Just a few more details to get started
        </Text>
      </YStack>

      <YStack gap="$4" backgroundColor="$background" p="$6" borderRadius="$8" elevation={2}>
        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">FULL NAME</Label>
          <XStack alignItems="center" backgroundColor="$gray2" borderRadius="$4" px="$3">
            <User size={20} color="$gray9" />
            <Input
              flex={1}
              borderWidth={0}
              placeholder="John Doe"
              value={name}
              onChangeText={setName}
              backgroundColor="transparent"
            />
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">UPI ID (FOR RECEIVING MONEY)</Label>
          <XStack alignItems="center" backgroundColor="$gray2" borderRadius="$4" px="$3">
            <CreditCard size={20} color="$gray9" />
            <Input
              flex={1}
              borderWidth={0}
              placeholder="johndoe@okaxis"
              value={upiId}
              onChangeText={setUpiId}
              autoCapitalize="none"
              backgroundColor="transparent"
            />
          </XStack>
          <Text fontSize="$2" color="$gray9">Optional: You can add this later in profile</Text>
        </YStack>

        <Button
          marginTop="$4"
          size="$5"
          backgroundColor="$blue10"
          onPress={handleComplete}
          disabled={loading}
          iconAfter={loading ? <Spinner color="white" /> : <ArrowRight color="white" />}
        >
          <Text color="white" fontWeight="600" fontSize="$5">
            {loading ? 'Saving...' : 'START SPLITTING'}
          </Text>
        </Button>
      </YStack>
    </YStack>
  );
}
