const express = require('express');
const Account = require('../models/Account');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all accounts (with pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const accounts = await Account.getAll(limit, offset);
    const count = await Account.getCount();

    res.json({
      accounts,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get account by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const account = await Account.findById(req.params.id);
    if (!account) {
      return res.status(404).json({ message: 'Account entry not found' });
    }
    res.json(account);
  } catch (error) {
    console.error('Get account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new account entry
router.post('/', verifyToken, [
  body('description').notEmpty().withMessage('Description is required'),
  body('amount').isNumeric().withMessage('Amount is required'),
  body('type').isIn(['income', 'expense']).withMessage('Type must be income or expense'),
  body('category').notEmpty().withMessage('Category is required'),
  body('agent_id').optional().isInt().withMessage('Valid agent ID is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const accountData = {
      ...req.body,
      agent_id: req.body.agent_id || req.user.id
    };

    const account = await Account.create(accountData);
    res.status(201).json({
      message: 'Account entry created successfully',
      account
    });
  } catch (error) {
    console.error('Create account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update account entry
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const account = await Account.update(req.params.id, req.body);
    if (!account) {
      return res.status(404).json({ message: 'Account entry not found' });
    }
    res.json({
      message: 'Account entry updated successfully',
      account
    });
  } catch (error) {
    console.error('Update account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete account entry
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Account.delete(req.params.id);
    res.json({ message: 'Account entry deleted successfully' });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search accounts
router.get('/search/:term', verifyToken, async (req, res) => {
  try {
    const accounts = await Account.search(req.params.term);
    res.json(accounts);
  } catch (error) {
    console.error('Search accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accounts by agent
router.get('/agent/:agentId', verifyToken, async (req, res) => {
  try {
    const accounts = await Account.getByAgent(req.params.agentId);
    res.json(accounts);
  } catch (error) {
    console.error('Get agent accounts error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get accounts by type
router.get('/type/:type', verifyToken, async (req, res) => {
  try {
    const accounts = await Account.getByType(req.params.type);
    res.json(accounts);
  } catch (error) {
    console.error('Get accounts by type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reconciliation (simply latest transactions or filtered by date)
router.get('/reconciliation', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const accounts = await Account.getAll(limit, offset);
    res.json(accounts);
  } catch (error) {
    console.error('Reconciliation error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Profit & loss summary
router.get('/profitloss', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.query;
    let stats;
    if (month && year) {
      stats = await Account.getMonthlyStats(parseInt(month), parseInt(year));
    } else {
      stats = await Account.getStats();
    }
    res.json(stats);
  } catch (error) {
    console.error('Profit/loss error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get account statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Account.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get account stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get monthly statistics
router.get('/stats/monthly/:month/:year', verifyToken, async (req, res) => {
  try {
    const { month, year } = req.params;
    const stats = await Account.getMonthlyStats(parseInt(month), parseInt(year));
    res.json(stats);
  } catch (error) {
    console.error('Get monthly stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get agent statistics
router.get('/stats/agent/:agentId', verifyToken, async (req, res) => {
  try {
    const stats = await Account.getAgentStats(req.params.agentId);
    res.json(stats);
  } catch (error) {
    console.error('Get agent stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get account count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const count = await Account.getCount();
    res.json({ count });
  } catch (error) {
    console.error('Get account count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;