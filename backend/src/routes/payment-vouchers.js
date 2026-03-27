const express = require('express');
const PaymentVoucher = require('../models/PaymentVoucher');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const vouchers = await PaymentVoucher.getAll(limit, offset);
    res.json(vouchers);
  } catch (err) {
    console.error('Get payment vouchers error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/:id', verifyToken, async (req, res) => {
  try {
    const voucher = await PaymentVoucher.findById(req.params.id);
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    console.error('Get voucher error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', verifyToken, [
  body('amount').isNumeric(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  try {
    const voucher = await PaymentVoucher.create(req.body);
    res.status(201).json({ message: 'Voucher created', voucher });
  } catch (err) {
    console.error('Create voucher error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/:id', verifyToken, async (req, res) => {
  try {
    const voucher = await PaymentVoucher.update(req.params.id, req.body);
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    res.json({ message: 'Voucher updated', voucher });
  } catch (err) {
    console.error('Update voucher error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await PaymentVoucher.delete(req.params.id);
    res.json({ message: 'Voucher deleted' });
  } catch (err) {
    console.error('Delete voucher error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
