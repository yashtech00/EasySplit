# SplitEasy – Backend API Specification (In-Depth)

Base URL: `https://your-app.railway.app/api/v1`
All protected routes require: `Authorization: Bearer <accessToken>`
All responses follow: `{ success: bool, data: {}, message: string }`

---

## AUTH ROUTES

### POST /auth/register
Register a new user.

**Request Body:**
```json
{
  "name": "Anurag",
  "email": "anurag@gmail.com",
  "password": "mypassword123",
  "upiId": "anurag@okaxis"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Anurag", "email": "anurag@gmail.com" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```
**Errors:** 400 (validation), 409 (email exists)

---

### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "anurag@gmail.com",
  "password": "mypassword123"
}
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "user": { "id": "uuid", "name": "Anurag", "email": "anurag@gmail.com", "upiId": "anurag@okaxis" },
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```
**Errors:** 401 (invalid credentials)

---

### POST /auth/refresh
Get new access token using refresh token.

**Request Body:**
```json
{ "refreshToken": "eyJhbG..." }
```
**Response 200:**
```json
{
  "success": true,
  "data": { "accessToken": "eyJhbG..." }
}
```

---

### POST /auth/logout
Invalidate refresh token. 🔒 Protected.

**Request Body:**
```json
{ "refreshToken": "eyJhbG..." }
```
**Response 200:** `{ "success": true, "message": "Logged out" }`

---

## USER ROUTES

### GET /user/me 🔒
Get current logged-in user profile.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Anurag",
    "email": "anurag@gmail.com",
    "upiId": "anurag@okaxis",
    "expoPushToken": "ExponentPushToken[...]"
  }
}
```

---

### PATCH /user/profile 🔒
Update user profile (name, UPI ID).

**Request Body (all optional):**
```json
{
  "name": "Anurag Kumar",
  "upiId": "anurag@ibl"
}
```
**Response 200:**
```json
{
  "success": true,
  "data": { "id": "uuid", "name": "Anurag Kumar", "upiId": "anurag@ibl" }
}
```

---

### PATCH /user/push-token 🔒
Register or update Expo push token (called on app start).

**Request Body:**
```json
{ "expoPushToken": "ExponentPushToken[xxxxxx]" }
```
**Response 200:** `{ "success": true }`

---

## GROUP ROUTES

### POST /group 🔒
Create a new group.

**Request Body:**
```json
{ "name": "Me & Rohan" }
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Me & Rohan",
    "inviteCode": "GRP-4821",
    "members": [
      { "id": "uuid", "name": "Anurag" }
    ]
  }
}
```

---

### POST /group/join 🔒
Join an existing group using invite code.

**Request Body:**
```json
{ "inviteCode": "GRP-4821" }
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Me & Rohan",
    "members": [
      { "id": "uuid", "name": "Anurag" },
      { "id": "uuid", "name": "Rohan" }
    ]
  }
}
```
**Errors:** 404 (invalid code), 409 (already a member)

---

### GET /group/:groupId 🔒
Get group details with members.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Me & Rohan",
    "inviteCode": "GRP-4821",
    "members": [
      { "id": "uuid", "name": "Anurag", "upiId": "anurag@okaxis" },
      { "id": "uuid", "name": "Rohan", "upiId": "rohan@ybl" }
    ]
  }
}
```

---

### GET /group/:groupId/balance 🔒
Get net balance between users in this group.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "totalGroupSpend": 2400,
    "yourShare": 1200,
    "theirShare": 1200,
    "netBalance": {
      "direction": "THEY_OWE_YOU",
      "amount": 20,
      "person": { "id": "uuid", "name": "Rohan" }
    }
  }
}
```
`direction` can be: `"THEY_OWE_YOU"` | `"YOU_OWE_THEM"` | `"SETTLED"`

---

### POST /group/:groupId/remind 🔒
Send a push notification reminder to the person who owes.

**Request Body:**
```json
{ "targetUserId": "uuid" }
```
**Response 200:** `{ "success": true, "message": "Reminder sent" }`
**Errors:** 429 (reminded within last 24 hours)

---

## EXPENSE ROUTES

### POST /expense 🔒
Add a new expense to a group. Auto-splits equally between 2 members.

**Request Body:**
```json
{
  "groupId": "uuid",
  "title": "Auto",
  "amount": 40,
  "description": "Went to market",
  "date": "2026-05-12T14:32:00.000Z"
}
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Auto",
    "amount": 40,
    "date": "2026-05-12T14:32:00.000Z",
    "addedBy": { "id": "uuid", "name": "Anurag" },
    "shares": [
      {
        "id": "uuid",
        "user": { "id": "uuid", "name": "Anurag" },
        "shareAmount": 20,
        "isPaid": true
      },
      {
        "id": "uuid",
        "user": { "id": "uuid", "name": "Rohan" },
        "shareAmount": 20,
        "isPaid": false
      }
    ]
  }
}
```
**Side Effect:** Push notification sent to the OTHER group member.

---

### GET /group/:groupId/expenses 🔒
Get all expenses for a group, sorted by date descending.

**Query Params (optional):**
- `status=paid|unpaid` → filter by payment status
- `page=1&limit=20` → pagination

**Response 200:**
```json
{
  "success": true,
  "data": {
    "expenses": [
      {
        "id": "uuid",
        "title": "Auto",
        "amount": 40,
        "date": "2026-05-12T14:32:00.000Z",
        "addedBy": { "id": "uuid", "name": "Anurag" },
        "myShare": {
          "id": "uuid",
          "shareAmount": 20,
          "isPaid": false
        },
        "isSettled": false
      }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 45 }
  }
}
```

---

### GET /expense/:expenseId 🔒
Get full detail of a single expense.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "title": "Auto",
    "amount": 40,
    "description": "Went to market",
    "date": "2026-05-12T14:32:00.000Z",
    "addedBy": { "id": "uuid", "name": "Anurag" },
    "shares": [
      {
        "id": "uuid",
        "user": { "id": "uuid", "name": "Anurag" },
        "shareAmount": 20,
        "isPaid": true,
        "paidAt": "2026-05-12T14:32:00.000Z",
        "payment": null
      },
      {
        "id": "uuid",
        "user": { "id": "uuid", "name": "Rohan" },
        "shareAmount": 20,
        "isPaid": false,
        "paidAt": null,
        "payment": {
          "id": "uuid",
          "status": "INITIATED",
          "upiApp": "gpay"
        }
      }
    ]
  }
}
```

---

### DELETE /expense/:expenseId 🔒
Delete an expense (only by the person who added it, only if no share is paid yet).

**Response 200:** `{ "success": true, "message": "Expense deleted" }`
**Errors:** 403 (not added by you), 409 (payment already made)

---

## PAYMENT ROUTES

### POST /payment/initiate 🔒
Initiate a payment for an expense share. Creates a Payment record and returns UPI details.

**Request Body:**
```json
{ "shareId": "uuid" }
```
**Response 201:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "shareAmount": 20,
    "payee": {
      "name": "Anurag",
      "upiId": "anurag@okaxis"
    },
    "upiLinks": {
      "generic": "upi://pay?pa=anurag@okaxis&pn=Anurag&am=20.00&cu=INR&tn=Auto%20-%20SplitEasy&tr=splitEasy_uuid",
      "gpay": "intent://pay?pa=anurag%40okaxis&pn=Anurag&am=20.00&cu=INR&tn=Auto%20-%20SplitEasy&tr=splitEasy_uuid#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end",
      "paytm": "intent://pay?pa=anurag%40okaxis&pn=Anurag&am=20.00&cu=INR&tn=Auto%20-%20SplitEasy&tr=splitEasy_uuid#Intent;scheme=paytm;package=net.one97.paytm;end",
      "phonepe": "intent://pay?pa=anurag%40okaxis&pn=Anurag&am=20.00&cu=INR&tn=Auto%20-%20SplitEasy&tr=splitEasy_uuid#Intent;scheme=upi;package=com.phonepe.app;end",
      "bhim": "intent://pay?pa=anurag%40okaxis&pn=Anurag&am=20.00&cu=INR&tn=Auto%20-%20SplitEasy&tr=splitEasy_uuid#Intent;scheme=upi;package=in.org.npci.upiapp;end"
    },
    "transactionRef": "splitEasy_uuid"
  }
}
```
**Errors:** 409 (already paid), 404 (share not found)

---

### PATCH /payment/:paymentId/app 🔒
Record which UPI app the user selected (for analytics/debugging).

**Request Body:**
```json
{ "upiApp": "gpay" }
```
**Response 200:** `{ "success": true }`

---

### PATCH /payment/:paymentId/confirm 🔒
Confirm payment after returning from UPI app. Marks share as paid.

**Request Body:**
```json
{ "status": "CONFIRMED" }
```
**Response 200:**
```json
{
  "success": true,
  "data": {
    "paymentId": "uuid",
    "status": "CONFIRMED",
    "paidAt": "2026-05-12T14:45:00.000Z",
    "shareId": "uuid"
  }
}
```
**Side Effect:** 
- ExpenseShare.isPaid = true
- Push notification sent to payee: "Rohan paid ₹20 for Auto ✅"
**Errors:** 409 (already confirmed)

---

### PATCH /payment/:paymentId/fail 🔒
Mark payment as failed (user tapped "No" in confirmation dialog).

**Request Body:**
```json
{ "status": "FAILED" }
```
**Response 200:** `{ "success": true }` — Share stays unpaid, user can retry.

---

### GET /payment/:paymentId 🔒
Get payment status (for polling if needed).

**Response 200:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CONFIRMED",
    "upiApp": "gpay",
    "amount": 20,
    "initiatedAt": "2026-05-12T14:43:00.000Z",
    "confirmedAt": "2026-05-12T14:45:00.000Z"
  }
}
```

---

## ERROR RESPONSE FORMAT

All errors follow this structure:
```json
{
  "success": false,
  "message": "Human-readable error message",
  "code": "ERROR_CODE"
}
```

| HTTP Code | Meaning |
|---|---|
| 400 | Bad request / validation error |
| 401 | Not authenticated |
| 403 | Forbidden (not your resource) |
| 404 | Resource not found |
| 409 | Conflict (duplicate, already paid, etc.) |
| 429 | Rate limited |
| 500 | Internal server error |

---

## API IMPLEMENTATION NOTES

### Expense split logic (server-side)
When `POST /expense` is called:
1. Fetch all group members (expect exactly 2 for MVP)
2. shareAmount = amount / 2 (rounded to 2 decimal places)
3. Create ExpenseShare for addedBy user with `isPaid: true` (they paid)
4. Create ExpenseShare for the other user with `isPaid: false`

### UPI link generation (upi.service.js)
```javascript
const generateUPILinks = ({ payeeUpiId, payeeName, amount, note, ref }) => {
  const params = new URLSearchParams({
    pa: payeeUpiId,
    pn: payeeName,
    am: amount.toFixed(2),
    cu: "INR",
    tn: note,
    tr: ref
  }).toString();

  return {
    generic: `upi://pay?${params}`,
    gpay: `intent://pay?${params}#Intent;scheme=upi;package=com.google.android.apps.nbu.paisa.user;end`,
    paytm: `intent://pay?${params}#Intent;scheme=paytm;package=net.one97.paytm;end`,
    phonepe: `intent://pay?${params}#Intent;scheme=upi;package=com.phonepe.app;end`,
    bhim: `intent://pay?${params}#Intent;scheme=upi;package=in.org.npci.upiapp;end`
  };
};
```

### Push notification (notification.service.js)
```javascript
const sendPushNotification = async (expoPushToken, title, body, data = {}) => {
  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to: expoPushToken,
      title,
      body,
      data,
      sound: "default"
    })
  });
};
```

### Balance calculation (group.controller.js)
```javascript
// Sum all unpaid shares where the current user is the debtor
const youOweShares = await prisma.expenseShare.findMany({
  where: {
    userId: currentUserId,
    isPaid: false,
    expense: { groupId }
  }
});
const youOweTotal = youOweShares.reduce((sum, s) => sum + s.shareAmount, 0);

// Sum all unpaid shares where the other user is the debtor
const theyOweShares = await prisma.expenseShare.findMany({
  where: {
    userId: otherUserId,
    isPaid: false,
    expense: { groupId }
  }
});
const theyOweTotal = theyOweShares.reduce((sum, s) => sum + s.shareAmount, 0);

const net = theyOweTotal - youOweTotal;
// net > 0 → they owe you | net < 0 → you owe them | net = 0 → settled
```
