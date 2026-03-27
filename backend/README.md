# Insurify Broker Systems - Backend API

Backend API for the Insurify Broker Systems insurance management platform.

## Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Multi-role System**: Support for Super Admin, Marketer, Sales Agent, and Accountant roles
- **Database**: PostgreSQL with comprehensive data models
- **API Routes**: Complete RESTful API for all modules
- **AI Integration**: Google Gemini AI for intelligent assistance
- **SMS Integration**: Twilio integration for SMS notifications
- **Security**: Rate limiting, CORS, and security headers

## Tech Stack

- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Google Generative AI** - AI integration
- **Twilio** - SMS service
- **Express Validator** - Input validation

## Installation

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Database Setup:**
   - Ensure PostgreSQL is running
   - Create database named `insurance`
   - Update database credentials in `.env`

4. **Initialize database:**
   ```bash
   npm run seed
   ```

## Database Schema

The application uses the following tables:

- **users** - User accounts with role-based permissions
- **clients** - Client information and details
- **policies** - Insurance policy management
- **leads** - Marketing lead tracking
- **accounts** - Financial transactions and accounting
- **sms_logs** - SMS communication history

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Dashboard
- `GET /api/dashboard/stats` - Role-specific statistics
- `GET /api/dashboard/activities` - Recent activities
- `GET /api/dashboard/expiring` - Expiring policies
- `GET /api/dashboard/policy-distribution` - Policy type distribution
- `GET /api/dashboard/revenue-data` - Revenue analytics

### Policies
- `GET /api/policies` - Get all policies
- `GET /api/policies/:id` - Get policy by ID
- `POST /api/policies` - Create new policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy
- `GET /api/policies/search/:term` - Search policies
- `GET /api/policies/agent/:agentId` - Get agent policies
- `GET /api/policies/client/:clientId` - Get client policies
- `GET /api/policies/expiring/:days` - Get expiring policies
- `GET /api/policies/stats` - Policy statistics

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/:id` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client
- `GET /api/clients/search/:term` - Search clients
- `GET /api/clients/agent/:agentId` - Get agent clients

### Leads
- `GET /api/leads` - Get all leads
- `GET /api/leads/:id` - Get lead by ID
- `POST /api/leads` - Create new lead
- `PUT /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Delete lead
- `PATCH /api/leads/:id/status` - Update lead status
- `GET /api/leads/stats` - Lead statistics

### Accounts
- `GET /api/accounts` - Get all accounts
- `GET /api/accounts/:id` - Get account by ID
- `POST /api/accounts` - Create new account entry
- `PUT /api/accounts/:id` - Update account entry
- `DELETE /api/accounts/:id` - Delete account entry
- `GET /api/accounts/stats` - Account statistics
- `GET /api/accounts/stats/monthly/:month/:year` - Monthly statistics

### SMS
- `GET /api/sms` - Get all SMS logs
- `GET /api/sms/:id` - Get SMS log by ID
- `POST /api/sms/send` - Send SMS
- `PATCH /api/sms/:id/status` - Update SMS status
- `GET /api/sms/stats` - SMS statistics

### AI Assistant
- `POST /api/ai/chat` - AI chat for dashboard queries
- `GET /api/ai/insights` - AI insights for dashboard
- `GET /api/ai/policy-recommendations` - Policy recommendations

## Usage

### Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Seed Database
```bash
npm run seed
```

## Default Users

After seeding, the following test users are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@insurify.com | admin123 |
| Marketer | sarah@insurify.com | marketer123 |
| Sales Agent | mike@insurify.com | agent123 |
| Accountant | lisa@insurify.com | accountant123 |

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permissions for each role
- **Input Validation**: Comprehensive input validation
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Security Headers**: Helmet.js for security headers

## Environment Variables

Required:
- `DB_HOST` - Database host
- `DB_PORT` - Database port
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password
- `JWT_SECRET` - JWT secret key
- `JWT_EXPIRES_IN` - JWT expiration time

Optional:
- `GEMINI_API_KEY` - Google Gemini AI API key
- `TWILIO_ACCOUNT_SID` - Twilio account SID
- `TWILIO_AUTH_TOKEN` - Twilio auth token
- `TWILIO_PHONE_NUMBER` - Twilio phone number
- `EMAIL_HOST` - SMTP host
- `EMAIL_PORT` - SMTP port
- `EMAIL_USER` - SMTP username
- `EMAIL_PASS` - SMTP password

## API Documentation

The API follows RESTful conventions with proper HTTP status codes and JSON responses. All endpoints except authentication require a valid JWT token in the `Authorization` header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API provides consistent error responses:

```json
{
  "error": "Error message",
  "message": "Detailed error description"
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.