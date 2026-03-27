const express = require('express');
const SMSConfig = require('../models/SMSConfig');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all SMS configurations
router.get('/', verifyToken, async (req, res) => {
  try {
    const configs = await SMSConfig.getAll();
    res.json(configs);
  } catch (error) {
    console.error('Get SMS configs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SMS configuration by provider
router.get('/provider/:provider', verifyToken, async (req, res) => {
  try {
    const config = await SMSConfig.findByProvider(req.params.provider);
    if (!config) {
      return res.status(404).json({ message: 'SMS configuration not found for provider' });
    }
    res.json(config);
  } catch (error) {
    console.error('Get SMS config by provider error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active SMS configuration
router.get('/active', verifyToken, async (req, res) => {
  try {
    const config = await SMSConfig.getActiveConfig();
    res.json(config || {});
  } catch (error) {
    console.error('Get active SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SMS configuration by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const config = await SMSConfig.findById(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'SMS configuration not found' });
    }
    res.json(config);
  } catch (error) {
    console.error('Get SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new SMS configuration
router.post('/', verifyToken, [
  body('provider').notEmpty().withMessage('Provider is required'),
  body('apiKey').notEmpty().withMessage('API key is required'),
  body('apiSecret').notEmpty().withMessage('API secret is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const config = await SMSConfig.create({
      provider: req.body.provider,
      apiKey: req.body.apiKey,
      apiSecret: req.body.apiSecret,
      phoneNumber: req.body.phoneNumber,
      senderId: req.body.senderId || '',
      isActive: req.body.isActive || false
    });

    res.status(201).json({
      message: 'SMS configuration created successfully',
      config
    });
  } catch (error) {
    console.error('Create SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update SMS configuration
router.put('/:id', verifyToken, [
  body('provider').notEmpty().withMessage('Provider is required'),
  body('apiKey').notEmpty().withMessage('API key is required'),
  body('apiSecret').notEmpty().withMessage('API secret is required'),
  body('phoneNumber').notEmpty().withMessage('Phone number is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const config = await SMSConfig.update(req.params.id, {
      provider: req.body.provider,
      apiKey: req.body.apiKey,
      apiSecret: req.body.apiSecret,
      phoneNumber: req.body.phoneNumber,
      senderId: req.body.senderId || '',
      isActive: req.body.isActive || false
    });

    if (!config) {
      return res.status(404).json({ message: 'SMS configuration not found' });
    }

    res.json({
      message: 'SMS configuration updated successfully',
      config
    });
  } catch (error) {
    console.error('Update SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Activate SMS configuration
router.patch('/:id/activate', verifyToken, async (req, res) => {
  try {
    const config = await SMSConfig.activateConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'SMS configuration not found' });
    }

    res.json({
      message: 'SMS configuration activated successfully',
      config
    });
  } catch (error) {
    console.error('Activate SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Deactivate SMS configuration
router.patch('/:id/deactivate', verifyToken, async (req, res) => {
  try {
    const config = await SMSConfig.deactivateConfig(req.params.id);
    if (!config) {
      return res.status(404).json({ message: 'SMS configuration not found' });
    }

    res.json({
      message: 'SMS configuration deactivated successfully',
      config
    });
  } catch (error) {
    console.error('Deactivate SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete SMS configuration
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await SMSConfig.delete(req.params.id);
    res.json({ message: 'SMS configuration deleted successfully' });
  } catch (error) {
    console.error('Delete SMS config error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;