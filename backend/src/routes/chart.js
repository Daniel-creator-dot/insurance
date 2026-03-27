const express = require('express');
const ChartOfAccount = require('../models/ChartOfAccount');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    const accounts = await ChartOfAccount.getAll(limit, offset);
    res.json(accounts);
  } catch (err) {
    console.error('Get chart accounts error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const acct = await ChartOfAccount.findById(req.params.id);
    if (!acct) return res.status(404).json({ message: 'Account not found' });
    res.json(acct);
  } catch (err) {
    console.error('Get chart account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, [
  body('code').notEmpty(),
  body('name').notEmpty(),
  body('type').isIn(['asset', 'liability', 'equity', 'revenue', 'expense'])
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const acct = await ChartOfAccount.create(req.body);
    res.status(201).json({ message: 'Chart account created', acct });
  } catch (err) {
    console.error('Create chart account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const acct = await ChartOfAccount.update(req.params.id, req.body);
    if (!acct) return res.status(404).json({ message: 'Account not found' });
    res.json({ message: 'Chart account updated', acct });
  } catch (err) {
    console.error('Update chart account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await ChartOfAccount.delete(req.params.id);
    res.json({ message: 'Chart account deleted' });
  } catch (err) {
    console.error('Delete chart account error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
