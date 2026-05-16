import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout as apiLogout, logoutAll as apiLogoutAll } from '../api/auth.service';

interface User {
  id: string;
  mobile: string;
  name: string | null;
  upiId: string | null;
  isNewUser?: boolean;
  hasGroup?: boolean;
  groupId?: string;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (accessToken, refreshToken, user) => {
    await Promise.all([
      AsyncStorage.setItem('access_token', accessToken),
      AsyncStorage.setItem('refresh_token', refreshToken),
      AsyncStorage.setItem('user', JSON.stringify(user)),
    ]);
    set({ token: accessToken, user });
  },

  updateUser: (updates) => {
    const current = get().user;
    if (current) {
      const updatedUser = { ...current, ...updates };
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },

  logout: async () => {
    console.log('Starting logout process...');
    const refreshToken = await AsyncStorage.getItem('refresh_token');
    console.log('Refresh token found:', !!refreshToken);
    if (refreshToken) {
      try {
        await apiLogout(refreshToken);
        console.log('Logout API call successful');
      } catch (error) {
        console.error('Logout API failed:', error);
      }
    }
    await Promise.all([
      AsyncStorage.removeItem('access_token'),
      AsyncStorage.removeItem('refresh_token'),
      AsyncStorage.removeItem('user'),
    ]);
    console.log('Local storage cleared');
    set({ token: null, user: null });
  },

  logoutAll: async () => {
    console.log('Starting logout from all devices...');
    try {
      await apiLogoutAll();
      console.log('Logout All API call successful');
    } catch (error) {
      console.error('Logout All API failed:', error);
    }
    await Promise.all([
      AsyncStorage.removeItem('access_token'),
      AsyncStorage.removeItem('refresh_token'),
      AsyncStorage.removeItem('user'),
    ]);
    console.log('Local storage cleared');
    set({ token: null, user: null });
  },

  loadFromStorage: async () => {
    const token = await AsyncStorage.getItem('access_token');
    const userStr = await AsyncStorage.getItem('user');
    set({
      token,
      user: userStr ? JSON.parse(userStr) : null,
      isLoading: false,
    });
  },
}));
