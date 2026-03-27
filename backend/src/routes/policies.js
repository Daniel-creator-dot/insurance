const express = require('express');
const Policy = require('../models/Policy');
const CommissionRate = require('../models/CommissionRate');
const JournalEntry = require('../models/JournalEntry');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all policies (with pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const policies = await Policy.getAll(limit, offset);
    const count = await Policy.getCount();

    res.json({
      policies,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get policy by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const policy = await Policy.findById(req.params.id);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }
    res.json(policy);
  } catch (error) {
    console.error('Get policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new policy
router.post('/', verifyToken, [
  body('policy_number').notEmpty().withMessage('Policy number is required'),
  body('client_id').isInt().withMessage('Valid client ID is required'),
  body('insurance_type').notEmpty().withMessage('Insurance type is required'),
  body('class_of_business').notEmpty().withMessage('Class of business is required'),
  body('start_date').isISO8601().withMessage('Valid start date is required'),
  body('expiry_date').isISO8601().withMessage('Valid expiry date is required'),
  body('premium').isNumeric().withMessage('Premium amount is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const policyData = {
      ...req.body,
      agent_id: req.user.id
    };

    // server-side commission ceiling enforcement
    if (policyData.class_of_business && typeof policyData.commission_percent === 'number') {
      const rate = await CommissionRate.findByClass(policyData.class_of_business);
      if (rate && policyData.commission_percent > parseFloat(rate.agreed_rate)) {
        return res.status(400).json({ message: `Commission percent cannot exceed ${rate.agreed_rate}% for class ${policyData.class_of_business}` });
      }
    }

    const policy = await Policy.create(policyData);

    // Accounting Integration: If policy is already paid
    if (policyData.date_paid) {
      try {
        await JournalEntry.create({
          description: `Commission for Policy #${policy.policy_number} - ${policy.insurance_type}`,
          debit_account: '1000', // Bank / Cash
          credit_account: '4000', // Commission Revenue
          amount: policy.commission_expected_ghs || 0,
          entry_date: policyData.date_paid
        });
      } catch (accError) {
        console.error('Accounting integration error:', accError);
      }
    }
    res.status(201).json({
      message: 'Policy created successfully',
      policy
    });
  } catch (error) {
    console.error('Create policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update policy
router.put('/:id', verifyToken, async (req, res) => {
  try {
    // enforce commission ceiling on updates as well
    if (req.body.class_of_business && typeof req.body.commission_percent === 'number') {
      const rate = await CommissionRate.findByClass(req.body.class_of_business);
      if (rate && req.body.commission_percent > parseFloat(rate.agreed_rate)) {
        return res.status(400).json({ message: `Commission percent cannot exceed ${rate.agreed_rate}% for class ${req.body.class_of_business}` });
      }
    }

    const oldPolicy = await Policy.findById(req.params.id);
    const policy = await Policy.update(req.params.id, req.body);
    if (!policy) {
      return res.status(404).json({ message: 'Policy not found' });
    }

    // Accounting Integration: If policy marked as paid, create Journal Entry
    if (req.body.date_paid && (!oldPolicy.date_paid || oldPolicy.date_paid !== req.body.date_paid)) {
      try {
        await JournalEntry.create({
          description: `Commission for Policy #${policy.policy_number} - ${policy.insurance_type}`,
          debit_account: '1000', // Bank / Cash
          credit_account: '4000', // Commission Revenue
          amount: policy.commission_expected_ghs || 0,
          entry_date: req.body.date_paid
        });
      } catch (accError) {
        console.error('Accounting integration error:', accError);
        // Don't fail the policy update if accounting fails, but log it
      }
    }
    res.json({
      message: 'Policy updated successfully',
      policy
    });
  } catch (error) {
    console.error('Update policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete policy
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await Policy.delete(req.params.id);
    res.json({ message: 'Policy deleted successfully' });
  } catch (error) {
    console.error('Delete policy error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Search policies
router.get('/search/:term', verifyToken, async (req, res) => {
  try {
    const policies = await Policy.search(req.params.term);
    res.json(policies);
  } catch (error) {
    console.error('Search policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get policies by agent
router.get('/agent/:agentId', verifyToken, async (req, res) => {
  try {
    const policies = await Policy.getByAgent(req.params.agentId);
    res.json(policies);
  } catch (error) {
    console.error('Get agent policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get policies by client
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const policies = await Policy.getByClient(req.params.clientId);
    res.json(policies);
  } catch (error) {
    console.error('Get client policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get expiring policies
router.get('/expiring/:days?', verifyToken, async (req, res) => {
  try {
    const days = parseInt(req.params.days) || 30;
    const policies = await Policy.getExpiringSoon(days);
    res.json(policies);
  } catch (error) {
    console.error('Get expiring policies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get policies by type
router.get('/type/:type', verifyToken, async (req, res) => {
  try {
    const policies = await Policy.getByType(req.params.type);
    res.json(policies);
  } catch (error) {
    console.error('Get policies by type error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get policy statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await Policy.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get policy stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get max commission rate for a class of business
router.get('/commission/max/:classOfBusiness', verifyToken, async (req, res) => {
  try {
    const { classOfBusiness } = req.params;
    const maxRate = await Policy.getMaxCommissionRate(decodeURIComponent(classOfBusiness));
    
    if (!maxRate) {
      return res.status(404).json({ message: `No commission rate found for ${classOfBusiness}` });
    }
    
    res.json({
      class_of_business: classOfBusiness,
      max_commission_rate: maxRate
    });
  } catch (error) {
    console.error('Get max commission rate error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;