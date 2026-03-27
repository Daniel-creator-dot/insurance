const express = require('express');
const Lead = require('../models/Lead');
const Client = require('../models/Client');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all leads (with pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const leads = await Lead.getAll(limit, offset);
    const count = await Lead.getCount();

    res.json({
      leads,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lead by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }
    res.json(lead);
  } catch (error) {
    console.error('Get lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new lead
router.post('/', verifyToken, [
  body('name').notEmpty().withMessage('Lead name is required'),
  body('email').isEmail().withMessage('Valid email is required'),
  body('phone').optional({ checkFalsy: true }).isMobilePhone().withMessage('Valid phone number is required'),
  body('source').optional().isString().withMessage('Valid source is required'),
  body('status').optional().isIn(['New', 'Contacted', 'Qualified', 'Converted', 'Lost']).withMessage('Invalid status'),
  body('assigned_to').optional({ checkFalsy: true }).isInt().withMessage('Valid assignee ID is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const lead = await Lead.create(req.body);

    // If initial status is "Qualified", create a client
    if (req.body.status === 'Qualified') {
      try {
        const existingClients = await Client.search(lead.email || lead.phone);
        const alreadyExists = existingClients.some(c => c.email === lead.email || c.phone === lead.phone);

        if (!alreadyExists) {
          await Client.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            joined_date: new Date()
          });
          console.log(`Created client from qualified lead (new): ${lead.name}`);
        }
      } catch (clientError) {
        console.error('Error creating client from new lead:', clientError);
      }
    }

    res.status(201).json({
      message: 'Lead created successfully',
      lead
    });
  } catch (error) {
    console.error('Create lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update lead
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const lead = await Lead.update(req.params.id, req.body);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // If status is updated to "Qualified", create a client
    if (req.body.status === 'Qualified') {
      try {
        const existingClients = await Client.search(lead.email || lead.phone);
        const alreadyExists = existingClients.some(c => c.email === lead.email || c.phone === lead.phone);

        if (!alreadyExists) {
          await Client.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            joined_date: new Date()
          });
          console.log(`Created client from qualified lead (update): ${lead.name}`);
        }
      } catch (clientError) {
        console.error('Error creating client from lead update:', clientError);
      }
    }

    res.json({
      message: 'Lead updated successfully',
      lead
    });
  } catch (error) {
    console.error('Update lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete lead
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Lead.delete(req.params.id);
    res.json({ message: 'Lead deleted successfully' });
  } catch (error) {
    console.error('Delete lead error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update lead status
router.patch('/:id/status', verifyToken, [
  body('status').isIn(['New', 'Contacted', 'Qualified', 'Converted', 'Lost']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const lead = await Lead.updateStatus(req.params.id, req.body.status);
    if (!lead) {
      return res.status(404).json({ message: 'Lead not found' });
    }

    // If status is "Qualified", create a client
    if (req.body.status === 'Qualified') {
      try {
        // Check if client already exists
        const existingClients = await Client.search(lead.email || lead.phone);
        const alreadyExists = existingClients.some(c => c.email === lead.email || c.phone === lead.phone);

        if (!alreadyExists) {
          await Client.create({
            name: lead.name,
            email: lead.email,
            phone: lead.phone,
            joined_date: new Date()
          });
          console.log(`Created client from qualified lead: ${lead.name}`);
        }
      } catch (clientError) {
        console.error('Error creating client from lead:', clientError);
        // Don't fail the lead status update if client creation fails
      }
    }

    res.json({
      message: 'Lead status updated successfully',
      lead
    });
  } catch (error) {
    console.error('Update lead status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search leads
router.get('/search/:term', verifyToken, async (req, res) => {
  try {
    const leads = await Lead.search(req.params.term);
    res.json(leads);
  } catch (error) {
    console.error('Search leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get leads by assignee
router.get('/assignee/:assigneeId', verifyToken, async (req, res) => {
  try {
    const leads = await Lead.getByAssignee(req.params.assigneeId);
    res.json(leads);
  } catch (error) {
    console.error('Get assignee leads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lead statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Lead.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get lead stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get lead count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const count = await Lead.getCount();
    res.json({ count });
  } catch (error) {
    console.error('Get lead count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;