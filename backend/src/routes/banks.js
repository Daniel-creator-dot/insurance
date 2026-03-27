const express = require('express');
const Bank = require('../models/Bank');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const banks = await Bank.getAll(limit, offset);
    res.json(banks);
  } catch (err) {
    console.error('Get banks error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const bank = await Bank.findById(req.params.id);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    res.json(bank);
  } catch (err) {
    console.error('Get bank error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, [
  body('name').notEmpty(),
  body('account_number').notEmpty(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const bank = await Bank.create(req.body);
    res.status(201).json({ message: 'Bank created', bank });
  } catch (err) {
    console.error('Create bank error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const bank = await Bank.update(req.params.id, req.body);
    if (!bank) return res.status(404).json({ message: 'Bank not found' });
    res.json({ message: 'Bank updated', bank });
  } catch (err) {
    console.error('Update bank error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Bank.delete(req.params.id);
    res.json({ message: 'Bank deleted' });
  } catch (err) {
    console.error('Delete bank error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
