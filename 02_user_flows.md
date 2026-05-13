# SplitEasy – User Flows (In-Depth)

---

## Flow 1: Onboarding & Registration

### User A (first user to register)

```
Step 1: Opens app for the first time
        → Sees splash screen (logo + tagline)
        → Redirected to Register screen

Step 2: Register screen
        Fields:
          - Name (e.g. "Anurag")
          - Email (e.g. anurag@gmail.com)
          - Password (min 8 chars)
          - UPI ID (e.g. anurag@okaxis) ← critical for receiving payments

        Action: Tap "Register"
        → POST /auth/register
        → Server creates user, returns JWT
        → Tokens saved in AsyncStorage
        → Navigated to: Create/Join Group screen

Step 3: Create Group
        - Enter group name (e.g. "Me & Rohan")
        - Tap "Create Group"
        → POST /group
        → Server creates group, adds User A as member
        → Returns group invite code (e.g. "GRP-4821")
        → Screen shows invite code with "Share with friend" button
        → User A shares code via WhatsApp/message
```

---

### User B (friend joins)

```
Step 1: Opens app, taps "Join Group"
        - Enters invite code: GRP-4821
        - Enters own UPI ID (e.g. rohan@ybl)
        → POST /group/join { code, upiId }
        → Server adds User B to group
        → Both users now in same group
        → Redirected to Group Home screen
```

---

## Flow 2: Adding an Expense

### Scenario: User A pays ₹40 for an auto

```
Step 1: User A on Group Home screen
        - Sees list of existing expenses (empty initially)
        - Taps "+" (Add Expense) button (FAB, bottom right)

Step 2: Add Expense screen
        Fields:
          ┌─────────────────────────────┐
          │ Title:   [Auto            ] │  ← text input
          │ Amount:  [40              ] │  ← numeric input
          │ Description: [optional... ] │
          │ Date:    [12/05/2026 ✓   ] │  ← auto-filled today, editable
          │ Time:    [14:32 ✓        ] │  ← auto-filled now, editable
          └─────────────────────────────┘
          [  Add Expense  ]

Step 3: User A taps "Add Expense"
        → POST /expense
          body: {
            groupId: "...",
            title: "Auto",
            amount: 40,
            description: "",
            date: "2026-05-12T14:32:00.000Z"
          }
        → Server creates Expense record
        → Server creates 2 ExpenseShare records:
            - User A: shareAmount=20, isPaid=true  (they paid, so their share is settled)
            - User B: shareAmount=20, isPaid=false  (they owe)
        → Server sends push notification to User B:
            Title: "New Expense: Auto"
            Body: "Anurag added ₹40 for Auto. You owe ₹20."

Step 4: User A sees updated Group Home
        ┌────────────────────────────────────┐
        │ Auto                               │
        │ 12 May 2026, 2:32 PM              │
        │ Total: ₹40                         │
        │ [Rohan owes you ₹20]  ← green badge│
        └────────────────────────────────────┘
```

---

## Flow 3: Viewing Expenses (User B's Perspective)

### Scenario: User B opens app after receiving notification

```
Step 1: User B sees push notification
        "Anurag added ₹40 for Auto. You owe ₹20."
        → Taps notification → app opens

Step 2: Group Home screen loads
        → GET /group/:groupId/expenses
        ┌────────────────────────────────────┐
        │ Auto                               │
        │ 12 May 2026, 2:32 PM              │
        │ Total: ₹40                         │
        │ [You owe ₹20]  ← red/orange badge  │
        │         [ Pay Now ]                │
        └────────────────────────────────────┘

Step 3: User B taps expense card
        → Expense Detail screen
        ┌─────────────────────────────────────┐
        │ Auto                                │
        │ Added by: Anurag                    │
        │ Date: 12 May 2026 | Time: 2:32 PM  │
        │ Description: —                      │
        │ Total: ₹40                          │
        │                                     │
        │ Split equally:                      │
        │  Anurag .............. ₹20  ✅ Paid │
        │  You ................. ₹20  ❌ Owed │
        │                                     │
        │        [ Pay ₹20 ]                  │
        └─────────────────────────────────────┘
```

---

## Flow 4: Payment via UPI Deep Link (Core Flow)

### Scenario: User B taps "Pay ₹20"

```
Step 1: Taps "Pay ₹20" button
        → POST /payment/initiate
          body: { shareId: "...", upiApp: null }
        → Server creates Payment record (status: INITIATED)
        → Returns: { paymentId, payeeUpiId: "anurag@okaxis", amount: 20 }

Step 2: Payment Modal (bottom sheet popup) opens
        ┌─────────────────────────────────────┐
        │     Pay ₹20 to Anurag               │
        │     UPI ID: anurag@okaxis           │
        │                                     │
        │  Select payment app:                │
        │                                     │
        │  ┌──────┐ ┌──────┐ ┌──────┐        │
        │  │ 🟢   │ │  🔵  │ │  💜  │        │
        │  │GPay  │ │Paytm │ │PhonePe│       │
        │  └──────┘ └──────┘ └──────┘        │
        │                                     │
        │  ┌──────┐                           │
        │  │ BHIM │                           │
        │  └──────┘                           │
        │                                     │
        │  Note: Only installed apps shown     │
        │  (checked via Linking.canOpenURL)    │
        └─────────────────────────────────────┘

        Note: App checks which UPI apps are installed using
        Linking.canOpenURL() before rendering buttons

Step 3: User B taps "GPay"
        → App records selected app: PATCH /payment/:id { upiApp: "gpay" }
        → App constructs UPI URI:
            upi://pay?pa=anurag@okaxis&pn=Anurag&am=20.00&cu=INR
                  &tn=Auto%20-%20SplitEasy&tr=splitEasy_shareId_xxx
        → Linking.openURL(gpayIntentURL) called
        → Google Pay opens with pre-filled:
            → Recipient: Anurag
            → UPI: anurag@okaxis
            → Amount: ₹20
            → Note: Auto - SplitEasy

Step 4: User B pays in Google Pay
        → Sees "Payment Successful" in GPay

Step 5: GPay redirects back to SplitEasy
        (via deep link: spliteasy://payment-return?ref=splitEasy_shareId_xxx)
        → App catches deep link in Expo Linking handler

Step 6: Return handler fires
        → Extracts transaction ref from deep link URL
        → Shows confirmation dialog:
            ┌────────────────────────────────┐
            │  Did you complete the payment? │
            │                                │
            │  [ Yes, I Paid ]  [ No ]       │
            └────────────────────────────────┘

Step 7: User B taps "Yes, I Paid"
        → PATCH /payment/:paymentId/confirm
          body: { status: "CONFIRMED" }
        → Server:
            - Updates Payment.status = CONFIRMED
            - Updates ExpenseShare.isPaid = true
            - Sets ExpenseShare.paidAt = now()
            - Sends push to User A: "Rohan paid ₹20 for Auto ✅"

Step 8: UI updates
        ┌─────────────────────────────────────┐
        │ Auto                                │
        │ Added by: Anurag                    │
        │ Date: 12 May 2026 | Time: 2:32 PM  │
        │                                     │
        │ Split equally:                      │
        │  Anurag .............. ₹20  ✅ Paid │
        │  You ................. ₹20  ✅ Paid │  ← strikethrough + green
        │                                     │
        │    ✅ All settled!                  │
        └─────────────────────────────────────┘
```

---

## Flow 5: User A Sees Payment Confirmed

```
Step 1: Push notification arrives on User A's device
        "Rohan paid ₹20 for Auto ✅"

Step 2: User A opens app
        Group Home updates:
        ┌────────────────────────────────────┐
        │ Auto                               │
        │ 12 May 2026, 2:32 PM              │
        │ Total: ₹40                         │
        │ [All settled ✅]   ← green badge   │
        └────────────────────────────────────┘

Step 3: User A taps expense → sees full detail
        Both shares show: ✅ Paid
        Payment row shows: "via GPay on 12 May 2026"
```

---

## Flow 6: Group Balance Summary Screen

```
Screen: Group Home → top banner / "Summary" tab

┌──────────────────────────────────────┐
│         Group: Me & Rohan            │
│                                      │
│  Overall Balance                     │
│  ─────────────────                   │
│  Rohan owes you:  ₹20  [Remind]      │
│  (or)                                │
│  You owe Rohan:   ₹0   ✅ Settled    │
│                                      │
│  ─────────────────                   │
│  Total group spend: ₹2,400           │
│  Your share:        ₹1,200           │
│  Their share:       ₹1,200           │
└──────────────────────────────────────┘
```

GET /group/:groupId/balance → computed from all unpaid ExpenseShares

---

## Flow 7: Remind to Pay (Optional Feature)

```
User A on Group Home, sees "Rohan owes you ₹20"
Taps [Remind] button

→ POST /group/:groupId/remind { targetUserId }
→ Server sends push to Rohan:
    "Friendly reminder: You owe Anurag ₹20 for Auto 👋"

User A sees: "Reminder sent ✅"
Remind button disabled for 24 hours (cooldown)
```

---

## Flow 8: Profile & UPI Settings

```
Profile screen:
  - Name (editable)
  - Email (display only)
  - UPI ID (editable) ← important to keep updated
  - Change password

User updates UPI ID
→ PATCH /user/profile { upiId: "anurag@ibl" }
→ All future payments go to new UPI ID
```

---

## Edge Cases Handled

| Situation | Behavior |
|---|---|
| Payment app not installed | Button not shown (filtered by Linking.canOpenURL) |
| User taps "No" after returning from payment app | Share stays unpaid, can retry |
| Same share paid twice (accidental) | Server checks isPaid before confirming; returns 409 |
| User adds expense with 0 amount | Frontend validation blocks submission |
| Both users offline | Local optimistic UI + retry queue on reconnect (v2) |
| UPI deep link not caught | Manual "Mark as Paid" fallback option shown |
