const express = require('express');
const CommissionRate = require('../models/CommissionRate');

const router = express.Router();

// Get all rates
router.get('/', async (req, res, next) => {
  try {
    const rates = await CommissionRate.getAll();
    res.json(rates);
  } catch (err) {
    next(err);
  }
});

// Create a new rate
router.post('/', async (req, res, next) => {
  try {
    const { class_of_business, agreed_rate } = req.body;
    if (!class_of_business || typeof agreed_rate === 'undefined') {
      return res.status(400).json({ error: 'class_of_business and agreed_rate are required' });
    }
    const rate = await CommissionRate.create({ class_of_business, agreed_rate });
    res.status(201).json(rate);
  } catch (err) {
    next(err);
  }
});

// Update a rate
router.put('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const updates = {};
    if (req.body.class_of_business) updates.class_of_business = req.body.class_of_business;
    if (typeof req.body.agreed_rate !== 'undefined') updates.agreed_rate = req.body.agreed_rate;
    const updated = await CommissionRate.update(id, updates);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// Delete a rate
router.delete('/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    await CommissionRate.delete(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;