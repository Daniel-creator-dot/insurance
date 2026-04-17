const express = require('express');
const { verifyToken } = require('./auth');
const CompanySetting = require('../models/CompanySetting');

const router = express.Router();

// Get company settings
router.get('/', verifyToken, async (req, res) => {
  try {
    const settings = await CompanySetting.get();
    res.json(settings);
  } catch (error) {
    console.error('Get company settings error:', error);
    res.status(500).json({ message: 'Server error while getting company settings' });
  }
});

// Update company settings
router.put('/', verifyToken, async (req, res) => {
  try {
    const updatedSettings = await CompanySetting.update(req.body);
    res.json({
      message: 'Company settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('Update company settings error:', error);
    res.status(500).json({ message: 'Server error while updating company settings' });
  }
});

module.exports = router;
