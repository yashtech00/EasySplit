# SplitEasy — Frontend Structure Guide
> React Native (Expo) | Tumhara kaam: sirf UI banana | Logic + API calls sab yahan hai

---

## 📦 Dependencies Install Karo (Ek baar)

```bash
npx create-expo-app SplitEasy
cd SplitEasy

npx expo install expo-router expo-linking react-native-safe-area-context
npx expo install @react-native-async-storage/async-storage
npx expo install expo-notifications
npm install axios zustand
```

---

## 🗂️ Complete Folder Structure

```
SplitEasy/
├── app/
│   ├── _layout.tsx                  # Root layout — auth guard yahan hai
│   ├── (auth)/
│   │   ├── _layout.tsx
│   │   ├── login.tsx                # Mobile number enter karo
│   │   ├── verify-otp.tsx           # OTP verify karo
│   │   └── complete-profile.tsx     # Name + UPI ID setup
│   └── (tabs)/
│       ├── _layout.tsx              # Bottom tab bar
│       ├── index.tsx                # Home — stats + groups list
│       ├── groups.tsx               # Saare groups
│       └── activity.tsx            # Payment history
├── app/
│   ├── group/
│   │   ├── [id].tsx                 # Group detail — expenses + balance
│   │   └── join.tsx                 # Invite code se join karo
│   ├── expense/
│   │   ├── add.tsx                  # Naya expense add karo
│   │   └── [id].tsx                 # Expense detail — shares
│   └── payment/
│       └── [shareId].tsx            # UPI payment flow
├── services/
│   ├── api.ts                       # Axios instance — BASE FILE
│   ├── auth.service.ts
│   ├── user.service.ts
│   ├── group.service.ts
│   ├── expense.service.ts
│   └── payment.service.ts
├── store/
│   └── auth.store.ts                # Zustand — token + user
├── hooks/
│   ├── useAuth.ts
│   └── usePushNotification.ts
└── constants/
    └── colors.ts
```

---

## ⚙️ Step 1 — Base API Setup

**`services/api.ts`** — Ye file sabse pehle banao, baaki sab iske upar depend karta hai.

```typescript
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BASE_URL = 'http://localhost:8000'; // Railway URL se replace karna production me

const api = axios.create({
  baseURL: `${BASE_URL}/api/v1`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});

// Har request me token automatically lagao
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 aaye to refresh karo, fir retry karo
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = await AsyncStorage.getItem('refresh_token');
        const res = await axios.post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken });
        const newToken = res.data.data.accessToken;
        await AsyncStorage.setItem('access_token', newToken);
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original); // original request retry karo
      } catch {
        // Refresh bhi fail — logout
        await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
        // Navigation se logout screen pe bhejo (store se handle hoga)
      }
    }
    return Promise.reject(error);
  }
);

export default api;
```

---

## 🔐 Step 2 — Auth Store

**`store/auth.store.ts`**

```typescript
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
    if (current) set({ user: { ...current, ...updates } });
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
```

---

## 🛣️ Step 3 — Root Layout (Auth Guard)

**`app/_layout.tsx`**

```typescript
import { useEffect } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '../store/auth.store';

export default function RootLayout() {
  const { token, user, isLoading, loadFromStorage } = useAuthStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => { loadFromStorage(); }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === '(auth)';

    if (!token) {
      // Login nahi hai → login pe bhejo
      router.replace('/(auth)/login');
    } else if (token && !user?.name) {
      // Token hai but profile incomplete → profile complete karo
      router.replace('/(auth)/complete-profile');
    } else if (token && user?.name && inAuth) {
      // Sab sahi hai → home pe bhejo
      router.replace('/(tabs)');
    }
  }, [token, user, isLoading, segments]);

  // UI tumhara — loading screen dikhao jab tak storage se load ho
  if (isLoading) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
```

---

## 🔑 Step 4 — Auth Service + Screens

### `services/auth.service.ts`

```typescript
import api from './api';

// SCREEN: login.tsx
// User mobile number daalta hai → OTP bhejo
export const sendOtp = async (mobile: string) => {
  // POST /auth/send-otp
  // Body: { mobile: "9876543210" }
  // Response: { success: true, message: "OTP sent successfully", data: null }
  const res = await api.post('/auth/send-otp', { mobile });
  return res.data;
};

// SCREEN: verify-otp.tsx
// User OTP dalta hai → verify karo aur tokens lo
export const verifyOtp = async (mobile: string, otp: string) => {
  // POST /auth/verify-otp
  // Body: { mobile, otp }
  // Response: { data: { user: { id, mobile, name, upiId, isNewUser }, accessToken, refreshToken } }
  // NOTE: isNewUser === true → complete-profile screen pe bhejo
  const res = await api.post('/auth/verify-otp', { mobile, otp });
  return res.data.data; // { user, accessToken, refreshToken }
};

// SCREEN: complete-profile.tsx
// Naye user ka name aur UPI ID set karo
export const completeProfile = async (name: string, upiId?: string) => {
  // POST /auth/complete-profile
  // Body: { name: "Rahul Sharma", upiId: "rahul@paytm" }
  // Response: { data: { id, mobile, name, upiId } }
  const res = await api.post('/auth/complete-profile', { name, upiId });
  return res.data.data;
};

// SCREEN: Profile/Settings me logout button
export const logout = async (refreshToken: string) => {
  // POST /auth/logout
  // Body: { refreshToken }
  await api.post('/auth/logout', { refreshToken });
};
```

### Screen: `app/(auth)/login.tsx`
```
- State: mobile (string)
- onPress "Send OTP": authService.sendOtp(mobile) → navigate to verify-otp
- Pass mobile as route param: router.push({ pathname: '/(auth)/verify-otp', params: { mobile } })
- Error: Alert.alert() dikhao
- Rate limit (429): "Too many attempts, try after 15 min" dikhao
```

### Screen: `app/(auth)/verify-otp.tsx`
```
- Params: mobile (from login screen)
- State: otp (string, 6 digits)
- onPress "Verify": authService.verifyOtp(mobile, otp)
  → Response se: setAuth(accessToken, refreshToken, user)
  → user.isNewUser === true  → router.replace('/(auth)/complete-profile')
  → user.isNewUser === false → router.replace('/(tabs)') [_layout handle karega]
- Resend OTP button: authService.sendOtp(mobile) firse call karo
- Development me default OTP: 123456
```

### Screen: `app/(auth)/complete-profile.tsx`
```
- State: name (string, required), upiId (string, optional)
- onPress "Save": authService.completeProfile(name, upiId)
  → store.updateUser(result)
  → router.replace('/(tabs)')
- UPI ID format: username@provider (validate client-side)
```

---

## 👤 Step 5 — User Service

### `services/user.service.ts`

```typescript
import api from './api';

// SCREEN: Profile screen / Home screen pe stats ke liye
export const getMyProfile = async () => {
  // GET /user/me
  // Response: { data: { id, mobile, name, upiId, expoPushToken, createdAt } }
  const res = await api.get('/user/me');
  return res.data.data;
};

// SCREEN: Home screen — dashboard numbers ke liye
export const getUserStats = async () => {
  // GET /user/stats
  // Response: { data: { totalGroups, totalExpenses, totalAmount, youOwe, theyOwe } }
  const res = await api.get('/user/stats');
  return res.data.data;
};

// SCREEN: Edit Profile screen
export const updateProfile = async (name: string, upiId: string) => {
  // PATCH /user/profile
  // Body: { name, upiId }
  // Response: { data: { id, mobile, name, upiId } }
  const res = await api.patch('/user/profile', { name, upiId });
  return res.data.data;
};

// App startup pe push token register karo
export const updatePushToken = async (expoPushToken: string) => {
  // PATCH /user/push-token
  // Body: { expoPushToken }
  await api.patch('/user/push-token', { expoPushToken });
};
```

---

## 👥 Step 6 — Group Service + Screens

### `services/group.service.ts`

```typescript
import api from './api';

// SCREEN: groups.tsx — saare groups list ke liye (user/me se groups nahi aata,
// groups list home/stats se derive karo ya separate endpoint check karo)

// SCREEN: group/create modal ya screen
export const createGroup = async (name: string) => {
  // POST /group
  // Body: { name: "Goa Trip 2024" }
  // Response: { data: { id, name, inviteCode, members: [{ user: { id, name, mobile } }] } }
  // IMPORTANT: inviteCode save karo — dusre user ko share karna hai
  const res = await api.post('/group', { name });
  return res.data.data; // { id, name, inviteCode, members }
};

// SCREEN: group/join.tsx
export const joinGroup = async (inviteCode: string) => {
  // POST /group/join
  // Body: { inviteCode: "GRP-A1B2" }
  // Response: { data: { id, name, inviteCode, members } }
  // Error 409: Group full (max 2 members)
  const res = await api.post('/group/join', { inviteCode });
  return res.data.data;
};

// SCREEN: group/[id].tsx — group detail
export const getGroupDetails = async (groupId: string) => {
  // GET /group/:groupId
  // Response: { data: { id, name, inviteCode, members: [{ userId, user: { id, name, mobile, upiId } }] } }
  const res = await api.get(`/group/${groupId}`);
  return res.data.data;
};

// SCREEN: group/[id].tsx — balance card ke liye
export const getGroupBalance = async (groupId: string) => {
  // GET /group/:groupId/balance
  // Response: { data: {
  //   totalGroupSpend: 5000,
  //   yourShare: 2500,
  //   theirShare: 2500,
  //   netBalance: {
  //     direction: "THEY_OWE_YOU" | "YOU_OWE_THEM" | "SETTLED",
  //     amount: 350,
  //     person: { id, name }
  //   }
  // }}
  const res = await api.get(`/group/${groupId}/balance`);
  return res.data.data;
};

// SCREEN: group/[id].tsx — "Remind" button
export const sendReminder = async (groupId: string, targetUserId: string) => {
  // POST /group/:groupId/remind
  // Body: { targetUserId }
  // Rate limit: 1 baar per 24 hours, 429 aaye to "Already reminded today" dikhao
  const res = await api.post(`/group/${groupId}/remind`, { targetUserId });
  return res.data;
};
```

### Screen: `app/(tabs)/groups.tsx`
```
- On mount: groups list dikhao (getUserStats se totalGroups, ya alag list banao)
- "Create Group" button → modal ya screen → createGroup()
  → Success: inviteCode Share sheet se share karo (Share API)
- "Join Group" button → join.tsx pe navigate karo
- Group card tap → group/[id].tsx pe navigate karo router.push(`/group/${id}`)
```

### Screen: `app/group/[id].tsx`
```
- Params: id (groupId)
- On mount: getGroupDetails(id) + getGroupBalance(id) — dono parallel chalao
- Balance card: direction ke hisaab se color aur text
  → THEY_OWE_YOU → green → "Priya owes you ₹350"
  → YOU_OWE_THEM → red   → "You owe Priya ₹450"
  → SETTLED       → grey  → "All settled!"
- Expenses list: getGroupExpenses(id) call karo (expense service se)
- "Add Expense" button → expense/add.tsx pe navigate karo (pass groupId)
- "Remind" button: sendReminder() → 429 pe "Already sent today" dikhao
- Invite code dikhao — copy button lagao
```

### Screen: `app/group/join.tsx`
```
- State: inviteCode (string)
- onPress "Join": joinGroup(inviteCode)
  → Success: router.replace(`/group/${data.id}`)
  → 409: "Group is full" Alert
```

---

## 💰 Step 7 — Expense Service + Screens

### `services/expense.service.ts`

```typescript
import api from './api';

// SCREEN: expense/add.tsx
export const addExpense = async (payload: {
  groupId: string;
  title: string;
  amount: number;
  description?: string;
  date: string; // ISO string: new Date().toISOString()
}) => {
  // POST /expense
  // Body: { groupId, title, amount, description, date }
  // Response: { data: {
  //   id, title, amount, description, date,
  //   addedBy: { id, name },
  //   shares: [
  //     { id, userId, shareAmount, isPaid, user: { id, name } },  // addedBy ka share isPaid: true
  //     { id, userId, shareAmount, isPaid, user: { id, name } }   // dusre ka share isPaid: false
  //   ]
  // }}
  // IMPORTANT: shares[1].id === shareId — payment ke liye chahiye
  const res = await api.post('/expense', payload);
  return res.data.data;
};

// SCREEN: group/[id].tsx — expenses list
export const getGroupExpenses = async (
  groupId: string,
  page = 1,
  limit = 20,
  status: 'all' | 'paid' | 'unpaid' = 'all'
) => {
  // GET /expense/group/:groupId?page=1&limit=20&status=all
  // Response: { data: {
  //   expenses: [{
  //     id, title, amount, date,
  //     addedBy: { id, name },
  //     myShare: { id, shareAmount, isPaid, paidAt },  // current user ka share
  //     isSettled: boolean
  //   }],
  //   pagination: { page, limit, total, totalPages }
  // }}
  // NOTE: myShare.id === shareId — payment initiate ke liye use karo
  const res = await api.get(`/expense/group/${groupId}`, {
    params: { page, limit, status }
  });
  return res.data.data; // { expenses, pagination }
};

// SCREEN: expense/[id].tsx
export const getExpenseDetails = async (expenseId: string) => {
  // GET /expense/:expenseId
  // Response: { data: {
  //   id, title, amount, description, date,
  //   addedBy: { id, name },
  //   group: { id, name },
  //   shares: [{ id, userId, shareAmount, isPaid, paidAt, user: { id, name }, payment: null | {...} }]
  // }}
  const res = await api.get(`/expense/${expenseId}`);
  return res.data.data;
};

// SCREEN: expense/[id].tsx — edit button (sirf addedBy ko dikhao)
export const updateExpense = async (
  expenseId: string,
  data: { description?: string; date?: string }
) => {
  // PATCH /expense/:expenseId
  // Body: { description, date }  — sirf ye do fields update ho sakti hain
  // NOTE: title aur amount update nahi hota
  const res = await api.patch(`/expense/${expenseId}`, data);
  return res.data.data;
};

// SCREEN: expense/[id].tsx — delete button (sirf addedBy ko dikhao)
export const deleteExpense = async (expenseId: string) => {
  // DELETE /expense/:expenseId
  // Error 409: dusre ne payment kar di ho tab delete nahi hoga
  await api.delete(`/expense/${expenseId}`);
};
```

### Screen: `app/expense/add.tsx`
```
- Params: groupId (router se)
- State: title, amount, description, date (default: today)
- amount: numeric keyboard use karo (keyboardType="numeric")
- date: DateTimePicker ya simple text input
- onPress "Add Expense": addExpense({ groupId, title, amount: parseFloat(amount), description, date })
  → Success: router.back() — group detail screen refresh hogi
- Validation: title required, amount > 0
```

### Screen: `app/expense/[id].tsx`
```
- Params: id (expenseId)
- On mount: getExpenseDetails(id)
- Shares dikhao: dono members ka shareAmount + isPaid status
- Agar current user ka share isPaid === false:
    → "Pay Now" button → router.push(`/payment/${myShare.id}`)
- Agar current user === addedBy:
    → Edit + Delete buttons dikhao
- Delete: confirm Alert → deleteExpense() → router.back()
```

---

## 💳 Step 8 — Payment Service + Screen

### `services/payment.service.ts`

```typescript
import api from './api';

// SCREEN: payment/[shareId].tsx — Step 1
export const initiatePayment = async (shareId: string) => {
  // POST /payment/initiate
  // Body: { shareId }
  // Response: { data: {
  //   paymentId,
  //   shareAmount: 1750.00,
  //   payee: { id, name, upiId },
  //   upiLinks: { gpay: "gpay://...", phonepe: "phonepe://...", paytm: "paytmmp://...", bhim: "upi://..." },
  //   transactionRef: "splitEasy_cm5shr456",
  //   expense: { id, title, amount }
  // }}
  const res = await api.post('/payment/initiate', { shareId });
  return res.data.data;
};

// SCREEN: payment/[shareId].tsx — user ne UPI app select kiya
export const recordUpiApp = async (
  paymentId: string,
  upiApp: 'gpay' | 'phonepe' | 'paytm' | 'bhim'
) => {
  // PATCH /payment/:paymentId/app
  // Body: { upiApp }
  await api.patch(`/payment/${paymentId}/app`, { upiApp });
};

// SCREEN: payment/[shareId].tsx — UPI app se wapas aaya, confirm karo
export const confirmPayment = async (
  paymentId: string,
  status: 'CONFIRMED' | 'FAILED'
) => {
  // PATCH /payment/:paymentId/confirm
  // Body: { status }
  // Response: { data: { paymentId, status, paidAt, shareId } }
  const res = await api.patch(`/payment/${paymentId}/confirm`, { status });
  return res.data.data;
};

// SCREEN: payment detail / history me details ke liye
export const getPaymentDetails = async (paymentId: string) => {
  // GET /payment/:paymentId
  // Response: { data: {
  //   id, amount, status, upiApp, initiatedAt, confirmedAt,
  //   payer: { id, name },
  //   payee: { id, name, upiId },
  //   share: { expense: { id, title, amount } }
  // }}
  const res = await api.get(`/payment/${paymentId}`);
  return res.data.data;
};

// SCREEN: activity.tsx — payment history tab
export const getPaymentHistory = async (page = 1, limit = 20) => {
  // GET /payment/history/me?page=1&limit=20
  // Response: { data: {
  //   payments: [{
  //     id, amount, status, upiApp, initiatedAt, confirmedAt,
  //     payer: { id, name },
  //     payee: { id, name, upiId },
  //     share: { expense: { id, title, amount } }
  //   }],
  //   pagination: { page, limit, total, totalPages }
  // }}
  const res = await api.get('/payment/history/me', { params: { page, limit } });
  return res.data.data; // { payments, pagination }
};
```

### Screen: `app/payment/[shareId].tsx` — Poora Flow

```
STATE MACHINE: idle → pending → success | failed

Step 1 — IDLE (on mount)
  - initiatePayment(shareId) call karo
  - paymentId, shareAmount, payee info, upiLinks store karo
  - 4 UPI app buttons dikhao

Step 2 — USER TAPS UPI APP BUTTON
  - recordUpiApp(paymentId, appId) call karo
  - Linking.openURL(upiLinks[appId]) se app kholo
  - State: 'pending'
  - "Did payment go through?" screen dikhao

Step 3 — USER WAPAS AAYA (AppState listener se detect karo)
  - 2 buttons dikhao:
    → "Yes, Payment Done" → confirmPayment(paymentId, 'CONFIRMED')
    → "Payment Failed"    → confirmPayment(paymentId, 'FAILED')

Step 4A — CONFIRMED
  - Success screen/animation
  - router.back() ya group detail pe navigate karo

Step 4B — FAILED
  - Error screen
  - "Try Again" button → state: 'idle' → same flow restart

IMPORTANT — AppState detect karna (UPI app se wapas aana):
import { AppState } from 'react-native';
useEffect(() => {
  const sub = AppState.addEventListener('change', (state) => {
    if (state === 'active' && currentStatus === 'pending') {
      // User wapas aaya UPI app se — confirmation screen dikhao
    }
  });
  return () => sub.remove();
}, [currentStatus]);
```

---

## 📊 Step 9 — Tab Screens

### `app/(tabs)/index.tsx` — Home
```
APIs to call on mount (parallel):
  1. userService.getUserStats()     → totalGroups, youOwe, theyOwe, totalAmount
  2. groupService.getGroupDetails() → groups list (agar separate endpoint nahi hai
                                      to stats se groups count dikhao only)

UI sections:
  - Welcome: "Hey {user.name}! 👋"
  - Stats cards: "You Owe: ₹250" | "They Owe: ₹180"
  - Quick actions: "Create Group" | "Join Group"
  - Recent groups list (tap → group/[id].tsx)
```

### `app/(tabs)/activity.tsx` — Payment History
```
API: paymentService.getPaymentHistory()

Each payment item me:
  - Sent ya Received (payerId vs current user.id se decide karo)
  - Amount
  - Status badge: CONFIRMED (green) | FAILED (red) | INITIATED (yellow)
  - Expense title
  - Date

Infinite scroll ya pagination: page state rakho, FlatList ka onEndReached use karo
```

---

## 🔔 Step 10 — Push Notifications Setup

**`hooks/usePushNotification.ts`**

```typescript
import * as Notifications from 'expo-notifications';
import { userService } from '../services/user.service';

export const registerForPushNotifications = async () => {
  // Permission lo
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== 'granted') return;

  // Expo push token lo
  const token = (await Notifications.getExpoPushTokenAsync()).data;

  // Backend me save karo
  await userService.updatePushToken(token);
  // PATCH /user/push-token → { expoPushToken: token }
};
```

Ye function app startup pe call karo (`app/_layout.tsx` me useEffect ke andar).

---

## ⚠️ Important Business Rules (Backend se)

```
Groups:
  ✅ Max 2 members per group
  ✅ Invite code format: "GRP-XXXX"

Expenses:
  ✅ Amount equally split hota hai dono members me
  ✅ Sirf addedBy hi delete/update kar sakta hai
  ✅ Delete tab nahi hoga jab dusre ne payment kar di ho (409)
  ✅ Sirf description aur date update ho sakti hai (title/amount nahi)

Payments:
  ✅ Ek share ke liye sirf ek payment hoti hai
  ✅ Paise pay karne ke baad dobara pay nahi ho sakta (409)
  ✅ Sirf payer hi confirm kar sakta hai

Reminders:
  ✅ Sirf 1 baar per 24 hours bhejna allowed
  ✅ 429 aaye to "Already reminded today" dikhao

Auth:
  ✅ OTP: 5 requests per 15 minutes (rate limit)
  ✅ Access token expires: 15 minutes
  ✅ Refresh token expires: 30 days
  ✅ Dev mode default OTP: 123456
```

---

## 🚀 Build Order (Sequence Me Karo)

```
Week 1:
  [ ] services/api.ts
  [ ] store/auth.store.ts
  [ ] app/_layout.tsx (auth guard)
  [ ] login.tsx → verify-otp.tsx → complete-profile.tsx

Week 2:
  [ ] services/group.service.ts
  [ ] (tabs)/groups.tsx
  [ ] group/[id].tsx (balance + expenses list)
  [ ] group/join.tsx

Week 3:
  [ ] services/expense.service.ts
  [ ] expense/add.tsx
  [ ] expense/[id].tsx

Week 4:
  [ ] services/payment.service.ts
  [ ] payment/[shareId].tsx (full UPI flow)
  [ ] (tabs)/activity.tsx

Week 5:
  [ ] (tabs)/index.tsx (home dashboard)
  [ ] Push notifications
  [ ] Profile/Settings screen
  [ ] Error states + empty states polish
```

---

## 🐛 Common Gotchas

| Problem | Solution |
|---|---|
| 401 on every request | Axios interceptor me token refresh dekho |
| UPI app nahi khula | `Linking.canOpenURL()` pehle check karo, fallback `upi://` use karo |
| FlatList blank | `data` prop array hona chahiye, `keyExtractor` required hai |
| Keyboard input hide ho gaya | `KeyboardAvoidingView` wrap karo |
| Android/iOS shadow difference | `elevation` Android ke liye, `shadow*` iOS ke liye — dono likho |
| Amount decimal issue | `parseFloat(amount).toFixed(2)` use karo |
| Date format wrong | `new Date().toISOString()` backend ko bhejo |
| Group balance refresh nahi hua | `useFocusEffect` use karo instead of `useEffect` tab screens pe |

---

*Backend Railway pe deploy hai. `BASE_URL` production me update karna mat bhoolo.*
