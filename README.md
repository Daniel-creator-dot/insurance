# Insurify Broker Systems

A comprehensive insurance management platform built with React, TypeScript, and Node.js. This application provides a complete solution for insurance brokerages to manage policies, clients, leads, and financial operations.

## Features

### 🎯 **Multi-Role System**
- **Super Admin**: Full system oversight, analytics, and management
- **Marketer**: Marketing campaigns, lead generation, and client acquisition
- **Sales Agent**: Client management, policy sales, and commission tracking
- **Accountant**: Financial management, billing, and accounting operations

### 📊 **Core Modules**
- **Dashboard**: Role-specific analytics and insights
- **Policies**: Complete policy lifecycle management
- **Clients**: Comprehensive client relationship management
- **Leads**: Lead tracking and conversion pipeline
- **SMS Center**: Bulk SMS communication system
- **Accounts**: Financial tracking and reporting
- **Performance**: Analytics and business intelligence
- **Settings**: System configuration and user management

### 🤖 **AI Integration**
- **Intelligent Assistant**: Google Gemini AI for role-specific assistance
- **Smart Insights**: AI-powered analytics and recommendations
- **Automated Responses**: Context-aware help and guidance

### 🔒 **Security & Authentication**
- JWT-based authentication
- Role-based access control
- Secure API endpoints
- Input validation and sanitization

## Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Data visualization
- **Motion** - Smooth animations
- **Axios** - HTTP client for API calls

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Relational database
- **bcryptjs** - Password hashing
- **jsonwebtoken** - JWT authentication
- **Google Generative AI** - AI integration
- **Twilio** - SMS service integration

## Installation

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database configuration:**
   - Ensure PostgreSQL is running
   - Create database named `insurance`
   - Update database credentials in `.env`

5. **Initialize database:**
   ```bash
   npm run seed
   ```

6. **Start backend server:**
   ```bash
   npm run dev
   ```

### Frontend Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   Navigate to `http://localhost:3000`

## Database Schema

The application uses PostgreSQL with the following main tables:

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

### Dashboard
- `GET /api/dashboard/stats` - Role-specific statistics
- `GET /api/dashboard/activities` - Recent activities
- `GET /api/dashboard/expiring` - Expiring policies

### Policies
- `GET /api/policies` - Get all policies
- `POST /api/policies` - Create new policy
- `PUT /api/policies/:id` - Update policy
- `DELETE /api/policies/:id` - Delete policy

### Clients
- `GET /api/clients` - Get all clients
- `POST /api/clients` - Create new client
- `PUT /api/clients/:id` - Update client

### Leads
- `GET /api/leads` - Get all leads
- `POST /api/leads` - Create new lead
- `PATCH /api/leads/:id/status` - Update lead status

### Accounts
- `GET /api/accounts` - Get all accounts
- `POST /api/accounts` - Create new account entry
- `GET /api/accounts/stats` - Account statistics

### SMS
- `GET /api/sms` - Get all SMS logs
- `POST /api/sms/send` - Send SMS
- `GET /api/sms/stats` - SMS statistics

### AI Assistant
- `POST /api/ai/chat` - AI chat for dashboard queries
- `GET /api/ai/insights` - AI insights for dashboard

## Default Users

After seeding the database, the following test users are available:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@insurify.com | admin123 |
| Marketer | sarah@insurify.com | marketer123 |
| Sales Agent | mike@insurify.com | agent123 |
| Accountant | lisa@insurify.com | accountant123 |

## Environment Variables

### Backend (.env)
```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=insurance
DB_USER=Admin
DB_PASSWORD=Admin

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=5000

# Google Gemini AI
GEMINI_API_KEY=your_gemini_api_key_here

# Twilio SMS Configuration (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### Frontend (.env)
```bash
REACT_APP_API_URL=https://insuranceapi-9r4t.onrender.com/api
```

## Usage

### Development
```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd ../
npm run dev
```

### Production
```bash
# Build frontend
npm run build

# Start backend
cd backend
npm start
```

### Seed Database
```bash
cd backend
npm run seed
```

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-based Access**: Different permissions for each role
- **Input Validation**: Comprehensive input validation using express-validator
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Security Headers**: Helmet.js for security headers
- **Password Hashing**: bcryptjs for secure password storage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Review the API endpoints

## Screenshots

[Add screenshots here when available]

## Future Features

- Mobile app development
- Advanced reporting and analytics
- Integration with third-party insurance providers
- Document management system
- Customer portal for clients
- Advanced AI-powered insights