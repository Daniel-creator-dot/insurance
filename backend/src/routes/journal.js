const express = require('express');
const JournalEntry = require('../models/JournalEntry');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// list with pagination
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const entries = await JournalEntry.getAll(limit, offset);
    res.json(entries);
  } catch (err) {
    console.error('Get journal entries error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// get one
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const entry = await JournalEntry.findById(req.params.id);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json(entry);
  } catch (err) {
    console.error('Get journal entry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// create
router.post('/', verifyToken, [
  body('debit_account').notEmpty(),
  body('credit_account').notEmpty(),
  body('amount').isNumeric()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const entry = await JournalEntry.create(req.body);
    res.status(201).json({ message: 'Journal entry created', entry });
  } catch (err) {
    console.error('Create journal entry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// update
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const entry = await JournalEntry.update(req.params.id, req.body);
    if (!entry) return res.status(404).json({ message: 'Entry not found' });
    res.json({ message: 'Journal entry updated', entry });
  } catch (err) {
    console.error('Update journal entry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// delete
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await JournalEntry.delete(req.params.id);
    res.json({ message: 'Journal entry deleted' });
  } catch (err) {
    console.error('Delete journal entry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
