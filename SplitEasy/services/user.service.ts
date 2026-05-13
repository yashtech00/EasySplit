import api from './api';

export const getMyProfile = async () => {
  const res = await api.get('/user/me');
  return res.data.data;
};

export const getUserStats = async () => {
  const res = await api.get('/user/stats');
  return res.data.data;
};

export const updateProfile = async (name: string, upiId: string) => {
  const res = await api.patch('/user/profile', { name, upiId });
  return res.data.data;
};

export const updatePushToken = async (expoPushToken: string) => {
  await api.patch('/user/push-token', { expoPushToken });
};
