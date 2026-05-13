# SplitEasy – Complete File, Route, Controller & Function Reference

---

## BACKEND FILE TREE (every file you need to create)

```
backend/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── index.js
│   ├── config/
│   │   └── env.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── group.routes.js
│   │   ├── expense.routes.js
│   │   └── payment.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── group.controller.js
│   │   ├── expense.controller.js
│   │   └── payment.controller.js
│   ├── services/
│   │   ├── otp.service.js
│   │   ├── upi.service.js
│   │   └── notification.service.js
│   └── utils/
│       ├── jwt.js
│       └── response.js
├── .env
└── package.json
```

---

## FRONTEND FILE TREE (every file you need to create)

```
frontend/
├── app/
│   ├── _layout.jsx                  (root layout, fonts, auth gate)
│   ├── index.jsx                    (splash / redirect logic)
│   ├── (auth)/
│   │   ├── _layout.jsx
│   │   ├── mobile.jsx               (enter mobile number screen)
│   │   ├── otp.jsx                  (enter OTP screen)
│   │   └── profile-setup.jsx        (name + UPI ID — new users only)
│   ├── (app)/
│   │   ├── _layout.jsx              (tab navigator + auth guard)
│   │   ├── home.jsx                 (group expenses list)
│   │   ├── balance.jsx              (net balance summary)
│   │   └── profile.jsx              (user profile + UPI settings)
│   ├── expense/
│   │   ├── add.jsx                  (add expense form)
│   │   └── [id].jsx                 (expense detail screen)
│   └── payment/
│       └── return.jsx               (deep link return handler screen)
├── components/
│   ├── ExpenseCard.jsx
│   ├── PaymentModal.jsx             (UPI app picker bottom sheet)
│   ├── SplitBadge.jsx               (shows "You owe ₹20" / "Settled")
│   ├── OtpInput.jsx                 (6-box OTP input UI)
│   └── EmptyState.jsx
├── hooks/
│   ├── useAuth.js
│   ├── useGroup.js
│   └── useExpenses.js
├── services/
│   ├── api.js                       (axios instance with interceptors)
│   └── storage.js                   (AsyncStorage helpers)
├── constants/
│   └── upiApps.js                   (GPay, Paytm, PhonePe, BHIM configs)
└── app.json                         (Expo config + deep link scheme)
```

---

## BACKEND — FILE BY FILE BREAKDOWN

---

### `src/index.js`
**Purpose:** Express app entry point. Mounts all routes.

| What to write |
|---|
| `import express, cors, prisma` |
| `app.use(cors(), express.json())` |
| Mount routes: `/api/v1/auth`, `/api/v1/user`, `/api/v1/group`, `/api/v1/expense`, `/api/v1/payment` |
| Mount `errorHandler` middleware last |
| `app.listen(PORT)` |

---

### `src/config/env.js`
**Purpose:** Load and validate all environment variables on startup.

| Variable | Used in |
|---|---|
| `DATABASE_URL` | Prisma |
| `JWT_SECRET` | jwt.js |
| `JWT_REFRESH_SECRET` | jwt.js |
| `MSG91_AUTH_KEY` | otp.service.js |
| `MSG91_TEMPLATE_ID` | otp.service.js |
| `PORT` | index.js |
| `NODE_ENV` | otp.service.js (devOtp) |

---

### `src/middleware/auth.js`
**Purpose:** JWT verification middleware. Attaches `req.userId` to every protected request.

| Function | What it does |
|---|---|
| `authenticate(req, res, next)` | Reads `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, sets `req.userId`, calls `next()`. Returns 401 if missing or invalid. |

---

### `src/middleware/errorHandler.js`
**Purpose:** Global Express error handler. Catches anything thrown in controllers.

| Function | What it does |
|---|---|
| `errorHandler(err, req, res, next)` | Logs error, returns `{ success: false, message }` with appropriate status code. |

---

### `src/utils/jwt.js`
**Purpose:** Wrapper functions for signing and verifying JWTs.

| Function | Signature | What it does |
|---|---|---|
| `signAccessToken` | `(userId) => string` | Signs JWT with `JWT_SECRET`, expiry 15m |
| `signRefreshToken` | `(userId) => string` | Signs JWT with `JWT_REFRESH_SECRET`, expiry 30d |
| `verifyAccessToken` | `(token) => { userId }` | Verifies and decodes access token |
| `verifyRefreshToken` | `(token) => { userId }` | Verifies and decodes refresh token |

---

### `src/utils/response.js`
**Purpose:** Consistent response shape helpers.

| Function | Signature | Returns |
|---|---|---|
| `sendSuccess` | `(res, data, status=200)` | `{ success: true, data }` |
| `sendError` | `(res, message, status=400)` | `{ success: false, message }` |

---

### `src/services/otp.service.js`
**Purpose:** All OTP logic — generate, send via MSG91, verify from DB.

| Function | Signature | What it does |
|---|---|---|
| `generateOtp` | `() => string` | Returns random 6-digit string |
| `sendOtp` | `async (mobile) => void` | Generates OTP, saves to `OtpRecord` in DB, calls MSG91 API via fetch |
| `verifyOtp` | `async (mobile, otp) => boolean` | Finds latest unused non-expired OtpRecord, compares, marks used, returns true/false |
| `checkRateLimit` | `async (mobile) => void` | Counts OtpRecords in last 10 min, throws 429 error if >= 3 |

---

### `src/services/upi.service.js`
**Purpose:** Build UPI deep link URIs for all payment apps.

| Function | Signature | What it does |
|---|---|---|
| `generateUpiLinks` | `({ payeeUpiId, payeeName, amount, note, ref }) => object` | Returns object with keys: `generic`, `gpay`, `paytm`, `phonepe`, `bhim` — each a complete URI string |

---

### `src/services/notification.service.js`
**Purpose:** Send push notifications via Expo Push API (free).

| Function | Signature | What it does |
|---|---|---|
| `sendPush` | `async (expoPushToken, title, body, data={}) => void` | POST to `https://exp.host/--/api/v2/push/send`. Silently fails if token is null. |
| `notifyExpenseAdded` | `async (toUser, byUser, expense) => void` | Calls `sendPush` with "New Expense: {title}" message |
| `notifyPaymentReceived` | `async (toUser, byUser, amount, expenseTitle) => void` | Calls `sendPush` with "Payment Received ✅" message |
| `notifyReminder` | `async (toUser, fromUser) => void` | Calls `sendPush` with reminder message |

---

### `src/routes/auth.routes.js`
**Purpose:** Mount auth endpoints.

| Method | Path | Middleware | Controller fn |
|---|---|---|---|
| POST | `/send-otp` | — | `sendOtp` |
| POST | `/verify-otp` | — | `verifyOtp` |
| POST | `/complete-profile` | `authenticate` | `completeProfile` |
| POST | `/refresh` | — | `refreshToken` |
| POST | `/logout` | `authenticate` | `logout` |

---

### `src/controllers/auth.controller.js`
**Purpose:** Handle auth request/response logic.

| Function | What it does |
|---|---|
| `sendOtp(req, res)` | Validates mobile (regex), calls `otpService.checkRateLimit`, calls `otpService.sendOtp`, returns success |
| `verifyOtp(req, res)` | Calls `otpService.verifyOtp`, finds-or-creates User by mobile, issues access+refresh tokens, saves refresh token to DB, returns `{ user, accessToken, refreshToken, isNewUser }` |
| `completeProfile(req, res)` | Updates `user.name` and `user.upiId` for `req.userId` |
| `refreshToken(req, res)` | Verifies refresh token from DB, issues new access token |
| `logout(req, res)` | Deletes refresh token from DB |

---

### `src/routes/user.routes.js`
**Purpose:** Mount user profile endpoints. All routes use `authenticate`.

| Method | Path | Middleware | Controller fn |
|---|---|---|---|
| GET | `/me` | `authenticate` | `getMe` |
| PATCH | `/profile` | `authenticate` | `updateProfile` |
| PATCH | `/push-token` | `authenticate` | `updatePushToken` |

---

### `src/controllers/user.controller.js`

| Function | What it does |
|---|---|
| `getMe(req, res)` | Finds user by `req.userId`, returns `{ id, mobile, name, upiId, expoPushToken }` |
| `updateProfile(req, res)` | Updates `name` and/or `upiId` for `req.userId` |
| `updatePushToken(req, res)` | Updates `expoPushToken` for `req.userId`. Called on every app launch. |

---

### `src/routes/group.routes.js`
**Purpose:** Mount group endpoints. All routes use `authenticate`.

| Method | Path | Middleware | Controller fn |
|---|---|---|---|
| POST | `/` | `authenticate` | `createGroup` |
| POST | `/join` | `authenticate` | `joinGroup` |
| GET | `/:groupId` | `authenticate` | `getGroup` |
| GET | `/:groupId/balance` | `authenticate` | `getBalance` |
| POST | `/:groupId/remind` | `authenticate` | `sendReminder` |

---

### `src/controllers/group.controller.js`

| Function | What it does |
|---|---|
| `createGroup(req, res)` | Creates Group with random `inviteCode`, creates GroupMember for `req.userId` |
| `joinGroup(req, res)` | Finds group by `inviteCode`, checks not already member, checks max 2 members, creates GroupMember |
| `getGroup(req, res)` | Returns group + members, checks `req.userId` is a member |
| `getBalance(req, res)` | Sums all unpaid ExpenseShares for each user, computes net, returns `{ direction, amount, person }` |
| `sendReminder(req, res)` | Checks 24hr cooldown via Reminder table, calls `notificationService.notifyReminder`, saves Reminder record |

---

### `src/routes/expense.routes.js`
**Purpose:** Mount expense endpoints. All routes use `authenticate`.

| Method | Path | Middleware | Controller fn |
|---|---|---|---|
| POST | `/` | `authenticate` | `addExpense` |
| GET | `/group/:groupId` | `authenticate` | `getGroupExpenses` |
| GET | `/:expenseId` | `authenticate` | `getExpense` |
| DELETE | `/:expenseId` | `authenticate` | `deleteExpense` |

---

### `src/controllers/expense.controller.js`

| Function | What it does |
|---|---|
| `addExpense(req, res)` | Validates fields, fetches group members (must be 2), creates Expense + 2 ExpenseShare records (adder = isPaid:true, other = isPaid:false), calls `notificationService.notifyExpenseAdded` |
| `getGroupExpenses(req, res)` | Returns paginated expenses for group sorted by date desc, includes each expense's `myShare` for `req.userId` and `isSettled` boolean |
| `getExpense(req, res)` | Returns single expense with all shares + payment info |
| `deleteExpense(req, res)` | Checks ownership + no paid shares from other user, deletes ExpenseShares then Expense |

---

### `src/routes/payment.routes.js`
**Purpose:** Mount payment endpoints. All routes use `authenticate`.

| Method | Path | Middleware | Controller fn |
|---|---|---|---|
| POST | `/initiate` | `authenticate` | `initiatePayment` |
| PATCH | `/:paymentId/app` | `authenticate` | `recordUpiApp` |
| PATCH | `/:paymentId/confirm` | `authenticate` | `confirmPayment` |
| PATCH | `/:paymentId/fail` | `authenticate` | `failPayment` |
| GET | `/:paymentId` | `authenticate` | `getPayment` |

---

### `src/controllers/payment.controller.js`

| Function | What it does |
|---|---|
| `initiatePayment(req, res)` | Finds ExpenseShare by `shareId`, checks not already paid, creates Payment record (status: INITIATED), calls `upiService.generateUpiLinks` with payee's UPI ID, returns `{ paymentId, upiLinks, transactionRef }` |
| `recordUpiApp(req, res)` | Updates `payment.upiApp` with selected app name ("gpay", "paytm" etc.) |
| `confirmPayment(req, res)` | In a Prisma `$transaction`: sets Payment.status=CONFIRMED + ExpenseShare.isPaid=true + paidAt=now, then calls `notificationService.notifyPaymentReceived` |
| `failPayment(req, res)` | Sets Payment.status=FAILED. Share stays unpaid so user can retry. |
| `getPayment(req, res)` | Returns payment status, app used, amount, timestamps |

---

## FRONTEND — FILE BY FILE BREAKDOWN

---

### `services/api.js`
**Purpose:** Axios instance. Auto-attaches JWT. Auto-refreshes on 401.

| What to write |
|---|
| `axios.create({ baseURL: API_URL })` |
| Request interceptor: read token from AsyncStorage, attach as `Authorization: Bearer` header |
| Response interceptor: on 401, call `/auth/refresh`, retry original request, on second 401 logout user |

---

### `services/storage.js`
**Purpose:** AsyncStorage wrappers.

| Function | What it does |
|---|---|
| `saveTokens(access, refresh)` | Saves both tokens |
| `getAccessToken()` | Returns stored access token |
| `getRefreshToken()` | Returns stored refresh token |
| `clearTokens()` | Clears both (on logout) |
| `saveUser(user)` | Saves user object as JSON string |
| `getUser()` | Returns parsed user object |
| `clearAll()` | Full logout cleanup |

---

### `hooks/useAuth.js`
**Purpose:** Auth state and actions across the app.

| Export | What it does |
|---|---|
| `user` | Current user object (or null) |
| `isLoading` | True while checking stored tokens on app launch |
| `sendOtp(mobile)` | Calls `POST /auth/send-otp` |
| `verifyOtp(mobile, otp)` | Calls `POST /auth/verify-otp`, saves tokens, sets user |
| `completeProfile(name, upiId)` | Calls `POST /auth/complete-profile` |
| `logout()` | Calls `POST /auth/logout`, clears storage, resets state |

---

### `hooks/useGroup.js`
**Purpose:** Group data and actions.

| Export | What it does |
|---|---|
| `group` | Current group object |
| `balance` | Net balance object |
| `isLoading` | Loading state |
| `createGroup(name)` | Calls `POST /group` |
| `joinGroup(inviteCode)` | Calls `POST /group/join` |
| `fetchGroup(groupId)` | Calls `GET /group/:groupId` |
| `fetchBalance(groupId)` | Calls `GET /group/:groupId/balance` |
| `sendReminder(groupId, targetUserId)` | Calls `POST /group/:groupId/remind` |

---

### `hooks/useExpenses.js`
**Purpose:** Expense list, detail, and mutations.

| Export | What it does |
|---|---|
| `expenses` | Array of expense objects |
| `isLoading` | Loading state |
| `fetchExpenses(groupId)` | Calls `GET /expense/group/:groupId` |
| `fetchExpense(expenseId)` | Calls `GET /expense/:expenseId` |
| `addExpense(data)` | Calls `POST /expense` |
| `deleteExpense(expenseId)` | Calls `DELETE /expense/:expenseId` |

---

### `app/(auth)/mobile.jsx`
**Purpose:** Screen where user enters mobile number.

| What to write |
|---|
| Text input for 10-digit mobile number |
| Validate on client before hitting API |
| "Send OTP" button → calls `useAuth.sendOtp` |
| On success → `router.push('/otp', { mobile })` |

---

### `app/(auth)/otp.jsx`
**Purpose:** Screen where user enters 6-digit OTP.

| What to write |
|---|
| Use `OtpInput` component (6 boxes) |
| Auto-submit when all 6 digits entered |
| Calls `useAuth.verifyOtp(mobile, otp)` |
| Countdown timer (60s) + "Resend OTP" button |
| If `isNewUser` → `router.replace('/profile-setup')` |
| If existing user → `router.replace('/home')` |

---

### `app/(auth)/profile-setup.jsx`
**Purpose:** First-time only. Collect name and UPI ID.

| What to write |
|---|
| Name input (required) |
| UPI ID input (optional, can skip and set later) |
| "Continue" → calls `useAuth.completeProfile(name, upiId)` |
| On success → `router.replace('/home')` |

---

### `app/(app)/home.jsx`
**Purpose:** Main screen — list of group expenses + balance banner.

| What to write |
|---|
| On mount: `fetchGroup`, `fetchExpenses`, `fetchBalance` |
| Balance banner at top (green if they owe you, red if you owe) |
| FlatList of `ExpenseCard` components |
| FAB "+" button → navigate to `/expense/add` |
| Pull-to-refresh |

---

### `app/expense/add.jsx`
**Purpose:** Form to add a new expense.

| Field | Detail |
|---|---|
| Title | Text input, required |
| Amount | Numeric input, required |
| Description | Text input, optional |
| Date | DateTimePicker, defaults to today |
| Time | TimePicker, defaults to now |
| Submit button | Calls `addExpense`, navigates back on success |

---

### `app/expense/[id].jsx`
**Purpose:** Expense detail screen.

| What to write |
|---|
| Show title, amount, date, description, added-by |
| Show both shares with name + amount |
| Your share: if `isPaid` show ✅ Paid, else show "Pay ₹X" button |
| "Pay ₹X" → calls `initiatePayment(shareId)` → opens `PaymentModal` |
| Pass `paymentId` and `upiLinks` to modal |

---

### `components/PaymentModal.jsx`
**Purpose:** Bottom sheet that shows available UPI apps and triggers deep link.

| What to write |
|---|
| Receive props: `paymentId`, `upiLinks`, `amount`, `payeeName`, `onClose` |
| On mount: loop through each UPI app, call `Linking.canOpenURL(uri)` to check if installed |
| Render only installed apps as tappable icons |
| On tap: call `PATCH /payment/:id/app { upiApp }`, then `Linking.openURL(selectedUri)` |
| Show confirmation dialog on return: "Did you complete the payment?" |
| "Yes" → `PATCH /payment/:id/confirm` → close modal, refresh expense |
| "No" → `PATCH /payment/:id/fail` → close modal |

---

### `constants/upiApps.js`
**Purpose:** Static config for all supported UPI apps.

| What to write |
|---|
| Array of `{ id, label, androidPackage, iosScheme, icon }` for GPay, Paytm, PhonePe, BHIM |
| Helper `buildIntentUrl(upiParams, app)` that constructs the correct Android intent or iOS scheme URL |

---

### `app.json` (Expo config)
**Purpose:** Register deep link scheme so UPI apps can redirect back.

| What to add |
|---|
| `"scheme": "spliteasy"` under `expo` |
| This enables `spliteasy://payment-return?ref=xxx` deep links |
| Add `intentFilters` for Android to handle the return |

---

### `app/payment/return.jsx`
**Purpose:** Catches the deep link when UPI app redirects back.

| What to write |
|---|
| Use `Linking.addEventListener` or Expo Router's `useLocalSearchParams` |
| Extract `ref` from URL params |
| Navigate to the correct expense screen |
| PaymentModal handles the confirm/fail dialog from there |

---

## PRISMA SCHEMA — ALL MODELS

```prisma
model User {
  id              String         @id @default(uuid())
  mobile          String         @unique
  name            String?
  upiId           String?
  expoPushToken   String?
  createdAt       DateTime       @default(now())
  groupMemberships GroupMember[]
  expensesAdded   Expense[]      @relation("AddedBy")
  expenseShares   ExpenseShare[]
  paymentsGiven   Payment[]      @relation("Payer")
  paymentsReceived Payment[]     @relation("Payee")
  refreshTokens   RefreshToken[]
  remindersSent   Reminder[]     @relation("SentBy")
  remindersReceived Reminder[]   @relation("SentTo")
}

model OtpRecord {
  id        String   @id @default(uuid())
  mobile    String
  otp       String
  expiresAt DateTime
  used      Boolean  @default(false)
  createdAt DateTime @default(now())
  @@index([mobile])
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
}

model Group {
  id          String        @id @default(uuid())
  name        String
  inviteCode  String        @unique
  createdAt   DateTime      @default(now())
  members     GroupMember[]
  expenses    Expense[]
  reminders   Reminder[]
}

model GroupMember {
  id       String   @id @default(uuid())
  groupId  String
  userId   String
  joinedAt DateTime @default(now())
  group    Group    @relation(fields: [groupId], references: [id])
  user     User     @relation(fields: [userId], references: [id])
  @@unique([groupId, userId])
}

model Expense {
  id          String         @id @default(uuid())
  groupId     String
  addedById   String
  title       String
  description String?
  amount      Float
  date        DateTime       @default(now())
  createdAt   DateTime       @default(now())
  group       Group          @relation(fields: [groupId], references: [id])
  addedBy     User           @relation("AddedBy", fields: [addedById], references: [id])
  shares      ExpenseShare[]
}

model ExpenseShare {
  id          String    @id @default(uuid())
  expenseId   String
  userId      String
  shareAmount Float
  isPaid      Boolean   @default(false)
  paidAt      DateTime?
  expense     Expense   @relation(fields: [expenseId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  payment     Payment?
  @@unique([expenseId, userId])
}

model Payment {
  id          String        @id @default(uuid())
  shareId     String        @unique
  payerId     String
  payeeId     String
  amount      Float
  upiApp      String?
  status      PaymentStatus @default(INITIATED)
  initiatedAt DateTime      @default(now())
  confirmedAt DateTime?
  share       ExpenseShare  @relation(fields: [shareId], references: [id])
  payer       User          @relation("Payer", fields: [payerId], references: [id])
  payee       User          @relation("Payee", fields: [payeeId], references: [id])
}

model Reminder {
  id           String   @id @default(uuid())
  groupId      String
  sentByUserId String
  sentToUserId String
  sentAt       DateTime @default(now())
  group        Group    @relation(fields: [groupId], references: [id])
  sentBy       User     @relation("SentBy", fields: [sentByUserId], references: [id])
  sentTo       User     @relation("SentTo", fields: [sentToUserId], references: [id])
}

enum PaymentStatus {
  INITIATED
  CONFIRMED
  FAILED
}
```

---

## BUILD ORDER (recommended sequence)

```
1. prisma/schema.prisma          → define all models, run migration
2. src/utils/jwt.js              → sign/verify helpers
3. src/utils/response.js         → sendSuccess / sendError
4. src/middleware/auth.js        → authenticate middleware
5. src/middleware/errorHandler.js
6. src/services/otp.service.js   → MSG91 integration
7. src/services/upi.service.js   → UPI link builder
8. src/services/notification.service.js → Expo push
9. src/controllers/auth.controller.js
10. src/routes/auth.routes.js
11. src/controllers/user.controller.js
12. src/routes/user.routes.js
13. src/controllers/group.controller.js
14. src/routes/group.routes.js
15. src/controllers/expense.controller.js
16. src/routes/expense.routes.js
17. src/controllers/payment.controller.js
18. src/routes/payment.routes.js
19. src/index.js                 → mount everything, test all routes
─────────────────────────────────────────────────────
20. services/api.js              → axios + interceptors
21. services/storage.js          → AsyncStorage helpers
22. hooks/useAuth.js
23. app/(auth)/mobile.jsx
24. app/(auth)/otp.jsx
25. app/(auth)/profile-setup.jsx
26. hooks/useGroup.js
27. hooks/useExpenses.js
28. app/(app)/home.jsx
29. app/expense/add.jsx
30. app/expense/[id].jsx
31. components/PaymentModal.jsx  → hardest frontend piece
32. constants/upiApps.js
33. app.json deep link config
34. app/payment/return.jsx
```
