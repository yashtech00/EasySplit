import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  mobile: string;
  name: string | null;
  upiId: string | null;
  isNewUser?: boolean;
}

interface AuthStore {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  setAuth: (accessToken: string, refreshToken: string, user: User) => Promise<void>;
  updateUser: (user: Partial<User>) => void;
  logout: () => Promise<void>;
  loadFromStorage: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  setAuth: async (accessToken, refreshToken, user) => {
    await AsyncStorage.multiSet([
      ['access_token', accessToken],
      ['refresh_token', refreshToken],
      ['user', JSON.stringify(user)],
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
    await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
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
