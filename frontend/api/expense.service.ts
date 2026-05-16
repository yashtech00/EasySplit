import api from './api';

export const addExpense = async (payload: {
  groupId: string;
  title: string;
  amount: number;
  description?: string;
  date: string;
}) => {
  const res = await api.post('/expense', payload);
  return res.data.data;
};

export const getGroupExpenses = async (
  groupId: string,
  page = 1,
  limit = 20,
  status: 'all' | 'paid' | 'unpaid' = 'all'
) => {
  const res = await api.get(`/expense/group/${groupId}`, {
    params: { page, limit, status },
  });
  return res.data.data;
};

export const getExpenseDetails = async (expenseId: string) => {
  const res = await api.get(`/expense/${expenseId}`);
  return res.data.data;
};

export const updateExpense = async (
  expenseId: string,
  data: { description?: string; date?: string }
) => {
  const res = await api.patch(`/expense/${expenseId}`, data);
  return res.data.data;
};

export const deleteExpense = async (expenseId: string) => {
  await api.delete(`/expense/${expenseId}`);
};
