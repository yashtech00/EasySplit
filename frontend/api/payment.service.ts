import api from './api';

export const initiatePayment = async (shareId: string) => {
  const res = await api.post('/payment/initiate', { shareId });
  return res.data.data;
};

export const recordUpiApp = async (
  paymentId: string,
  upiApp: 'gpay' | 'phonepe' | 'paytm' | 'bhim'
) => {
  await api.patch(`/payment/${paymentId}/app`, { upiApp });
};

export const confirmPayment = async (
  paymentId: string,
  status: 'CONFIRMED' | 'FAILED'
) => {
  const res = await api.patch(`/payment/${paymentId}/confirm`, { status });
  return res.data.data;
};

export const getPaymentDetails = async (paymentId: string) => {
  const res = await api.get(`/payment/${paymentId}`);
  return res.data.data;
};

export const getPaymentHistory = async (page = 1, limit = 20) => {
  const res = await api.get('/payment/history/me', { params: { page, limit } });
  return res.data.data;
};
