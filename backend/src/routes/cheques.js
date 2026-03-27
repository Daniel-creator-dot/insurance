const express = require('express');
const Cheque = require('../models/Cheque');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const cheques = await Cheque.getAll(limit, offset);
    res.json(cheques);
  } catch (err) {
    console.error('Get cheques error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const cheque = await Cheque.findById(req.params.id);
    if (!cheque) return res.status(404).json({ message: 'Cheque not found' });
    res.json(cheque);
  } catch (err) {
    console.error('Get cheque error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, [
  body('payee').notEmpty(),
  body('amount').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const cheque = await Cheque.create(req.body);
    res.status(201).json({ message: 'Cheque created', cheque });
  } catch (err) {
    console.error('Create cheque error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const cheque = await Cheque.update(req.params.id, req.body);
    if (!cheque) return res.status(404).json({ message: 'Cheque not found' });
    res.json({ message: 'Cheque updated', cheque });
  } catch (err) {
    console.error('Update cheque error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Cheque.delete(req.params.id);
    res.json({ message: 'Cheque deleted' });
  } catch (err) {
    console.error('Delete cheque error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
