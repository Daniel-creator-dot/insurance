const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const OTP = require('../models/OTP');
const { sendSMS } = require('../utils/sms');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Forgot Password - Initiate
router.post('/forgot-password', [
  body('email').isEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email } = req.body;
    const user = await User.findByEmail(email);

    if (!user) {
      // Don't reveal if user exists for security, but user wants to confirm email
      // Actually user said "confirm thier email by then send otp"
      return res.status(404).json({ message: 'User not found' });
    }

    if (!user.phone_number) {
      return res.status(400).json({ message: 'User has no phone number configured. Please contact admin.' });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await OTP.deleteByUser(user.id); // Clear previous OTPs
    await OTP.create(user.id, otp, expiresAt);

    // Send SMS
    const smsResponse = await sendSMS(user.phone_number, `Your Insurify password reset OTP is: ${otp}. Valid for 10 minutes.`);

    if (smsResponse.success) {
      res.json({ message: 'OTP sent successfully', user_id: user.id });
    } else {
      res.status(500).json({ message: 'Failed to send OTP SMS. Please try again later.' });
    }
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify OTP
router.post('/verify-otp', [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user_id, otp } = req.body;
    const validOtp = await OTP.verify(user_id, otp);

    if (validOtp) {
      res.json({ message: 'OTP verified successfully' });
    } else {
      res.status(400).json({ message: 'Invalid or expired OTP' });
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reset Password
router.post('/reset-password', [
  body('user_id').notEmpty().withMessage('User ID is required'),
  body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { user_id, otp, password } = req.body;
    
    // Verify OTP again before reset
    const validOtp = await OTP.verify(user_id, otp);
    if (!validOtp) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    await User.updatePassword(user_id, password);
    await OTP.deleteByUser(user_id); // Clear OTP after use

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register a new user
router.post('/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['SUPER_ADMIN', 'MARKETER', 'SALES_AGENT', 'ACCOUNTANT']).withMessage('Invalid role')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { name, email, password, role, phone_number } = req.body;

    // Check if user already exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email already exists' });
    }

    // Create new user
    const user = await User.create({ name, email, password, role, phone_number });

    // Generate JWT token
    const token = User.generateToken(user);

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// Login user
router.post('/login', [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { email, password } = req.body;

    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isPasswordValid = await User.comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = User.generateToken(user);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Verify token middleware
const verifyToken = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided' });
  }

  try {
    const decoded = User.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Invalid token' });
  }
};

// Get current user profile
router.get('/profile', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone_number: user.phone_number,
      avatar: user.avatar,
      base_salary: user.base_salary,
      commission_rate: user.commission_rate
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user profile
router.put('/profile', verifyToken, [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('avatar').optional().notEmpty().withMessage('Avatar cannot be empty'),
  body('phone_number').optional().notEmpty().withMessage('Phone number cannot be empty')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.email) updates.email = req.body.email;
    if (req.body.avatar) updates.avatar = req.body.avatar;
    if (req.body.phone_number) updates.phone_number = req.body.phone_number;
    if (req.body.base_salary !== undefined) updates.base_salary = req.body.base_salary;
    if (req.body.commission_rate !== undefined) updates.commission_rate = req.body.commission_rate;

    const user = await User.update(req.user.id, updates);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone_number: user.phone_number,
        avatar: user.avatar,
        base_salary: user.base_salary,
        commission_rate: user.commission_rate
      }
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all users (for admin/accounting use)
router.get('/users', verifyToken, async (req, res) => {
  try {
    // Allow SUPER_ADMIN and ACCOUNTANT to access all users
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const users = await User.getAll();
    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user by ID
router.get('/users/:id', verifyToken, async (req, res) => {
  try {
    // Allow SUPER_ADMIN and ACCOUNTANT to access user details
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update user by ID
router.put('/users/:id', verifyToken, async (req, res) => {
  try {
    // Allow SUPER_ADMIN full updates; ACCOUNTANT can update salary fields
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updates = {};
    // Non-accounting fields (only SUPER_ADMIN can change)
    if (req.user.role === 'SUPER_ADMIN') {
      if (req.body.name) updates.name = req.body.name;
      if (req.body.email) updates.email = req.body.email;
      if (req.body.phone_number) updates.phone_number = req.body.phone_number;
      if (req.body.role) updates.role = req.body.role;
      if (req.body.is_active !== undefined) updates.is_active = req.body.is_active;
    }
    // Accounting fields (SUPER_ADMIN and ACCOUNTANT can change)
    if (req.body.base_salary !== undefined) updates.base_salary = req.body.base_salary;
    if (req.body.commission_rate !== undefined) updates.commission_rate = req.body.commission_rate;

    const user = await User.update(req.params.id, updates);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'User updated successfully',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone_number: user.phone_number,
        role: user.role,
        is_active: user.is_active,
        base_salary: user.base_salary,
        commission_rate: user.commission_rate
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Bulk update base salaries / commission rates
router.post('/users/salaries-bulk', verifyToken, async (req, res) => {
  try {
    // Only allow SUPER_ADMIN and ACCOUNTANT
    if (req.user.role !== 'SUPER_ADMIN' && req.user.role !== 'ACCOUNTANT') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { updates } = req.body;
    if (!Array.isArray(updates) || updates.length === 0) {
      return res.status(400).json({ message: 'No updates provided' });
    }

    const results = [];
    for (const item of updates) {
      if (!item.id) continue;
      const payload = {};
      if (item.base_salary !== undefined) payload.base_salary = item.base_salary;
      if (item.commission_rate !== undefined) payload.commission_rate = item.commission_rate;
      if (Object.keys(payload).length === 0) continue;

      const updated = await User.update(item.id, payload);
      results.push(updated);
    }

    res.json({
      message: 'Salaries updated successfully',
      count: results.length,
      users: results
    });
  } catch (error) {
    console.error('Bulk salaries update error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete user by ID
router.delete('/users/:id', verifyToken, async (req, res) => {
  try {
    // Only allow SUPER_ADMIN to delete users
    if (req.user.role !== 'SUPER_ADMIN') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = { router, verifyToken };
