# SplitEasy API - Postman Collection Guide

## 📦 Import the Collection

1. Open Postman
2. Click **Import** button
3. Select the `SplitEasy_API.postman_collection.json` file
4. The collection will be imported with all endpoints and examples

## 🔧 Setup Environment Variables

The collection uses environment variables for easy testing. You can either:

### Option 1: Use Collection Variables (Recommended)
The collection already has variables defined. They will be auto-populated as you test:
- `base_url` - API base URL (default: http://localhost:8000)
- `access_token` - JWT access token (auto-set after login)
- `refresh_token` - JWT refresh token (auto-set after login)
- `user_id` - Current user ID (auto-set after login)
- `group_id` - Test group ID (auto-set after creating group)
- `expense_id` - Test expense ID (auto-set after adding expense)
- `share_id` - Test share ID (auto-set after adding expense)
- `payment_id` - Test payment ID (auto-set after initiating payment)

### Option 2: Create a Postman Environment
1. Click **Environments** in Postman
2. Create new environment named "SplitEasy Dev"
3. Add the same variables as above
4. Set `base_url` to `http://localhost:8000`
5. Select this environment before testing

## 🚀 Quick Start Testing Flow

### 1. Authentication Flow
```
1. Send OTP → POST /api/v1/auth/send-otp
   - Use mobile: "9876543210"
   - In development, OTP is "123456"

2. Verify OTP → POST /api/v1/auth/verify-otp
   - Tokens are automatically saved to environment
   - Check if isNewUser is true

3. Complete Profile → POST /api/v1/auth/complete-profile
   - Required for new users
   - Set name and UPI ID
```

### 2. Group Management Flow
```
1. Create Group → POST /api/v1/group
   - Group ID and invite code auto-saved

2. Join Group (use different user) → POST /api/v1/group/join
   - Use the invite code from step 1

3. Get Group Details → GET /api/v1/group/{{group_id}}

4. Get Group Balance → GET /api/v1/group/{{group_id}}/balance
```

### 3. Expense Management Flow
```
1. Add Expense → POST /api/v1/expense
   - Expense ID and share ID auto-saved
   - Amount is split equally

2. Get Group Expenses → GET /api/v1/expense/group/{{group_id}}
   - Filter by status: all, paid, unpaid

3. Get Expense Details → GET /api/v1/expense/{{expense_id}}

4. Update Expense → PATCH /api/v1/expense/{{expense_id}}
   - Only description and date can be updated

5. Delete Expense → DELETE /api/v1/expense/{{expense_id}}
   - Only if no payments from others
```

### 4. Payment Flow
```
1. Initiate Payment → POST /api/v1/payment/initiate
   - Returns UPI deep links
   - Payment ID auto-saved

2. Record UPI App → PATCH /api/v1/payment/{{payment_id}}/app
   - Track which app user selected

3. Confirm Payment → PATCH /api/v1/payment/{{payment_id}}/confirm
   - Status: CONFIRMED or FAILED

4. Get Payment Details → GET /api/v1/payment/{{payment_id}}

5. Get Payment History → GET /api/v1/payment/history/me
```

## 📝 Testing with Two Users

To fully test the app, you need two users:

### User 1 (Creator)
1. Login with mobile: `9876543210`
2. Complete profile: "Rahul Sharma", UPI: "rahul@paytm"
3. Create a group
4. Add an expense

### User 2 (Member)
1. Login with mobile: `9123456789`
2. Complete profile: "Priya Singh", UPI: "priya@phonepe"
3. Join the group using invite code
4. View expenses
5. Make payment for expense share

**Tip:** Use two separate Postman tabs or environments to manage both users simultaneously.

## 🔐 Authentication

Most endpoints require authentication. The collection automatically:
- Saves access token after login
- Includes it in Authorization header
- Updates it after token refresh

If you get 401 Unauthorized:
1. Check if access token is set in environment
2. Token expires in 15 minutes - use refresh token endpoint
3. Re-login if refresh token also expired

## 📊 Response Structure

All API responses follow this structure:

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error description",
  "code": "ERROR_CODE"
}
```

## 🎯 Common HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created successfully
- `400 Bad Request` - Validation error or bad input
- `401 Unauthorized` - Missing or invalid authentication
- `403 Forbidden` - Not authorized to access resource
- `404 Not Found` - Resource not found
- `409 Conflict` - Resource conflict (e.g., already exists)
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

## 🧪 Test Scenarios

### Scenario 1: Complete Trip Expense Split
```
1. User A creates group "Goa Trip"
2. User B joins using invite code
3. User A adds expense "Hotel" ₹3500
4. User A adds expense "Food" ₹1200
5. User B views expenses (owes ₹2350)
6. User B pays ₹2350 via UPI
7. Check group balance (should be settled)
```

### Scenario 2: Multiple Expenses with Partial Payments
```
1. Create group with 2 members
2. Add 5 different expenses
3. Pay for 2 expenses
4. Check balance (should show remaining amount)
5. Send payment reminder
6. Complete remaining payments
```

### Scenario 3: Error Handling
```
1. Try to join full group (max 2 members)
2. Try to delete expense with payments
3. Try to pay already paid share
4. Try to access other user's payment
5. Try to update someone else's expense
```

## 🐛 Troubleshooting

### Port Already in Use
If you get connection errors:
```bash
# Check if server is running
lsof -ti:8000

# Kill process if needed
kill -9 $(lsof -ti:8000)

# Start server
npm run dev
```

### Database Connection Issues
```bash
# Check DATABASE_URL in .env
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate
```

### OTP Not Working
In development mode:
- Default OTP is `123456`
- Check console logs for OTP
- MSG91 integration requires API key in production

## 📚 Additional Resources

- **API Documentation**: Check `/api/v1` endpoint
- **Health Check**: Use `/health` endpoint to verify server status
- **Database Schema**: See `backend/prisma/schema.prisma`
- **Environment Setup**: Check `backend/.env.example`

## 💡 Tips

1. **Use Test Scripts**: The collection includes test scripts that auto-save IDs
2. **Check Console**: Postman console shows detailed request/response logs
3. **Save Responses**: Use "Save Response" to create more examples
4. **Organize Tests**: Create folders for different test scenarios
5. **Share Collection**: Export and share with team members

## 🔄 Workflow Automation

The collection includes pre-request and test scripts:

### Auto-Save Tokens
```javascript
// After login, tokens are automatically saved
if (pm.response.code === 200) {
    var jsonData = pm.response.json();
    pm.environment.set("access_token", jsonData.data.accessToken);
    pm.environment.set("refresh_token", jsonData.data.refreshToken);
}
```

### Auto-Save IDs
```javascript
// After creating resources, IDs are saved
pm.environment.set("group_id", jsonData.data.id);
pm.environment.set("expense_id", jsonData.data.id);
```

## 📞 Support

For issues or questions:
- Check server logs: `npm run dev`
- Review API responses in Postman console
- Verify environment variables are set correctly
- Ensure database is running and migrated

---

**Happy Testing! 🚀**
