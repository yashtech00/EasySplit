# SplitEasy Backend API

A Node.js/Express backend for expense splitting application with UPI payment integration.

## 🚀 Features

- **OTP-based Authentication** - Secure mobile number verification
- **Group Management** - Create and join expense groups (2 members)
- **Expense Tracking** - Add, update, and delete shared expenses
- **UPI Integration** - Generate deep links for popular UPI apps
- **Payment Processing** - Track payment status and history
- **Real-time Balances** - Calculate who owes whom
- **Push Notifications** - Expo push notifications for mobile app
- **Rate Limiting** - Protect against abuse
- **JWT Authentication** - Secure API access

## 📋 Prerequisites

- Node.js v18+ 
- PostgreSQL database
- npm or yarn

## 🛠️ Installation

1. **Clone and navigate to backend**
```bash
cd backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Setup environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Setup database**
```bash
# Run migrations
npm run db:migrate

# Generate Prisma client
npm run db:generate

# (Optional) Open Prisma Studio
npm run db:studio
```

5. **Start development server**
```bash
npm run dev
```

Server will start on `http://localhost:8000`

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   │   ├── database.js  # Prisma client setup
│   │   └── env.js       # Environment variables
│   ├── controllers/     # Request handlers
│   │   ├── auth.controller.js
│   │   ├── user.controller.js
│   │   ├── group.controller.js
│   │   ├── expense.controller.js
│   │   └── payment.controller.js
│   ├── middleware/      # Express middleware
│   │   ├── auth.js      # JWT authentication
│   │   └── errorHandler.js
│   ├── routes/          # API routes
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── group.routes.js
│   │   ├── expense.routes.js
│   │   └── payment.routes.js
│   ├── services/        # Business logic
│   │   ├── otp.service.js
│   │   ├── upi.service.js
│   │   └── notification.service.js
│   ├── utils/           # Utility functions
│   │   ├── jwt.js       # JWT helpers
│   │   └── response.js  # Response formatters
│   └── index.js         # App entry point
├── prisma/
│   └── schema.prisma    # Database schema
├── .env.example         # Environment template
├── package.json
├── SplitEasy_API.postman_collection.json  # Postman collection
├── POSTMAN_GUIDE.md     # Detailed testing guide
├── API_QUICK_REFERENCE.md  # Quick API reference
└── README.md            # This file
```

## 🔧 Environment Variables

Create a `.env` file with the following:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/spliteasy"

# JWT Secrets
JWT_SECRET="your-super-secret-jwt-key-change-this"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-change-this"

# Server
PORT=8000
NODE_ENV=development

# MSG91 (for OTP in production)
MSG91_AUTH_KEY="your-msg91-auth-key"
MSG91_TEMPLATE_ID="your-msg91-template-id"
```

## 📚 API Documentation

### Quick Links
- **Postman Collection**: `SplitEasy_API.postman_collection.json`
- **Testing Guide**: `POSTMAN_GUIDE.md`
- **API Reference**: `API_QUICK_REFERENCE.md`

### Base URL
```
Development: http://localhost:8000
```

### API Endpoints

#### Authentication
- `POST /api/v1/auth/send-otp` - Send OTP
- `POST /api/v1/auth/verify-otp` - Verify OTP & Login
- `POST /api/v1/auth/complete-profile` - Complete profile
- `POST /api/v1/auth/refresh` - Refresh token
- `POST /api/v1/auth/logout` - Logout
- `POST /api/v1/auth/logout-all` - Logout all devices

#### User
- `GET /api/v1/user/me` - Get profile
- `PATCH /api/v1/user/profile` - Update profile
- `PATCH /api/v1/user/push-token` - Update push token
- `GET /api/v1/user/stats` - Get statistics
- `DELETE /api/v1/user/account` - Delete account

#### Groups
- `POST /api/v1/group` - Create group
- `POST /api/v1/group/join` - Join group
- `GET /api/v1/group/:id` - Get group details
- `GET /api/v1/group/:id/balance` - Get balance
- `POST /api/v1/group/:id/remind` - Send reminder

#### Expenses
- `POST /api/v1/expense` - Add expense
- `GET /api/v1/expense/group/:id` - Get group expenses
- `GET /api/v1/expense/:id` - Get expense details
- `PATCH /api/v1/expense/:id` - Update expense
- `DELETE /api/v1/expense/:id` - Delete expense

#### Payments
- `POST /api/v1/payment/initiate` - Initiate payment
- `PATCH /api/v1/payment/:id/app` - Record UPI app
- `PATCH /api/v1/payment/:id/confirm` - Confirm payment
- `GET /api/v1/payment/:id` - Get payment details
- `GET /api/v1/payment/history/me` - Get history

## 🧪 Testing with Postman

1. **Import Collection**
   - Open Postman
   - Import `SplitEasy_API.postman_collection.json`

2. **Set Base URL**
   - Collection variable `base_url` = `http://localhost:8000`

3. **Test Flow**
   ```
   1. Send OTP (mobile: 9876543210)
   2. Verify OTP (otp: 123456 in dev)
   3. Complete Profile
   4. Create Group
   5. Add Expense
   6. Initiate Payment
   ```

4. **Detailed Guide**
   - See `POSTMAN_GUIDE.md` for complete testing instructions

## 🔐 Authentication

The API uses JWT-based authentication:

1. **Login** - Get access token via OTP verification
2. **Access Token** - Valid for 15 minutes
3. **Refresh Token** - Valid for 30 days
4. **Authorization Header** - `Bearer <access_token>`

## 💾 Database Schema

Key models:
- **User** - User accounts with mobile, name, UPI ID
- **Group** - Expense groups with invite codes
- **GroupMember** - Group membership
- **Expense** - Shared expenses
- **ExpenseShare** - Individual shares of expenses
- **Payment** - Payment records with UPI details
- **RefreshToken** - JWT refresh tokens
- **OtpRecord** - OTP verification records
- **Reminder** - Payment reminder tracking

See `prisma/schema.prisma` for complete schema.

## 🚦 Available Scripts

```bash
# Development
npm run dev          # Start with nodemon (auto-reload)
npm start            # Start production server

# Database
npm run db:migrate   # Run Prisma migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio GUI

# Testing
npm test             # Run tests (not implemented yet)
```

## 🔒 Security Features

- **JWT Authentication** - Secure token-based auth
- **Rate Limiting** - Prevent OTP spam (5 per 15 min)
- **Input Validation** - Validate all user inputs
- **SQL Injection Protection** - Prisma ORM
- **CORS** - Configurable cross-origin requests
- **Environment Variables** - Sensitive data protection

## 🐛 Development Notes

### OTP in Development
- Default OTP: `123456`
- No SMS sent in development mode
- Check console logs for OTP

### Database Reset
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Re-run migrations
npm run db:migrate
```

### Common Issues

**Port already in use:**
```bash
lsof -ti:8000 | xargs kill -9
```

**Database connection error:**
- Check DATABASE_URL in .env
- Ensure PostgreSQL is running
- Verify database exists

**Module not found:**
```bash
npm install
npm run db:generate
```

## 📊 Response Format

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

## 🌐 Production Deployment

1. **Environment Setup**
   - Set `NODE_ENV=production`
   - Use strong JWT secrets
   - Configure MSG91 for OTP
   - Setup PostgreSQL database
   - Enable HTTPS

2. **Database Migration**
   ```bash
   npm run db:migrate
   ```

3. **Start Server**
   ```bash
   npm start
   ```

4. **Monitoring**
   - Setup error logging
   - Monitor API performance
   - Track database queries
   - Setup alerts

## 🤝 Contributing

1. Follow ES6 module syntax (import/export)
2. Use async/await for async operations
3. Add proper error handling
4. Update Postman collection for new endpoints
5. Document new features

## 📝 Code Style

- **ES6 Modules** - Use import/export
- **Async/Await** - For async operations
- **Arrow Functions** - Preferred for callbacks
- **Destructuring** - Use object/array destructuring
- **Template Literals** - For string interpolation
- **Error Handling** - Use try/catch with asyncHandler

## 🔄 API Versioning

Current version: **v1**

Base path: `/api/v1`

Future versions will use `/api/v2`, etc.

## 📞 Support

For issues or questions:
- Check `POSTMAN_GUIDE.md` for testing help
- Review `API_QUICK_REFERENCE.md` for endpoint details
- Check server logs for errors
- Verify environment variables

## 📄 License

ISC

## 👥 Authors

SplitEasy Development Team

---

**Ready to test?** Import the Postman collection and follow the guide! 🚀
