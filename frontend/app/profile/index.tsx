import { useState, useEffect } from 'react';
import { Alert, ScrollView, Platform, BackHandler } from 'react-native';
import { useSafeRouter } from '../../hooks/use-safe-router';
import { YStack, XStack, Text, Input, Button, Label, H1, Spinner, Avatar, View, Separator } from 'tamagui';
import { ChevronLeft, User as UserIcon, Mail, CreditCard, LogOut, Trash2, Lock } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { updateProfile } from '../../api/user.service';
import { useAuthStore } from '../../store/auth.store';

export default function ProfileScreen() {
  const { user, logout, logoutAll, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [loading, setLoading] = useState(false);
  const router = useSafeRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const handleHardwareBack = () => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
      return true; // prevent default behavior (exiting the app)
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', handleHardwareBack);
    return () => {
      subscription.remove();
    };
  }, [router]);

  const handleSave = async () => {
    if (!name || !upiId) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const updated = await updateProfile(name, upiId);
      updateUser(updated);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    console.log('Logout button pressed');
    const performLogout = async () => {
      console.log('Performing logout...');
      await logout();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout?')) {
        await performLogout();
      }
    } else {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: performLogout }
        ]
      );
    }
  };

  const handleLogoutAll = async () => {
    console.log('Logout All button pressed');
    const performLogoutAll = async () => {
      console.log('Performing logout all...');
      await logoutAll();
      router.replace('/(auth)/login');
    };

    if (Platform.OS === 'web') {
      if (window.confirm('Are you sure you want to logout from all devices?')) {
        await performLogoutAll();
      }
    } else {
      Alert.alert(
        'Logout All Devices',
        'Are you sure you want to logout from all devices?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout All', style: 'destructive', onPress: performLogoutAll }
        ]
      );
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <XStack padding="$4" alignItems="center" gap="$4">
        <Button
          circular
          icon={<ChevronLeft size={24} />}
          onPress={() => router.back()}
          backgroundColor="transparent"
        />
        <H1 size="$7">Profile</H1>
      </XStack>

      <ScrollView>
        <YStack padding="$6" gap="$6">
          <YStack alignItems="center" gap="$2" marginBottom="$4">
            <Avatar circular size="$10">
              <Avatar.Image src={`https://ui-avatars.com/api/?name=${name}&background=random`} />
              <Avatar.Fallback backgroundColor="$blue5" alignItems="center" justifyContent="center">
                <UserIcon size={40} color="$blue10" />
              </Avatar.Fallback>
            </Avatar>
            <H1 size="$6">{name}</H1>
            <Text color="$gray10">{user?.mobile}</Text>
          </YStack>

          <YStack gap="$4">
            <Text fontWeight="700" color="$gray11">Account Details</Text>
            
            <YStack gap="$2">
              <Label fontWeight="600" color="$gray11">NAME</Label>
              <XStack alignItems="center" backgroundColor="$gray2" borderRadius="$4" paddingHorizontal="$3">
                <UserIcon size={20} color="$gray9" />
                <Input
                  flex={1}
                  borderWidth={0}
                  value={name}
                  onChangeText={setName}
                  backgroundColor="transparent"
                />
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Label fontWeight="600" color="$gray11">UPI ID</Label>
              <XStack alignItems="center" backgroundColor="$gray2" borderRadius="$4" paddingHorizontal="$3">
                <CreditCard size={20} color="$gray9" />
                <Input
                  flex={1}
                  borderWidth={0}
                  value={upiId}
                  onChangeText={setUpiId}
                  backgroundColor="transparent"
                />
              </XStack>
            </YStack>

            <Button
              size="$5"
              backgroundColor="$blue10"
              onPress={handleSave}
              disabled={loading}
              iconAfter={loading ? <Spinner color="white" /> : null}
            >
              <Text color="white" fontWeight="700">SAVE CHANGES</Text>
            </Button>
          </YStack>

          <Separator />

          <YStack gap="$4">
            <Text fontWeight="700" color="$red10">Danger Zone</Text>
            <Button
              backgroundColor="$red2"
              pressStyle={{ backgroundColor: '$red3', scale: 0.98 }}
              hoverStyle={{ backgroundColor: '$red3' }}
              justifyContent="flex-start"
              icon={<LogOut size={20} color="$red10" />}
              onPress={handleLogout}
            >
              <Text color="$red10" fontWeight="600">Logout</Text>
            </Button>
            <Button
              backgroundColor="$red2"
              pressStyle={{ backgroundColor: '$red3', scale: 0.98 }}
              hoverStyle={{ backgroundColor: '$red3' }}
              justifyContent="flex-start"
              icon={<LogOut size={20} color="$red10" />}
              onPress={handleLogoutAll}
            >
              <Text color="$red10" fontWeight="600">Logout From All Devices</Text>
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
