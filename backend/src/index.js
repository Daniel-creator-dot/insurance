const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

// Import routes
const { router: authRoutes, verifyToken } = require('./routes/auth');
const policyRoutes = require('./routes/policies');
const clientRoutes = require('./routes/clients');
const leadRoutes = require('./routes/leads');
const accountRoutes = require('./routes/accounts');
const smsRoutes = require('./routes/sms');
const dashboardRoutes = require('./routes/dashboard');
const smsConfigRoutes = require('./routes/sms-config');
const aiRoutes = require('./routes/ai');
const testRoutes = require('./routes/test');
const commissionRatesRoutes = require('./routes/commission-rates');
const insuranceProductRoutes = require('./routes/insurance-products');
// new accounting submodule routes
const journalRoutes = require('./routes/journal');
const chartRoutes = require('./routes/chart');
const chequesRoutes = require('./routes/cheques');
const paymentVoucherRoutes = require('./routes/payment-vouchers');
const banksRoutes = require('./routes/banks');
const payrollRoutes = require('./routes/payroll');

const { initDB } = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.twilio.com"],
      fontSrc: ["'self'", "https://fonts.googleapis.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://insurance-rwgr.onrender.com', 'http://localhost:3000']
    : ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:3002', 'http://127.0.0.1:3002'],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs (increased for development)
  message: {
    error: 'Too many requests from this IP, please try again later.'
  }
});

app.use('/api/', limiter);

// Logging
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Initialize database
initDB().then(() => {
  const ChartOfAccount = require('./models/ChartOfAccount');
  ChartOfAccount.seedStandardAccounts().catch(console.error);
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/policies', verifyToken, policyRoutes);
app.use('/api/clients', verifyToken, clientRoutes);
app.use('/api/leads', verifyToken, leadRoutes);
app.use('/api/accounts', verifyToken, accountRoutes);
app.use('/api/sms', verifyToken, smsRoutes);
app.use('/api/sms-config', verifyToken, smsConfigRoutes);
app.use('/api/dashboard', verifyToken, dashboardRoutes);
app.use('/api/ai', verifyToken, aiRoutes);
app.use('/api/commission-rates', verifyToken, commissionRatesRoutes);
app.use('/api/insurance-products', verifyToken, insuranceProductRoutes);

// accounting submodule endpoints
app.use('/api/journal', verifyToken, journalRoutes);
app.use('/api/chart', verifyToken, chartRoutes);
app.use('/api/cheques', verifyToken, chequesRoutes);
app.use('/api/payment-vouchers', verifyToken, paymentVoucherRoutes);
app.use('/api/banks', verifyToken, banksRoutes);
app.use('/api/payroll', verifyToken, payrollRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Insurify Broker Systems API',
    version: '1.0.0',
    documentation: '/api/docs',
    health: '/api/health'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', {
    status: err.status || 500,
    message: err.message,
    path: req.path,
    method: req.method,
    stack: err.stack
  });

  // Database connection errors
  if (err.code === 'ECONNREFUSED' || err.code === 'PROTOCOL_CONNECTION_LOST') {
    return res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection lost. Please try again.',
      code: 'DB_CONNECTION_LOST'
    });
  }

  // Query timeout
  if (err.code === '57P03') {
    return res.status(504).json({
      error: 'Gateway Timeout',
      message: 'Database query timed out. Please try again.',
      code: 'DB_TIMEOUT'
    });
  }

  res.status(err.status || 500).json({
    error: err.error || 'Internal Server Error',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 Database: ${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 5432}/${process.env.DB_NAME || 'insurance'}`);
});

// Graceful shutdown
const { pool } = require('./config/database');

const gracefulShutdown = (signal) => {
  console.log(`\n⚠️  ${signal} received. Gracefully shutting down...`);

  server.close(async () => {
    console.log('✋ HTTP server closed');

    try {
      // Close database connections
      await pool.end();
      console.log('✋ Database connections closed');
    } catch (err) {
      console.error('Error closing database:', err);
    }

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
});