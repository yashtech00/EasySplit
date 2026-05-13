# SplitEasy API - Quick Reference

## 🔗 Base URL
```
Development: http://localhost:8000
Production: https://your-domain.com
```

## 📋 Endpoints Overview

### 🔐 Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/send-otp` | ❌ | Send OTP to mobile |
| POST | `/api/v1/auth/verify-otp` | ❌ | Verify OTP & login |
| POST | `/api/v1/auth/complete-profile` | ✅ | Complete user profile |
| POST | `/api/v1/auth/refresh` | ❌ | Refresh access token |
| POST | `/api/v1/auth/logout` | ✅ | Logout from device |
| POST | `/api/v1/auth/logout-all` | ✅ | Logout from all devices |

### 👤 User Profile
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/v1/user/me` | ✅ | Get current user profile |
| PATCH | `/api/v1/user/profile` | ✅ | Update profile |
| PATCH | `/api/v1/user/push-token` | ✅ | Update push token |
| GET | `/api/v1/user/stats` | ✅ | Get user statistics |
| DELETE | `/api/v1/user/account` | ✅ | Delete account |

### 👥 Groups
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/group` | ✅ | Create new group |
| POST | `/api/v1/group/join` | ✅ | Join group with code |
| GET | `/api/v1/group/:groupId` | ✅ | Get group details |
| GET | `/api/v1/group/:groupId/balance` | ✅ | Get group balance |
| POST | `/api/v1/group/:groupId/remind` | ✅ | Send payment reminder |

### 💰 Expenses
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/expense` | ✅ | Add new expense |
| GET | `/api/v1/expense/group/:groupId` | ✅ | Get group expenses |
| GET | `/api/v1/expense/:expenseId` | ✅ | Get expense details |
| PATCH | `/api/v1/expense/:expenseId` | ✅ | Update expense |
| DELETE | `/api/v1/expense/:expenseId` | ✅ | Delete expense |

### 💳 Payments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/v1/payment/initiate` | ✅ | Initiate payment |
| PATCH | `/api/v1/payment/:paymentId/app` | ✅ | Record UPI app |
| PATCH | `/api/v1/payment/:paymentId/confirm` | ✅ | Confirm payment |
| GET | `/api/v1/payment/:paymentId` | ✅ | Get payment details |
| GET | `/api/v1/payment/history/me` | ✅ | Get payment history |

### 🏥 System
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/health` | ❌ | Health check |
| GET | `/api/v1` | ❌ | API information |

## 🔑 Authentication Header
```
Authorization: Bearer <access_token>
```

## 📝 Request Examples

### Send OTP
```bash
curl -X POST http://localhost:8000/api/v1/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210"}'
```

### Verify OTP
```bash
curl -X POST http://localhost:8000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobile": "9876543210", "otp": "123456"}'
```

### Create Group
```bash
curl -X POST http://localhost:8000/api/v1/group \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Goa Trip 2024"}'
```

### Add Expense
```bash
curl -X POST http://localhost:8000/api/v1/expense \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "groupId": "GROUP_ID",
    "title": "Hotel Booking",
    "amount": 3500.00,
    "description": "3 nights stay",
    "date": "2024-01-25T00:00:00.000Z"
  }'
```

### Initiate Payment
```bash
curl -X POST http://localhost:8000/api/v1/payment/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"shareId": "SHARE_ID"}'
```

## 📊 Response Codes

| Code | Status | Description |
|------|--------|-------------|
| 200 | OK | Request successful |
| 201 | Created | Resource created |
| 400 | Bad Request | Invalid input |
| 401 | Unauthorized | Authentication required |
| 403 | Forbidden | Access denied |
| 404 | Not Found | Resource not found |
| 409 | Conflict | Resource conflict |
| 429 | Too Many Requests | Rate limited |
| 500 | Server Error | Internal error |

## 🎯 Common Workflows

### New User Registration
```
1. POST /auth/send-otp
2. POST /auth/verify-otp (get tokens)
3. POST /auth/complete-profile
4. GET /user/me
```

### Create & Join Group
```
1. POST /group (User A creates)
2. POST /group/join (User B joins with code)
3. GET /group/:id (both users)
```

### Add & Pay Expense
```
1. POST /expense (add expense)
2. GET /expense/group/:id (view expenses)
3. POST /payment/initiate (start payment)
4. PATCH /payment/:id/app (record app)
5. PATCH /payment/:id/confirm (confirm)
```

### Check Balances
```
1. GET /group/:id/balance (group balance)
2. GET /user/stats (overall stats)
3. GET /payment/history/me (payment history)
```

## 🔒 Security Notes

- Access tokens expire in **15 minutes**
- Refresh tokens expire in **30 days**
- OTP rate limit: **5 requests per 15 minutes**
- Payment reminders: **Once per 24 hours**
- Mobile format: **10 digits starting with 6-9**
- UPI ID format: **username@provider**

## 📱 UPI Apps Supported

- **Google Pay** (gpay)
- **PhonePe** (phonepe)
- **Paytm** (paytm)
- **BHIM** (bhim)

## 🧪 Test Data

### Development OTP
```
Default OTP: 123456
```

### Sample Mobile Numbers
```
User 1: 9876543210
User 2: 9123456789
User 3: 9988776655
```

### Sample UPI IDs
```
rahul@paytm
priya@phonepe
amit@gpay
sneha@bhim
```

## ⚡ Rate Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| Send OTP | 5 requests | 15 minutes |
| Payment Reminder | 1 request | 24 hours |

## 🐛 Error Codes

| Code | Description |
|------|-------------|
| VALIDATION_ERROR | Invalid input data |
| UNAUTHORIZED | Invalid or expired token |
| NOT_FOUND | Resource not found |
| FORBIDDEN | Access denied |
| CONFLICT | Resource already exists |
| RATE_LIMIT | Too many requests |
| INTERNAL_ERROR | Server error |

## 📦 Pagination

Endpoints with pagination support:
- `GET /expense/group/:groupId?page=1&limit=20`
- `GET /payment/history/me?page=1&limit=20`

Response includes:
```json
{
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

## 🔍 Query Parameters

### Get Group Expenses
```
?page=1          # Page number (default: 1)
?limit=20        # Items per page (default: 20)
?status=all      # Filter: all, paid, unpaid
```

### Get Payment History
```
?page=1          # Page number (default: 1)
?limit=20        # Items per page (default: 20)
```

## 💡 Best Practices

1. **Always check response status** before processing data
2. **Store tokens securely** (never in localStorage for web)
3. **Refresh tokens proactively** before expiry
4. **Handle rate limits gracefully** with retry logic
5. **Validate input** on client side before API calls
6. **Use HTTPS** in production
7. **Log errors** for debugging
8. **Implement timeout** for API calls

## 🚀 Quick Start Checklist

- [ ] Import Postman collection
- [ ] Set base_url in environment
- [ ] Start backend server (`npm run dev`)
- [ ] Test health endpoint
- [ ] Send OTP and verify
- [ ] Complete profile
- [ ] Create a group
- [ ] Add an expense
- [ ] Initiate payment

---

**Need detailed examples?** Check `POSTMAN_GUIDE.md`
