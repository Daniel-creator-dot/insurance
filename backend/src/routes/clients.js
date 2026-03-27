const express = require('express');
const Client = require('../models/Client');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all clients (with pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const clients = await Client.getAll(limit, offset);
    const count = await Client.getCount();

    res.json({
      clients,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get client by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new client
router.post('/', verifyToken, [
  body('name').notEmpty().withMessage('Client name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Valid phone number is required'),
  body('date_of_birth').optional().isISO8601().withMessage('Valid date of birth is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const client = await Client.create(req.body);
    res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update client
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const client = await Client.update(req.params.id, req.body);
    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }
    res.json({
      message: 'Client updated successfully',
      client
    });
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete client
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Client.delete(req.params.id);
    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search clients
router.get('/search/:term', verifyToken, async (req, res) => {
  try {
    const clients = await Client.search(req.params.term);
    res.json(clients);
  } catch (error) {
    console.error('Search clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get clients by agent
router.get('/agent/:agentId', verifyToken, async (req, res) => {
  try {
    const clients = await Client.getByAgent(req.params.agentId);
    res.json(clients);
  } catch (error) {
    console.error('Get agent clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get client count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const count = await Client.getCount();
    res.json({ count });
  } catch (error) {
    console.error('Get client count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;