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

          <YStack gap="$5" backgroundColor="white" padding="$5" borderRadius="$8" borderWidth={1} borderColor="$gray3">
            <Text fontWeight="800" color="$gray12" fontSize="$4" letterSpacing={0.5} textTransform="uppercase">Account Details</Text>
            
            <YStack gap="$2">
              <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>NAME</Label>
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
                <UserIcon size={20} color="$gray9" />
                <Input
                  flex={1}
                  borderWidth={0}
                  value={name}
                  onChangeText={setName}
                  backgroundColor="transparent"
                  fontSize="$4"
                  fontWeight="600"
                  color="$gray12"
                />
              </XStack>
            </YStack>

            <YStack gap="$2">
              <Label fontWeight="700" color="$gray11" fontSize="$2" letterSpacing={0.5}>UPI ID</Label>
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
                <CreditCard size={20} color="$gray9" />
                <Input
                  flex={1}
                  borderWidth={0}
                  value={upiId}
                  onChangeText={setUpiId}
                  backgroundColor="transparent"
                  fontSize="$4"
                  fontWeight="600"
                  color="$gray12"
                />
              </XStack>
            </YStack>

            <Button
              size="$5"
              backgroundColor="$blue10"
              hoverStyle={{ backgroundColor: '$blue11' }}
              pressStyle={{ backgroundColor: '$blue9', scale: 0.98 }}
              onPress={handleSave}
              disabled={loading}
              br="$9"
              iconAfter={loading ? <Spinner color="white" /> : null}
              marginTop="$2"
            >
              <Text color="white" fontWeight="700" letterSpacing={0.5}>SAVE CHANGES</Text>
            </Button>
          </YStack>

          <YStack gap="$4" backgroundColor="white" padding="$5" borderRadius="$8" borderWidth={1} borderColor="$gray3">
            <Text fontWeight="800" color="$red11" fontSize="$4" letterSpacing={0.5} textTransform="uppercase">Danger Zone</Text>
            <Button
              backgroundColor="$red2"
              pressStyle={{ backgroundColor: '$red3', scale: 0.98 }}
              hoverStyle={{ backgroundColor: '$red3' }}
              justifyContent="center"
              icon={<LogOut size={20} color="$red11" />}
              onPress={handleLogout}
              br="$9"
              height={48}
            >
              <Text color="$red11" fontWeight="700" letterSpacing={0.5}>LOG OUT</Text>
            </Button>
            <Button
              backgroundColor="$red2"
              pressStyle={{ backgroundColor: '$red3', scale: 0.98 }}
              hoverStyle={{ backgroundColor: '$red3' }}
              justifyContent="center"
              icon={<LogOut size={20} color="$red11" />}
              onPress={handleLogoutAll}
              br="$9"
              height={48}
            >
              <Text color="$red11" fontWeight="700" letterSpacing={0.5}>LOG OUT FROM ALL DEVICES</Text>
            </Button>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
