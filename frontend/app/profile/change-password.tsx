import { useState } from 'react';
import { Alert } from 'react-native';
import { useSafeRouter } from '../../hooks/use-safe-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner } from 'tamagui';
import { ChevronLeft, Lock, Save } from '@tamagui/lucide-icons';

export default function ChangePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      Alert.alert('Error', 'Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      // API call to change password
      // await updatePassword(currentPassword, newPassword);
      Alert.alert('Success', 'Password updated!');
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <YStack f={1} bc="$background" p="$6" gap="$6">
      <XStack ai="center" mt="$4" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          bc="transparent"
        />
        <H1 size="$7">Change Password</H1>
      </XStack>

      <YStack gap="$6" mt="$4">
        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">CURRENT PASSWORD</Label>
          <XStack ai="center" bc="$gray2" br="$4" px="$3">
            <Lock size={20} color="$gray9" />
            <Input
              f={1}
              bw={0}
              placeholder="••••••••"
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              bc="transparent"
            />
          </XStack>
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">NEW PASSWORD</Label>
          <XStack ai="center" bc="$gray2" br="$4" px="$3">
            <Lock size={20} color="$gray9" />
            <Input
              f={1}
              bw={0}
              placeholder="••••••••"
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              bc="transparent"
            />
          </XStack>
          <Text fontSize="$2" color="$gray9">Min 8 characters</Text>
        </YStack>

        <YStack gap="$2">
          <Label fontWeight="600" color="$gray11">CONFIRM NEW PASSWORD</Label>
          <XStack ai="center" bc="$gray2" br="$4" px="$3">
            <Lock size={20} color="$gray9" />
            <Input
              f={1}
              bw={0}
              placeholder="••••••••"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              bc="transparent"
            />
          </XStack>
        </YStack>

        <Button
          size="$5"
          bc="$blue10"
          onPress={handleUpdatePassword}
          disabled={loading}
          iconAfter={loading ? <Spinner color="white" /> : <Save color="white" />}
        >
          <Text color="white" fontWeight="700">UPDATE PASSWORD</Text>
        </Button>
      </YStack>
    </YStack>
  );
}
