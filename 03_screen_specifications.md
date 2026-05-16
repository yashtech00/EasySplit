# SplitEasy – Screen Specifications for Frontend Development

---

## Table of Contents
1. [Authentication Screens](#1-authentication-screens)
2. [Onboarding Screens](#2-onboarding-screens)
3. [Main Application Screens](#3-main-application-screens)
4. [Expense Management Screens](#4-expense-management-screens)
5. [Payment Screens](#5-payment-screens)
6. [Profile & Settings Screens](#6-profile--settings-screens)
7. [Modals & Overlays](#7-modals--overlays)
8. [Navigation Structure](#8-navigation-structure)

---

## 1. Authentication Screens

### 1.1 Splash Screen
**Route:** Initial screen (auto-redirects)  
**Purpose:** Brand introduction and app loading

**UI Elements:**
- SplitEasy logo (centered)
- Tagline: "Split bills, stay friends"
- Loading indicator (optional)
- Background gradient or brand color

**Behavior:**
- Displays for 2-3 seconds
- Checks AsyncStorage for JWT token
- If token exists & valid → Navigate to Home
- If no token → Navigate to Login/Register

**Technical Notes:**
- Use `expo-splash-screen` for native splash
- Check token validity with API health check or decode JWT expiry
- Handle deep links if app opened via notification

---

### 1.2 Login Screen
**Route:** `/login`  
**Purpose:** Existing user authentication

**UI Elements:**

```
┌─────────────────────────────────────┐
│                                     │
│          SplitEasy Logo             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Email                         │  │
│  │ [anurag@gmail.com          ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Password                      │  │
│  │ [••••••••••                ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Forgot Password? ]               │
│                                     │
│  ┌───────────────────────────────┐  │
│  │        LOGIN                  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Don't have an account?             │
│  [ Sign Up ]                        │
│                                     │
└─────────────────────────────────────┘
```

**Form Fields:**
- Email (type: email, required, validation: valid email format)
- Password (type: password, required, min 8 characters)

**Actions:**
- **Login Button:** 
  - Validates inputs
  - POST `/auth/login` with `{ email, password }`
  - On success: Save tokens to AsyncStorage, navigate to Home
  - On error: Show error toast (e.g., "Invalid credentials")
  
- **Sign Up Link:** Navigate to Register screen
- **Forgot Password:** (Optional MVP feature)

**Error Handling:**
- Show validation errors below fields
- Network errors: "Unable to connect. Please check your internet."
- 401 Unauthorized: "Invalid email or password"

---

### 1.3 Register Screen
**Route:** `/register`  
**Purpose:** New user registration and onboarding

**UI Elements:**

```
┌─────────────────────────────────────┐
│     Create Your Account             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Full Name                     │  │
│  │ [Anurag                    ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Email                         │  │
│  │ [anurag@gmail.com          ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Password                      │  │
│  │ [••••••••••                ]  │  │
│  └───────────────────────────────┘  │
│  Min 8 characters                   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ UPI ID (for receiving money)  │  │
│  │ [anurag@okaxis             ]  │  │
│  └───────────────────────────────┘  │
│  ℹ️ Example: yourname@paytm         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      CREATE ACCOUNT           │  │
│  └───────────────────────────────┘  │
│                                     │
│  Already have an account?           │
│  [ Login ]                          │
│                                     │
└─────────────────────────────────────┘
```

**Form Fields:**
- Name (type: text, required, min 2 characters)
- Email (type: email, required, unique validation)
- Password (type: password, required, min 8 chars, show strength indicator)
- UPI ID (type: text, required, format: xxx@xxx)

**Actions:**
- **Create Account Button:**
  - Validates all inputs
  - POST `/auth/register` with `{ name, email, password, upiId }`
  - On success: Save tokens, navigate to Create/Join Group screen
  - On error: Show specific error (e.g., "Email already registered")

- **Login Link:** Navigate to Login screen

**Validation:**
- UPI ID format: `username@bank` (regex: `/^[a-zA-Z0-9._-]+@[a-zA-Z]+$/`)
- Password: Show strength indicator (weak/medium/strong)
- Real-time email uniqueness check (debounced)

---

## 2. Onboarding Screens

### 2.1 Create or Join Group Screen
**Route:** `/onboarding/group-choice`  
**Purpose:** First-time user chooses to create a new group or join existing

**UI Elements:**

```
┌─────────────────────────────────────┐
│                                     │
│    Welcome to SplitEasy, Anurag!    │
│                                     │
│  Let's get you started 🚀           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │    👥 CREATE A GROUP          │  │
│  │                               │  │
│  │    Start fresh with a friend  │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │    🔗 JOIN A GROUP            │  │
│  │                               │  │
│  │    Have an invite code?       │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Actions:**
- **Create a Group:** Navigate to Create Group screen
- **Join a Group:** Navigate to Join Group screen

**Technical Notes:**
- This screen appears only after first registration
- If user already has a group, skip to Home screen
- Check group membership via GET `/user/groups`

---

### 2.2 Create Group Screen
**Route:** `/onboarding/create-group`  
**Purpose:** User creates a new 2-person group

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Back        Create Group         │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Group Name                    │  │
│  │ [Me & Rohan                ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Example: "Me & Sarah", "Roommates" │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      CREATE GROUP             │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Form Fields:**
- Group Name (type: text, required, max 50 characters)

**Actions:**
- **Create Group Button:**
  - POST `/group` with `{ name }`
  - On success: Navigate to Invite Code screen
  - Show loading indicator during API call

**Validation:**
- Name cannot be empty
- Trim whitespace

---

### 2.3 Group Invite Code Screen
**Route:** `/onboarding/invite-code`  
**Purpose:** Display generated invite code for friend to join

**UI Elements:**

```
┌─────────────────────────────────────┐
│         Group Created! ✅            │
│                                     │
│  Share this code with your friend:  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │       GRP-4821                │  │  ← Large, bold
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   📋 COPY CODE                │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   📤 SHARE VIA WHATSAPP       │  │
│  └───────────────────────────────┘  │
│                                     │
│  [ Skip to Home ]                   │
│                                     │
└─────────────────────────────────────┘
```

**Actions:**
- **Copy Code:** Copy invite code to clipboard, show "Copied!" toast
- **Share via WhatsApp:** 
  - Use `Linking.openURL()` with WhatsApp share link
  - Pre-filled message: "Join my SplitEasy group! Use code: GRP-4821"
- **Skip to Home:** Navigate to Group Home screen

**Technical Notes:**
- Code received from POST `/group` response
- WhatsApp link format: `whatsapp://send?text=Join%20my%20SplitEasy%20group...`

---

### 2.4 Join Group Screen
**Route:** `/onboarding/join-group`  
**Purpose:** User joins an existing group using invite code

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Back         Join Group          │
│                                     │
│  Enter the invite code you received │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Invite Code                   │  │
│  │ [GRP-4821                  ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Your UPI ID                   │  │
│  │ [rohan@ybl                 ]  │  │
│  └───────────────────────────────┘  │
│  (for receiving payments)           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │        JOIN GROUP             │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Form Fields:**
- Invite Code (type: text, required, format: GRP-XXXX)
- UPI ID (type: text, required, pre-filled if provided during registration)

**Actions:**
- **Join Group Button:**
  - POST `/group/join` with `{ code, upiId }`
  - On success: Navigate to Group Home screen
  - On error: "Invalid code" or "Group full"

**Validation:**
- Code format: uppercase, starts with "GRP-"
- Auto-format input to uppercase
- UPI ID validation (same as registration)

---

## 3. Main Application Screens

### 3.1 Group Home Screen (Expenses List)
**Route:** `/` (Home/Index)  
**Purpose:** Main screen showing all expenses in the group

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ☰  Me & Rohan              👤      │  ← Header
│                                     │
│  ┌───────────────────────────────┐  │
│  │  📊 Overall Balance           │  │  ← Summary Card
│  │                               │  │
│  │  Rohan owes you: ₹120         │  │
│  │                  [Remind]     │  │
│  │                               │  │
│  │  Total group spend: ₹2,400    │  │
│  └───────────────────────────────┘  │
│                                     │
│  Recent Expenses                    │  ← Section Header
│  ─────────────────                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🚕 Auto                       │  │  ← Expense Card
│  │ 12 May 2026, 2:32 PM         │  │
│  │ Total: ₹40                    │  │
│  │ [Rohan owes you ₹20]          │  │  ← Green badge
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🍕 Lunch                      │  │
│  │ 11 May 2026, 1:15 PM         │  │
│  │ Total: ₹600                   │  │
│  │ [All settled ✅]              │  │  ← Grey badge
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ 🎬 Movie Tickets              │  │
│  │ 10 May 2026                   │  │
│  │ Total: ₹500                   │  │
│  │ [You owe ₹250]                │  │  ← Red/Orange badge
│  │         [Pay Now]             │  │
│  └───────────────────────────────┘  │
│                                     │
│                    ┌──────┐         │
│                    │  +   │         │  ← FAB (Add Expense)
│                    └──────┘         │
└─────────────────────────────────────┘
```

**Components:**

1. **Header:**
   - Menu icon (opens drawer with Logout, Settings)
   - Group name (centered or left-aligned)
   - Profile icon (navigates to Profile screen)

2. **Balance Summary Card:**
   - Overall balance (who owes whom)
   - "Remind" button (if friend owes money)
   - Total group spending
   - Your share vs their share
   - Tappable to expand/collapse details

3. **Expense Cards:**
   - Title with emoji/icon
   - Date and time
   - Total amount
   - Status badge (colors based on payment status):
     - Green: "Friend owes you ₹X"
     - Red/Orange: "You owe ₹X" + [Pay Now] button
     - Grey: "All settled ✅"
   - Tap card to view details

4. **FAB (Floating Action Button):**
   - "+" icon
   - Navigates to Add Expense screen
   - Fixed position (bottom-right)

**Data Source:**
- GET `/group/:groupId/expenses` (returns all expenses)
- GET `/group/:groupId/balance` (returns summary)

**Behavior:**
- Pull-to-refresh to fetch latest expenses
- Empty state: "No expenses yet. Add your first expense!"
- Sort expenses by date (newest first)
- Show loading skeleton on initial load

**Navigation:**
- Tap expense card → Navigate to Expense Detail screen
- Tap "Pay Now" → Open Payment Modal
- Tap FAB → Navigate to Add Expense screen
- Tap Profile icon → Navigate to Profile screen

---

### 3.2 Group Balance Summary (Alternative View)
**Route:** Can be a tab or modal on Home screen  
**Purpose:** Detailed breakdown of group finances

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Back      Balance Summary        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │   💰 Overall Balance          │  │
│  │                               │  │
│  │   Rohan owes you:             │  │
│  │        ₹120                   │  │
│  │                               │  │
│  │   [Send Reminder]             │  │
│  └───────────────────────────────┘  │
│                                     │
│  Group Statistics                   │
│  ─────────────────                  │
│                                     │
│  Total expenses:        12          │
│  Total amount spent:    ₹2,400      │
│  Settled expenses:      8           │
│  Pending payments:      4           │
│                                     │
│  Your Share                         │
│  ─────────────────                  │
│  Total:                 ₹1,200      │
│  Paid:                  ₹1,080      │
│  Pending:               ₹120        │
│                                     │
│  Rohan's Share                      │
│  ─────────────────                  │
│  Total:                 ₹1,200      │
│  Paid:                  ₹1,200      │
│  Pending:               ₹0          │
│                                     │
└─────────────────────────────────────┘
```

**Data Source:**
- GET `/group/:groupId/balance` (computed from all expense shares)

**Actions:**
- **Send Reminder:** POST `/group/:groupId/remind`
  - Sends push notification to friend
  - Show "Reminder sent ✅" toast
  - Disable button for 24 hours (cooldown)

---

## 4. Expense Management Screens

### 4.1 Add Expense Screen
**Route:** `/expense/add`  
**Purpose:** Create a new expense

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Cancel      Add Expense    Save  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Title *                       │  │
│  │ [Auto                      ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Amount (₹) *                  │  │
│  │ [40                        ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Description (optional)        │  │
│  │ [From home to office       ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Date                          │  │
│  │ [12 May 2026            ] 📅  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Time                          │  │
│  │ [14:32                  ] 🕐  │  │
│  └───────────────────────────────┘  │
│                                     │
│  Split Details                      │
│  ─────────────────                  │
│  ✓ Equal split (₹20 each)           │
│                                     │
│  Your share:    ₹20  [✓ Paid]       │
│  Rohan's share: ₹20  [⏳ Pending]   │
│                                     │
│  ┌───────────────────────────────┐  │
│  │      ADD EXPENSE              │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Form Fields:**
- Title (required, max 100 characters)
- Amount (required, numeric, min ₹1)
- Description (optional, max 500 characters)
- Date (default: today, DatePicker)
- Time (default: now, TimePicker)

**Calculated Fields (Read-only):**
- Split amount per person (Amount ÷ 2)
- Your share status: Always "Paid" (you're adding it, so you paid)
- Friend's share status: "Pending"

**Actions:**
- **Save Button:**
  - Validates all required fields
  - POST `/expense` with expense data
  - On success: Navigate back to Home, show toast "Expense added ✅"
  - Sends push notification to friend
  
- **Cancel Button:** Navigate back without saving

**Validation:**
- Amount must be > 0
- Title cannot be empty
- Show inline error messages

**Technical Notes:**
- Use `@react-native-community/datetimepicker` for date/time
- Format currency with comma separators (₹1,000)
- Auto-focus on Title field when screen opens

---

### 4.2 Expense Detail Screen
**Route:** `/expense/[id]`  
**Purpose:** View full details of an expense and manage payment

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Back         Auto           ⋮    │  ← Menu (Edit/Delete)
│                                     │
│  Added by: Anurag                   │
│  12 May 2026 | 2:32 PM             │
│                                     │
│  ┌───────────────────────────────┐  │
│  │                               │  │
│  │     Total Amount              │  │
│  │        ₹40                    │  │
│  │                               │  │
│  └───────────────────────────────┘  │
│                                     │
│  Description                        │
│  From home to office                │
│                                     │
│  Split Details                      │
│  ─────────────────                  │
│                                     │
│  Anurag                             │
│  Share: ₹20                         │
│  Status: ✅ Paid                    │
│                                     │
│  ─────────────────                  │
│                                     │
│  You (Rohan)                        │
│  Share: ₹20                         │
│  Status: ⏳ Pending                 │
│                                     │
│  ┌───────────────────────────────┐  │
│  │       PAY ₹20                 │  │  ← Primary CTA
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Alternative State (When Paid):**

```
│  You (Rohan)                        │
│  Share: ₹20                         │
│  Status: ✅ Paid                    │
│  Paid on: 12 May 2026, 3:15 PM     │
│  via Google Pay                     │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    ✅ All Settled              │  │  ← Disabled button
│  └───────────────────────────────┘  │
```

**Alternative State (You Added, Friend Owes):**

```
│  You (Anurag)                       │
│  Share: ₹20                         │
│  Status: ✅ Paid                    │
│                                     │
│  ─────────────────                  │
│                                     │
│  Rohan                              │
│  Share: ₹20                         │
│  Status: ⏳ Pending                 │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    SEND REMINDER              │  │  ← Secondary CTA
│  └───────────────────────────────┘  │
```

**Actions:**
- **Pay Button:**
  - Opens Payment Modal (see Payment Modal section)
  - Only shown if current user owes money
  
- **Send Reminder:**
  - POST `/group/:groupId/remind`
  - Only shown if friend owes money
  - Disabled for 24 hours after sending
  
- **Menu (⋮):**
  - Edit Expense (navigate to Edit screen)
  - Delete Expense (with confirmation dialog)

**Data Source:**
- GET `/expense/:id`

**Behavior:**
- Poll/refresh status if payment is pending
- Show real-time updates via WebSocket (future enhancement)

---

### 4.3 Edit Expense Screen
**Route:** `/expense/[id]/edit`  
**Purpose:** Modify an existing expense (only if not fully paid)

**UI Elements:**
- Similar layout to Add Expense screen
- Pre-filled with existing data
- "Save Changes" button instead of "Add Expense"

**Restrictions:**
- Can only edit if NO payments have been made
- If expense has payments, show error: "Cannot edit expense with payments"

**Actions:**
- **Save Changes:** PATCH `/expense/:id`
- **Cancel:** Navigate back without saving

---

## 5. Payment Screens

### 5.1 Payment Modal (Bottom Sheet)
**Type:** Modal/Bottom Sheet  
**Triggered by:** Tapping "Pay Now" or "Pay ₹X" button  
**Purpose:** Select UPI app and initiate payment

**UI Elements:**

```
┌─────────────────────────────────────┐
│                                     │  ← Drag handle
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
│  ┌──────┐ ┌──────┐                 │
│  │  🟡  │ │Other │                 │
│  │ BHIM │ │ Apps │                 │
│  └──────┘ └──────┘                 │
│                                     │
│  ℹ️ Only installed apps shown       │
│                                     │
│  [ Cancel ]                         │
│                                     │
└─────────────────────────────────────┘
```

**Components:**

1. **App Buttons:**
   - Display only installed apps (check via `Linking.canOpenURL()`)
   - App logo/icon + name
   - Tap to select app

2. **Cancel Button:**
   - Dismiss modal without initiating payment

**Behavior:**

1. On modal open:
   - POST `/payment/initiate` to create Payment record
   - Get payee's UPI ID from response
   - Check installed apps:
     ```javascript
     const apps = ['gpay', 'paytm', 'phonepe', 'bhim'];
     const installed = await Promise.all(
       apps.map(async app => {
         const canOpen = await Linking.canOpenURL(UPI_APPS[app].scheme);
         return canOpen ? app : null;
       })
     );
     ```

2. User taps app button:
   - PATCH `/payment/:id` with `{ upiApp: "gpay" }`
   - Construct UPI deep link:
     ```javascript
     const upiLink = `upi://pay?pa=${payeeUpiId}&pn=${payeeName}&am=${amount}&cu=INR&tn=${note}&tr=${transactionRef}`;
     ```
   - Open app: `Linking.openURL(upiLink)`
   - App closes modal and shows "Redirecting to GPay..." toast

3. After payment in external app:
   - User returns to SplitEasy via deep link
   - Payment Confirmation Dialog opens

**Technical Notes:**
- Use `@gorhom/bottom-sheet` for smooth modal
- Handle Android Intent URLs vs iOS URL schemes
- Transaction reference format: `splitEasy_shareId_{shareId}`

---

### 5.2 Payment Confirmation Dialog
**Type:** Alert/Dialog  
**Triggered by:** App returning from UPI deep link  
**Purpose:** Confirm whether user completed payment

**UI Elements:**

```
┌─────────────────────────────────────┐
│                                     │
│   💳 Payment Completed?             │
│                                     │
│   Did you successfully complete     │
│   the payment in Google Pay?        │
│                                     │
│   ┌────────────┐  ┌──────────────┐ │
│   │  YES, PAID │  │  NO, RETRY   │ │
│   └────────────┘  └──────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Actions:**

1. **Yes, I Paid:**
   - PATCH `/payment/:paymentId/confirm` with `{ status: "CONFIRMED" }`
   - On success:
     - Update local state (mark share as paid)
     - Show success toast: "Payment confirmed ✅"
     - Close dialog and navigate back to Expense Detail
     - Send push notification to payee
   
2. **No, Retry:**
   - Close dialog
   - User can retry payment later
   - Payment record status remains "INITIATED"

**Error Handling:**
- If API call fails, show error and offer to retry
- If network is down, queue confirmation for later (use offline storage)

---

### 5.3 Payment Success State
**Location:** Expense Detail Screen (updated view)  
**Purpose:** Show confirmed payment status

**UI Elements:**

```
│  ✅ Payment Confirmed               │
│                                     │
│  You paid ₹20 to Anurag             │
│  via Google Pay                     │
│  on 12 May 2026, 3:15 PM           │
│                                     │
│  Transaction ref: splitEasy_xxx     │
```

**Note:** Transaction reference can be used for support/disputes

---

## 6. Profile & Settings Screens

### 6.1 Profile Screen
**Route:** `/profile`  
**Purpose:** View and edit user profile

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Back           Profile           │
│                                     │
│  ┌───────────────────────────────┐  │
│  │         👤                    │  │
│  │      Anurag                   │  │
│  │   anurag@gmail.com            │  │
│  └───────────────────────────────┘  │
│                                     │
│  Account Details                    │
│  ─────────────────                  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Name                          │  │
│  │ [Anurag                    ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Email (cannot change)         │  │
│  │ [anurag@gmail.com          ]  │  │ ← Disabled
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ UPI ID                        │  │
│  │ [anurag@okaxis             ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │     SAVE CHANGES              │  │
│  └───────────────────────────────┘  │
│                                     │
│  Security                           │
│  ─────────────────                  │
│  [ Change Password ]                │
│                                     │
│  Danger Zone                        │
│  ─────────────────                  │
│  [ Logout ]                         │
│  [ Delete Account ]                 │
│                                     │
└─────────────────────────────────────┘
```

**Form Fields:**
- Name (editable)
- Email (read-only)
- UPI ID (editable)

**Actions:**

1. **Save Changes:**
   - PATCH `/user/profile` with `{ name, upiId }`
   - Validate UPI ID format
   - Show success toast

2. **Change Password:**
   - Navigate to Change Password screen

3. **Logout:**
   - Show confirmation: "Are you sure?"
   - Clear AsyncStorage tokens
   - Navigate to Login screen

4. **Delete Account:**
   - Show warning dialog with consequences
   - Requires password confirmation
   - DELETE `/user/account`

---

### 6.2 Change Password Screen
**Route:** `/profile/change-password`  
**Purpose:** Update user password

**UI Elements:**

```
┌─────────────────────────────────────┐
│  ← Back      Change Password        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Current Password              │  │
│  │ [••••••••••                ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ New Password                  │  │
│  │ [••••••••••                ]  │  │
│  └───────────────────────────────┘  │
│  Min 8 characters                   │
│  ░░░░░░░░░░ Strength: Medium        │
│                                     │
│  ┌───────────────────────────────┐  │
│  │ Confirm New Password          │  │
│  │ [••••••••••                ]  │  │
│  └───────────────────────────────┘  │
│                                     │
│  ┌───────────────────────────────┐  │
│  │    UPDATE PASSWORD            │  │
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

**Actions:**
- **Update Password:**
  - PATCH `/user/password`
  - Validates current password
  - Checks new passwords match
  - On success: Navigate back to Profile, show toast

**Validation:**
- Current password must be correct (server validation)
- New password min 8 characters
- New and confirm must match
- Show password strength indicator

---

## 7. Modals & Overlays

### 7.1 Delete Expense Confirmation
**Type:** Alert Dialog  
**Triggered by:** Tapping "Delete" in expense menu

**UI:**
```
┌─────────────────────────────────────┐
│   ⚠️ Delete Expense?                │
│                                     │
│   This will permanently delete      │
│   "Auto" (₹40).                     │
│                                     │
│   This action cannot be undone.     │
│                                     │
│   ┌────────────┐  ┌──────────────┐ │
│   │   CANCEL   │  │    DELETE    │ │
│   └────────────┘  └──────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Actions:**
- **Cancel:** Close dialog
- **Delete:** 
  - DELETE `/expense/:id`
  - Navigate back to Home
  - Show toast: "Expense deleted"

---

### 7.2 Network Error Toast
**Type:** Toast/Snackbar  
**Triggered by:** API failure

**UI:**
```
┌─────────────────────────────────────┐
│  ⚠️ Unable to connect.              │
│  Please check your internet.        │
│                            [Retry]  │
└─────────────────────────────────────┘
```

**Behavior:**
- Auto-dismiss after 5 seconds
- "Retry" button re-attempts last action
- Use `react-native-toast-message`

---

### 7.3 Loading States

**Full Screen Loader:**
```
┌─────────────────────────────────────┐
│                                     │
│                                     │
│          ⏳ Loading...              │
│                                     │
│                                     │
└─────────────────────────────────────┘
```

**Skeleton Loaders:**
- Use on Home screen while expenses load
- Grey placeholder cards with shimmer effect
- Library: `react-native-skeleton-placeholder`

---

## 8. Navigation Structure

### 8.1 Navigation Stack

```
┌─────────────────────────────────────────┐
│         Auth Stack (Unauthorized)        │
├─────────────────────────────────────────┤
│  - Splash                               │
│  - Login                                │
│  - Register                             │
└─────────────────────────────────────────┘
                  │
                  ├─ Has valid token? ─┐
                  │                     │
                  No                   Yes
                  │                     │
                  │                     ▼
┌─────────────────▼────────────┐  ┌─────────────────────────────┐
│   Onboarding Stack           │  │      Main Stack             │
├──────────────────────────────┤  ├─────────────────────────────┤
│  - Create/Join Group Choice  │  │  - Home (Tab Navigator)     │
│  - Create Group              │  │    └─ Expenses List         │
│  - Invite Code               │  │    └─ Profile               │
│  - Join Group                │  │  - Add Expense              │
└──────────────────────────────┘  │  - Expense Detail           │
                                  │  - Edit Expense             │
                                  │  - Change Password          │
                                  └─────────────────────────────┘
```

### 8.2 Tab Navigator (Future Enhancement)

```
┌─────────────────────────────────────┐
│                                     │
│         Main Content                │
│                                     │
│                                     │
└─────────────────────────────────────┘
│  🏠 Home   │  👤 Profile   │  ⚙️ Settings  │
└──────────────────────────────────────────┘
```

**Current MVP:** Single screen app (Home), Profile accessed via icon

---

## 9. Design System & UI Guidelines

### 9.1 Color Palette

```javascript
const colors = {
  primary: '#6C63FF',        // Brand purple (buttons, links)
  secondary: '#FF6584',      // Accent pink
  success: '#4CAF50',        // Green (paid status)
  warning: '#FFC107',        // Yellow/Orange (pending)
  error: '#F44336',          // Red (errors, you owe)
  
  background: '#F5F7FA',     // Light grey background
  cardBg: '#FFFFFF',         // White cards
  text: {
    primary: '#1A1A1A',      // Dark grey (main text)
    secondary: '#6B7280',    // Medium grey (subtitles)
    disabled: '#D1D5DB',     // Light grey (disabled)
  },
  
  border: '#E5E7EB',         // Border color
}
```

### 9.2 Typography

```javascript
const typography = {
  h1: { fontSize: 28, fontWeight: '700' },  // Screen titles
  h2: { fontSize: 22, fontWeight: '600' },  // Card headers
  h3: { fontSize: 18, fontWeight: '600' },  // Section headers
  body: { fontSize: 16, fontWeight: '400' }, // Normal text
  caption: { fontSize: 14, fontWeight: '400' }, // Small text
  button: { fontSize: 16, fontWeight: '600' }, // Button text
}
```

### 9.3 Spacing

```javascript
const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
}
```

### 9.4 Component Guidelines

**Buttons:**
- Primary: Purple background, white text, 48px height
- Secondary: White background, purple border, purple text
- Disabled: Grey background, grey text, 50% opacity

**Cards:**
- White background
- Border radius: 12px
- Shadow: subtle elevation
- Padding: 16px

**Input Fields:**
- Border: 1px solid grey
- Border radius: 8px
- Height: 48px
- Focus: Blue border
- Error: Red border + error text below

**Badges:**
- Border radius: 16px
- Padding: 4px 12px
- Font size: 12px
- Colors based on status (green/red/grey)

---

## 10. Deep Link Configuration

### 10.1 Deep Link Scheme

**App Scheme:** `spliteasy://`

**Supported Deep Links:**

1. **Payment Return:**
   - URL: `spliteasy://payment-return?ref={transactionRef}&status={success|failed}`
   - Handled by: Payment confirmation flow

2. **Notification Deep Links:**
   - New expense: `spliteasy://expense/{expenseId}`
   - Payment received: `spliteasy://expense/{expenseId}`
   - Reminder: `spliteasy://expense/{expenseId}`

3. **Group Invite (Optional):**
   - URL: `spliteasy://join/{inviteCode}`
   - Auto-fills invite code on Join Group screen

**Configuration (app.json):**
```json
{
  "expo": {
    "scheme": "spliteasy",
    "ios": {
      "associatedDomains": ["applinks:spliteasy.app"]
    },
    "android": {
      "intentFilters": [
        {
          "action": "VIEW",
          "data": { "scheme": "spliteasy" }
        }
      ]
    }
  }
}
```

---

## 11. Push Notification Configuration

### 11.1 Notification Types

1. **New Expense Added:**
   - Title: "New Expense: {title}"
   - Body: "{friend} added ₹{amount} for {title}. You owe ₹{share}."
   - Data: `{ type: 'new_expense', expenseId }`

2. **Payment Received:**
   - Title: "Payment Received ✅"
   - Body: "{friend} paid ₹{amount} for {title}"
   - Data: `{ type: 'payment_received', expenseId }`

3. **Payment Reminder:**
   - Title: "Payment Reminder 👋"
   - Body: "You owe {friend} ₹{amount} for {title}"
   - Data: `{ type: 'reminder', expenseId }`

### 11.2 Handling Notifications

**When app is foreground:**
- Show in-app toast/banner
- Update data in background

**When app is background/closed:**
- Show system notification
- On tap: Open expense detail screen

**Code Example:**
```javascript
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// Listen for notification taps
Notifications.addNotificationResponseReceivedListener(response => {
  const { expenseId } = response.notification.request.content.data;
  navigation.navigate('ExpenseDetail', { id: expenseId });
});
```

---

## 12. Offline Handling (Future Enhancement)

### Current MVP Behavior:
- Show error toast when offline
- Disable actions requiring network
- Retry button on error states

### Future Enhancement:
- Cache expenses locally (AsyncStorage/SQLite)
- Queue actions (add expense, pay) for later
- Sync on reconnect
- Optimistic UI updates

---

## 13. Accessibility Requirements

### 13.1 General Guidelines

1. **Text Contrast:**
   - All text must meet WCAG AA standards (4.5:1 ratio)
   - Use dark text on light backgrounds

2. **Touch Targets:**
   - Minimum 44x44 points for all tappable elements
   - Adequate spacing between interactive elements

3. **Screen Reader Support:**
   - All images have `accessibilityLabel`
   - Form inputs have labels
   - Buttons have descriptive labels

4. **Font Scaling:**
   - Support dynamic type sizes
   - Test with largest accessibility font size

### 13.2 Component-Specific

**Expense Cards:**
```javascript
<TouchableOpacity
  accessible={true}
  accessibilityLabel={`Auto expense, total 40 rupees, Rohan owes you 20 rupees`}
  accessibilityRole="button"
>
```

**Payment Buttons:**
```javascript
<Button
  accessibilityLabel="Pay 20 rupees to Anurag"
  accessibilityHint="Opens payment app to complete transaction"
/>
```

---

## 14. Error States & Edge Cases

### 14.1 Empty States

**No Expenses Yet:**
```
┌─────────────────────────────────────┐
│                                     │
│          💸                         │
│                                     │
│    No expenses yet!                 │
│                                     │
│  Tap + to add your first expense    │
│                                     │
│                                     │
│                    ┌──────┐         │
│                    │  +   │         │
│                    └──────┘         │
└─────────────────────────────────────┘
```

**No Groups:**
```
│    You're not in a group yet!       │
│                                     │
│  [ Create Group ]  [ Join Group ]   │
```

### 14.2 Error States

**Payment Failed:**
```
│  ❌ Payment Failed                  │
│                                     │
│  Could not complete payment.        │
│  Please try again.                  │
│                                     │
│  [ Retry Payment ]                  │
```

**Expense Load Failed:**
```
│  ⚠️ Could not load expenses         │
│                                     │
│  [ Retry ]                          │
```

### 14.3 Edge Cases

1. **Duplicate Payment Prevention:**
   - Disable "Pay" button after clicking
   - Show loading state during payment initiation
   - Server validation: Check if share already paid

2. **Stale Data:**
   - Pull-to-refresh on all list screens
   - Auto-refresh on app foreground
   - Show timestamp: "Last updated: 2 mins ago"

3. **Network Timeout:**
   - 30-second timeout for API calls
   - Show retry option
   - Cache last successful response

4. **Invalid Deep Link:**
   - If payment return link is malformed, show error
   - Fallback to expense list

---

## 15. Performance Optimization

### 15.1 List Optimization

**Expense List:**
- Use `FlatList` with `keyExtractor`
- Implement `getItemLayout` for fixed height items
- Add `maxToRenderPerBatch={10}`
- Use `removeClippedSubviews={true}` on Android

### 15.2 Image Optimization

- Use optimized logo/icon assets
- Implement lazy loading for profile pictures (future)
- Cache images with `expo-image`

### 15.3 API Optimization

- Debounce search/filter inputs (500ms)
- Batch multiple API calls when possible
- Use pagination for large expense lists (load 20 at a time)

---

## 16. Testing Checklist for Frontend Developers

### 16.1 Unit Tests
- [ ] Form validation functions
- [ ] UPI link generation
- [ ] Date/time formatting
- [ ] Currency formatting
- [ ] Balance calculation logic

### 16.2 Integration Tests
- [ ] Login flow
- [ ] Add expense flow
- [ ] Payment flow (mock UPI apps)
- [ ] Notification handling

### 16.3 E2E Tests (Optional)
- [ ] Complete user journey: Register → Create Group → Add Expense → Pay
- [ ] Second user: Join Group → View Expense → Pay

### 16.4 Manual Testing Scenarios

1. **Happy Path:**
   - Create account → Create group → Share code → Add expense → Receive payment

2. **Error Scenarios:**
   - Login with wrong password
   - Add expense with ₹0 amount
   - Try to pay already paid expense
   - Network disconnection during payment

3. **Edge Cases:**
   - Very long expense titles (>100 chars)
   - Special characters in group name
   - Invalid UPI ID format
   - App kill during payment flow

---

## 17. Developer Setup Instructions

### 17.1 Prerequisites

```bash
# Install Node.js (v18+)
# Install Expo CLI
npm install -g expo-cli

# Clone repository
git clone <repo-url>
cd spliteasy-frontend

# Install dependencies
npm install
```

### 17.2 Environment Setup

Create `.env` file:
```env
API_BASE_URL=http://localhost:3000
# For production:
# API_BASE_URL=https://api.spliteasy.app
```

### 17.3 Run Development Server

```bash
# Start Expo dev server
npx expo start

# Run on iOS simulator
npx expo start --ios

# Run on Android emulator
npx expo start --android

# Run on physical device
# Scan QR code with Expo Go app
```

### 17.4 Key Dependencies

```json
{
  "dependencies": {
    "expo": "~50.0.0",
    "react-native": "0.73.0",
    "react-navigation": "^6.0.0",
    "@react-navigation/native-stack": "^6.0.0",
    "@react-navigation/bottom-tabs": "^6.0.0",
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "expo-notifications": "~0.27.0",
    "expo-linking": "~6.2.0",
    "react-native-toast-message": "^2.2.0",
    "@gorhom/bottom-sheet": "^4.6.0",
    "react-native-skeleton-placeholder": "^5.2.0",
    "@react-native-community/datetimepicker": "^7.6.0"
  }
}
```

---

## 18. API Integration Quick Reference

### 18.1 Base Configuration

```javascript
// services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: process.env.API_BASE_URL,
  timeout: 30000,
});

// Add auth token to all requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### 18.2 Common API Calls

```javascript
// Auth
await api.post('/auth/register', { name, email, password, upiId });
await api.post('/auth/login', { email, password });

// Groups
await api.post('/group', { name });
await api.post('/group/join', { code, upiId });
await api.get(`/group/${groupId}/expenses`);
await api.get(`/group/${groupId}/balance`);

// Expenses
await api.post('/expense', { groupId, title, amount, description, date });
await api.get(`/expense/${expenseId}`);
await api.delete(`/expense/${expenseId}`);

// Payments
await api.post('/payment/initiate', { shareId });
await api.patch(`/payment/${paymentId}/confirm`, { status: 'CONFIRMED' });

// User
await api.patch('/user/profile', { name, upiId });
```

---

## 19. Assets Required

### 19.1 Images/Icons

- [ ] App icon (1024x1024 PNG)
- [ ] Splash screen logo
- [ ] GPay logo (SVG/PNG)
- [ ] Paytm logo (SVG/PNG)
- [ ] PhonePe logo (SVG/PNG)
- [ ] BHIM logo (SVG/PNG)
- [ ] Empty state illustrations
- [ ] Error state illustration

### 19.2 Icon Font

Use **Expo Icons** (`@expo/vector-icons`):
- MaterialIcons
- Ionicons
- FontAwesome5

Common icons needed:
- `add` (FAB)
- `person` (profile)
- `menu` (hamburger)
- `check-circle` (paid status)
- `clock` (pending status)
- `share` (share invite)
- `copy` (copy code)

---

## 20. Launch Checklist

### Pre-Launch Tasks

- [ ] Test on iOS and Android devices
- [ ] Test with different screen sizes
- [ ] Test with different font sizes (accessibility)
- [ ] Test offline scenarios
- [ ] Test push notifications
- [ ] Test UPI deep links with real apps
- [ ] Verify all error states
- [ ] Check all loading states
- [ ] Verify form validations
- [ ] Test payment flow end-to-end
- [ ] Security audit (token storage, API security)
- [ ] Performance testing (no memory leaks)
- [ ] Prepare app store assets (screenshots, description)
- [ ] Set up crash reporting (Sentry)
- [ ] Set up analytics (optional)

---

## Contact & Support

For questions or clarifications:
- Backend API documentation: `/api/docs`
- Postman collection: `SplitEasy_API_postman_collection.json`
- System architecture: `01_system_architecture.md`
- User flows: `02_user_flows.md`

---

**Document Version:** 1.0  
**Last Updated:** May 14, 2026  
**Target Platform:** React Native (Expo)  
**Minimum Supported Versions:** iOS 13+, Android 8+
