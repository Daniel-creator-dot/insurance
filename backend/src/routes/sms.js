const express = require('express');
const SMSLog = require('../models/SMSLog');
const SMSTemplate = require('../models/SMSTemplate');
const { verifyToken } = require('./auth');
const { body, validationResult } = require('express-validator');
const twilio = require('twilio');

const router = express.Router();

// Initialize Twilio client (optional)
const twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

// Get all SMS logs (with pagination)
router.get('/', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const smsLogs = await SMSLog.getAll(limit, offset);
    const count = await SMSLog.getCount();

    console.log('SMS logs fetched from database:', smsLogs.length);
    console.log('SMS logs data:', smsLogs);

    res.json({
      sms_logs: smsLogs,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get SMS logs error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SMS log by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const smsLog = await SMSLog.findById(req.params.id);
    if (!smsLog) {
      return res.status(404).json({ message: 'SMS log not found' });
    }
    res.json(smsLog);
  } catch (error) {
    console.error('Get SMS log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SMS logs by client
router.get('/client/:clientId', verifyToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const offset = parseInt(req.query.offset) || 0;
    
    const smsLogs = await SMSLog.getByClient(req.params.clientId, limit, offset);
    const count = await SMSLog.getCountByClient(req.params.clientId);

    console.log('SMS logs fetched from database for client:', req.params.clientId, smsLogs.length);
    console.log('SMS logs data:', smsLogs);

    res.json({
      sms_logs: smsLogs,
      pagination: {
        total: parseInt(count),
        limit,
        offset,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('Get SMS logs by client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send SMS
router.post('/send', verifyToken, [
  body('recipient').isMobilePhone().withMessage('Valid recipient phone number is required'),
  body('message').notEmpty().withMessage('Message content is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { recipient, message, config_id } = req.body;

    console.log('Sending SMS:', { recipient, message, config_id });

    // Create SMS log entry
    const smsLog = await SMSLog.create({
      recipient,
      message,
      status: 'Pending'
    });

    // Send SMS via Twilio (if configured)
    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioMessage = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient
        });

        console.log('Twilio message sent:', twilioMessage.sid);

        // Update SMS log status
        await SMSLog.updateStatus(smsLog.id, 'Sent');
        
        res.status(201).json({
          message: 'SMS sent successfully',
          smsLog: {
            ...smsLog,
            status: 'Sent',
            sent_at: new Date()
          }
        });
      } catch (twilioError) {
        console.error('Twilio error:', twilioError);
        await SMSLog.updateStatus(smsLog.id, 'Failed');
        
        res.status(500).json({
          message: 'SMS sending failed',
          smsLog: {
            ...smsLog,
            status: 'Failed'
          }
        });
      }
    } else {
      // Use SMS Notify Ghana API instead of Twilio
      const axios = require('axios');
      
      try {
        // Get SMS config from database
        const SMSConfig = require('../models/SMSConfig');
        const config = await SMSConfig.findById(config_id);
        
        if (!config) {
          return res.status(400).json({ message: 'SMS configuration not found' });
        }

        // Format recipient number for SMS Notify Ghana (support both 233 and 0 formats)
        let formattedRecipient = recipient.replace(/\D/g, '');
        if (formattedRecipient.startsWith('0')) {
          formattedRecipient = '233' + formattedRecipient.substring(1);
        } else if (!formattedRecipient.startsWith('233') && formattedRecipient.length === 9) {
          formattedRecipient = '233' + formattedRecipient;
        }

        // Prepare SMS Notify Ghana API request using GET format
        const smsNotifyUrl = `https://sms.smsnotifygh.com/smsapi?key=${config.api_key}&to=${formattedRecipient}&msg=${encodeURIComponent(message)}&sender_id=${config.sender_id || 'Insurify'}`;

        console.log('Sending to SMS Notify Ghana:', smsNotifyUrl);

        // Send to SMS Notify Ghana API using GET request
        const response = await axios.get(smsNotifyUrl);

        console.log('SMS Notify Ghana response:', response.data);

        // Check if SMS was sent successfully
        // Success codes for SMS Notify Ghana are 1000 for success, 1002 for partial success
        if (response.data.success === true || response.data.code === '1000' || response.data.code === 1000 || response.data.status === 'success') {
          await SMSLog.updateStatus(smsLog.id, 'Sent');
          
          res.status(201).json({
            message: 'SMS sent successfully',
            smsLog: {
              ...smsLog,
              status: 'Sent',
              sent_at: new Date()
            }
          });
        } else {
          await SMSLog.updateStatus(smsLog.id, 'Failed');
          
          res.status(500).json({
            message: 'SMS sending failed',
            smsLog: {
              ...smsLog,
              status: 'Failed'
            }
          });
        }
      } catch (smsNotifyError) {
        console.error('SMS Notify Ghana error:', smsNotifyError);
        await SMSLog.updateStatus(smsLog.id, 'Failed');
        
        res.status(500).json({
          message: 'SMS sending failed',
          smsLog: {
            ...smsLog,
            status: 'Failed'
          }
        });
      }
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update SMS status
router.patch('/:id/status', verifyToken, [
  body('status').isIn(['Sent', 'Pending', 'Failed']).withMessage('Invalid status')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const smsLog = await SMSLog.updateStatus(req.params.id, req.body.status);
    if (!smsLog) {
      return res.status(404).json({ message: 'SMS log not found' });
    }
    res.json({
      message: 'SMS status updated successfully',
      smsLog
    });
  } catch (error) {
    console.error('Update SMS status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete SMS log
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    await SMSLog.delete(req.params.id);
    res.json({ message: 'SMS log deleted successfully' });
  } catch (error) {
    console.error('Delete SMS log error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SMS statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    const stats = await SMSLog.getStats();
    res.json(stats);
  } catch (error) {
    console.error('Get SMS stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get SMS count
router.get('/count', verifyToken, async (req, res) => {
  try {
    const count = await SMSLog.getCount();
    res.json({ count });
  } catch (error) {
    console.error('Get SMS count error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Template Routes
router.get('/templates/all', verifyToken, async (req, res) => {
  try {
    const templates = await SMSTemplate.getAll();
    res.json(templates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.post('/templates', verifyToken, [
  body('name').notEmpty().withMessage('Template name is required'),
  body('content').notEmpty().withMessage('Template content is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const template = await SMSTemplate.create(req.body);
    res.status(201).json(template);
  } catch (error) {
    console.error('Create template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.put('/templates/:id', verifyToken, [
  body('name').notEmpty().withMessage('Template name is required'),
  body('content').notEmpty().withMessage('Template content is required'),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const template = await SMSTemplate.update(req.params.id, req.body);
    if (!template) {
      return res.status(404).json({ message: 'Template not found' });
    }
    res.json(template);
  } catch (error) {
    console.error('Update template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.delete('/templates/:id', verifyToken, async (req, res) => {
  try {
    await SMSTemplate.delete(req.params.id);
    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;