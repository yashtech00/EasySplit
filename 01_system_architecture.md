# SplitEasy – System Architecture (In-Depth)

---

## 1. Overview

SplitEasy is a 2-person expense splitting app (MVP scope: you and one friend) with real-world UPI deep-link payment integration. The system is designed for simplicity, speed, and zero monthly infra cost using free tiers.

---

## 2. High-Level Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │           React Native (Expo) App                      │    │
│   │  - Auth screens        - Group/Expense screens         │    │
│   │  - Payment popup        - UPI deep-link handler        │    │
│   └─────────────────────────┬─────────────────────────────┘    │
└─────────────────────────────┼───────────────────────────────────┘
                              │ HTTPS REST (JSON)
                              │
┌─────────────────────────────▼───────────────────────────────────┐
│                        SERVER LAYER                             │
│                                                                 │
│   ┌───────────────────────────────────────────────────────┐    │
│   │          Node.js + Express API Server                  │    │
│   │  - JWT Auth middleware   - Expense routes              │    │
│   │  - Group routes          - Payment routes              │    │
│   │  - Push notification svc - UPI link generator          │    │
│   └──────────────┬───────────────────┬──────────────────────┘   │
└─────────────────┼───────────────────┼──────────────────────────┘
                  │                   │
      ┌───────────▼──────┐   ┌────────▼──────────┐
      │   PostgreSQL DB   │   │  Expo Push API     │
      │   (via Prisma)    │   │  (free, no key)    │
      └───────────────────┘   └────────────────────┘
```

---

## 3. Tech Stack Decisions

| Layer | Technology | Why / Free Tier |
|---|---|---|
| Frontend | React Native (Expo) | Cross-platform iOS+Android, Expo Go for dev |
| Backend | Node.js + Express | Lightweight, fast to build |
| ORM | Prisma | Type-safe DB access, auto migrations |
| Database | PostgreSQL | Relational, free on Railway / Neon.tech (0.5 GB free) |
| Auth | JWT (access + refresh tokens) | No third-party dependency |
| Push Notifications | Expo Push Notifications | Free, no account needed beyond Expo |
| Payment | UPI Deep Links | Zero cost, no payment gateway needed |
| Hosting (Backend) | Railway free tier OR Render free tier | 500 hours/month free |
| File Storage | None needed for MVP | No receipts/images in v1 |

---

## 4. Database Schema (Prisma)

```prisma
// schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  passwordHash    String
  upiId           String?           // e.g. "anurag@okaxis"
  expoPushToken   String?           // for push notifications
  createdAt       DateTime  @default(now())

  groupMemberships  GroupMember[]
  expensesAdded     Expense[]         @relation("AddedBy")
  expenseShares     ExpenseShare[]
  paymentsInitiated Payment[]         @relation("Payer")
  paymentsReceived  Payment[]         @relation("Payee")
}

model Group {
  id          String    @id @default(uuid())
  name        String
  createdAt   DateTime  @default(now())

  members     GroupMember[]
  expenses    Expense[]
}

model GroupMember {
  id        String    @id @default(uuid())
  groupId   String
  userId    String
  joinedAt  DateTime  @default(now())

  group     Group     @relation(fields: [groupId], references: [id])
  user      User      @relation(fields: [userId], references: [id])

  @@unique([groupId, userId])
}

model Expense {
  id          String    @id @default(uuid())
  groupId     String
  addedById   String
  title       String
  description String?
  amount      Float
  date        DateTime  @default(now())
  createdAt   DateTime  @default(now())

  group       Group     @relation(fields: [groupId], references: [id])
  addedBy     User      @relation("AddedBy", fields: [addedById], references: [id])
  shares      ExpenseShare[]
}

model ExpenseShare {
  id          String    @id @default(uuid())
  expenseId   String
  userId      String
  shareAmount Float               // always amount/2 for 2-person groups
  isPaid      Boolean   @default(false)
  paidAt      DateTime?

  expense     Expense   @relation(fields: [expenseId], references: [id])
  user        User      @relation(fields: [userId], references: [id])
  payment     Payment?

  @@unique([expenseId, userId])
}

model Payment {
  id            String    @id @default(uuid())
  shareId       String    @unique
  payerId       String
  payeeId       String
  amount        Float
  upiApp        String              // "gpay" | "paytm" | "phonepe" | "bhim"
  status        PaymentStatus @default(INITIATED)
  initiatedAt   DateTime  @default(now())
  confirmedAt   DateTime?

  share         ExpenseShare @relation(fields: [shareId], references: [id])
  payer         User      @relation("Payer", fields: [payerId], references: [id])
  payee         User      @relation("Payee", fields: [payeeId], references: [id])
}

enum PaymentStatus {
  INITIATED
  CONFIRMED
  FAILED
}
```

---

## 5. Folder Structure

### Backend
```
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── src/
│   ├── index.js                  # Express app entry
│   ├── config/
│   │   └── env.js                # dotenv loader
│   ├── middleware/
│   │   ├── auth.js               # JWT verify middleware
│   │   └── errorHandler.js
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── group.routes.js
│   │   ├── expense.routes.js
│   │   └── payment.routes.js
│   ├── controllers/
│   │   ├── auth.controller.js
│   │   ├── group.controller.js
│   │   ├── expense.controller.js
│   │   └── payment.controller.js
│   ├── services/
│   │   ├── upi.service.js        # UPI deep link generator
│   │   └── notification.service.js # Expo push
│   └── utils/
│       ├── jwt.js
│       └── response.js
├── .env
├── package.json
└── README.md
```

### Frontend
```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login.jsx
│   │   └── register.jsx
│   ├── (tabs)/
│   │   ├── index.jsx             # Home / Group expenses
│   │   └── profile.jsx
│   ├── expense/
│   │   ├── add.jsx               # Add expense form
│   │   └── [id].jsx              # Expense detail
│   └── _layout.jsx
├── components/
│   ├── ExpenseCard.jsx
│   ├── PaymentModal.jsx          # UPI app picker popup
│   └── SplitBadge.jsx
├── hooks/
│   ├── useAuth.js
│   └── useExpenses.js
├── services/
│   ├── api.js                    # Axios instance
│   └── storage.js                # AsyncStorage helpers
├── constants/
│   └── upiApps.js                # GPay, Paytm, PhonePe configs
└── app.json
```

---

## 6. Authentication Flow

```
User opens app
     │
     ▼
Check AsyncStorage for JWT token
     │
     ├── Token exists & valid → Skip to Home
     │
     └── No token / expired
              │
              ▼
         Login Screen
              │
         POST /auth/login
              │
         Server validates email+password
         Returns: { accessToken, refreshToken, user }
              │
         Store tokens in AsyncStorage
              │
              ▼
           Home Screen
```

JWT Strategy:
- Access token: 15 min expiry
- Refresh token: 30 days expiry, stored in DB for revocation
- All protected routes require `Authorization: Bearer <token>` header

---

## 7. UPI Deep Link Architecture

UPI deep links are native URI schemes recognized by payment apps. No payment gateway needed.

### How it works:
```
App generates UPI URI
        │
        ▼
React Native Linking.openURL(upiUri)
        │
        ▼
OS finds registered app for "upi://" scheme
        │
        ├── GPay opens  → pre-fills ₹20 to anurag@okaxis
        ├── Paytm opens → pre-fills ₹20 to anurag@okaxis
        └── PhonePe opens → pre-fills ₹20
        │
User pays in app, app redirects back via deep link
        │
        ▼
SplitEasy re-opens (via Expo deep link handler)
        │
        ▼
App calls PATCH /payment/:id/confirm
        │
        ▼
Share marked as paid, UI updates
```

### UPI URI Format:
```
upi://pay?
  pa=PAYEE_UPI_ID       (e.g. anurag@okaxis)
  &pn=PAYEE_NAME        (e.g. Anurag)
  &am=AMOUNT            (e.g. 20.00)
  &cu=INR
  &tn=TRANSACTION_NOTE  (e.g. Auto - SplitEasy)
  &tr=TRANSACTION_REF   (e.g. splitEasy_shareId)
```

### App-specific overrides (intent URLs for Android):
```javascript
const UPI_APPS = {
  gpay: {
    label: "Google Pay",
    icon: "gpay_icon",
    android: "intent://pay?...#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end",
    ios: "gpay://upi/pay?..."
  },
  paytm: {
    label: "Paytm",
    android: "intent://pay?...#Intent;scheme=paytm;package=net.one97.paytm;end",
    ios: "paytmmp://pay?..."
  },
  phonepe: {
    label: "PhonePe",
    android: "intent://pay?...#Intent;scheme=upi;package=com.phonepe.app;end",
    ios: "phonepe://pay?..."
  },
  bhim: {
    label: "BHIM",
    android: "intent://pay?...#Intent;scheme=upi;package=in.org.npci.upiapp;end",
    ios: "bhim://pay?..."
  }
}
```

---

## 8. Push Notification Architecture

Using Expo Push Notification Service (free, no config needed beyond Expo SDK):

```
User B adds expense
       │
       ▼
POST /expense → server saves expense
       │
       ▼
Server reads User A's expoPushToken from DB
       │
       ▼
Server sends POST to https://exp.host/--/api/v2/push/send
{
  "to": "ExponentPushToken[xxxxx]",
  "title": "New Expense Added",
  "body": "User B added ₹40 for Auto. You owe ₹20."
}
       │
       ▼
Expo delivers push to User A's device
       │
       ▼
User A taps notification → opens expense detail
```

---

## 9. Environment Variables

```env
# .env (backend)
DATABASE_URL=postgresql://user:pass@host:5432/spliteasy
JWT_SECRET=your_super_secret_key_here
JWT_REFRESH_SECRET=your_refresh_secret_here
PORT=3000
NODE_ENV=development
```

---

## 10. Free Hosting Plan

| Service | Provider | Free Tier |
|---|---|---|
| PostgreSQL | Neon.tech | 0.5 GB, 10 branches, always free |
| Backend API | Render.com | 750 hrs/month (spins down after 15 min idle) |
| OR Backend | Railway.app | $5 credit/month (enough for personal use) |
| Frontend | Expo Go (dev) / EAS Build | Free builds for personal projects |
| Push | Expo Push | Free, unlimited for personal projects |

---

## 11. Security Considerations

- Passwords hashed with bcrypt (cost factor 12)
- JWT secrets in env vars, never hardcoded
- All routes protected except `/auth/login` and `/auth/register`
- UPI transactions confirmed by user action (no auto-mark paid)
- No sensitive payment data stored (only UPI ID and amount)
- HTTPS enforced on all API calls
- Rate limiting on auth routes (express-rate-limit, free)
