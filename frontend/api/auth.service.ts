import api from './api';

export const sendOtp = async (mobile: string) => {
  const res = await api.post('/auth/send-otp', { mobile });
  return res.data;
};

export const verifyOtp = async (mobile: string, otp: string) => {
  const res = await api.post('/auth/verify-otp', { mobile, otp });
  return res.data.data; // { user, accessToken, refreshToken }
};

export const completeProfile = async (name: string, upiId?: string) => {
  const res = await api.post('/auth/complete-profile', { name, upiId });
  return res.data.data;
};

export const refreshToken = async (token: string) => {
  const res = await api.post('/auth/refresh', { refreshToken: token });
  return res.data.data;
};

export const logout = async (token: string) => {
  await api.post('/auth/logout', { refreshToken: token });
};

export const logoutAll = async () => {
  await api.post('/auth/logout-all');
};
