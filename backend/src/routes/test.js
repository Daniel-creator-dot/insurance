const express = require('express');
const User = require('../models/User');

const router = express.Router();

// Test endpoint to verify user exists and password works
router.post('/test-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    console.log('Testing login for:', email);
    
    // Find user by email
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('User not found');
      return res.status(401).json({ message: 'Invalid credentials', userFound: false });
    }

    console.log('User found:', user.email);
    console.log('Password hash:', user.password.substring(0, 20) + '...');

    // Check password
    const isPasswordValid = await User.comparePassword(password, user.password);
    console.log('Password valid:', isPasswordValid);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials', passwordValid: false });
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
        role: user.role
      },
      test: true
    });
  } catch (error) {
    console.error('Test login error:', error);
    res.status(500).json({ message: 'Server error during test login', error: error.message });
  }
});

module.exports = router;