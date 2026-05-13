import api from './api';

export const createGroup = async (name: string) => {
  const res = await api.post('/group', { name });
  return res.data.data;
};

export const joinGroup = async (inviteCode: string) => {
  const res = await api.post('/group/join', { inviteCode });
  return res.data.data;
};

export const getGroupDetails = async (groupId: string) => {
  const res = await api.get(`/group/${groupId}`);
  return res.data.data;
};

export const getGroupBalance = async (groupId: string) => {
  const res = await api.get(`/group/${groupId}/balance`);
  return res.data.data;
};

export const sendReminder = async (groupId: string, targetUserId: string) => {
  const res = await api.post(`/group/${groupId}/remind`, { targetUserId });
  return res.data;
};
