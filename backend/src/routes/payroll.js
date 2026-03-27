const express = require('express');
const PayrollRun = require('../models/PayrollRun');
const PayrollEntry = require('../models/PayrollEntry');
const Reconciliation = require('../models/Reconciliation');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');

const router = express.Router();

// Get all payroll runs
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const payrollRuns = await PayrollRun.getAll(limit, offset);
    res.json(payrollRuns);
  } catch (err) {
    console.error('Get payroll runs error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payroll run by ID with entries
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const payrollRun = await PayrollRun.findById(req.params.id);
    if (!payrollRun) return res.status(404).json({ message: 'Payroll run not found' });

    const entries = await PayrollEntry.getByPayrollRun(req.params.id);
    res.json({ ...payrollRun, entries });
  } catch (err) {
    console.error('Get payroll run error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Calculate payroll for a period (preview)
router.post('/calculate', verifyToken, [
  body('period_start').isISO8601(),
  body('period_end').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { period_start, period_end } = req.body;
    const calculation = await PayrollRun.calculatePayroll(period_start, period_end);
    res.json(calculation);
  } catch (err) {
    console.error('Calculate payroll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Process payroll (create actual payroll run and accounting entries)
router.post('/process', verifyToken, [
  body('period_start').isISO8601(),
  body('period_end').isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  try {
    const { period_start, period_end } = req.body;
    const result = await PayrollRun.processPayroll(period_start, period_end, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Process payroll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get payroll entries for a user
router.get('/user/:userId', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const entries = await PayrollEntry.getByUser(req.params.userId, limit, offset);
    res.json(entries);
  } catch (err) {
    console.error('Get user payroll error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update payroll entry (e.g., mark as paid)
router.put('/entry/:id', verifyToken, async (req, res) => {
  try {
    const entry = await PayrollEntry.update(req.params.id, req.body);
    if (!entry) return res.status(404).json({ message: 'Payroll entry not found' });
    res.json({ message: 'Payroll entry updated', entry });
  } catch (err) {
    console.error('Update payroll entry error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reconciliation records for a staff member
router.get('/reconciliation/staff/:staffId', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const reconciliations = await Reconciliation.getByStaff(req.params.staffId, limit, offset);
    res.json(reconciliations);
  } catch (err) {
    console.error('Get staff reconciliation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reconciliation records for a specific month
router.get('/reconciliation/month/:month', verifyToken, async (req, res) => {
  try {
    const reconciliations = await Reconciliation.getByMonth(req.params.month);
    res.json(reconciliations);
  } catch (err) {
    console.error('Get month reconciliation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all reconciliation records
router.get('/reconciliation', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    const reconciliations = await Reconciliation.getAll(limit, offset);
    res.json(reconciliations);
  } catch (err) {
    console.error('Get reconciliation error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get reconciliation record by staff and month
router.get('/reconciliation/:staffId/:month', verifyToken, async (req, res) => {
  try {
    const reconciliation = await Reconciliation.findByStaffAndMonth(req.params.staffId, req.params.month);
    if (!reconciliation) return res.status(404).json({ message: 'Reconciliation record not found' });
    res.json(reconciliation);
  } catch (err) {
    console.error('Get reconciliation record error:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
