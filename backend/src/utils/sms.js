const axios = require('axios');
const twilio = require('twilio');
const SMSLog = require('../models/SMSLog');
const SMSConfig = require('../models/SMSConfig');

const twilioClient = process.env.TWILIO_ACCOUNT_SID ? 
  twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN) : null;

async function sendSMS(recipient, message) {
  try {
    // Create SMS log entry
    const smsLog = await SMSLog.create({
      recipient,
      message,
      status: 'Pending'
    });

    if (twilioClient && process.env.TWILIO_PHONE_NUMBER) {
      try {
        const twilioMessage = await twilioClient.messages.create({
          body: message,
          from: process.env.TWILIO_PHONE_NUMBER,
          to: recipient
        });
        await SMSLog.updateStatus(smsLog.id, 'Sent');
        return { success: true, message: 'SMS sent via Twilio' };
      } catch (error) {
        console.error('Twilio SMS error:', error);
        await SMSLog.updateStatus(smsLog.id, 'Failed');
        return { success: false, message: 'Twilio SMS failed' };
      }
    } else {
      // Use SMS Notify Ghana
      const activeConfigs = await SMSConfig.getAll();
      const config = activeConfigs.find(c => c.is_active);
      
      if (!config) {
        return { success: false, message: 'No active SMS configuration found' };
      }

      // Format recipient number
      let formattedRecipient = recipient.replace(/\D/g, '');
      if (formattedRecipient.startsWith('0')) {
        formattedRecipient = '233' + formattedRecipient.substring(1);
      } else if (!formattedRecipient.startsWith('233') && formattedRecipient.length === 9) {
        formattedRecipient = '233' + formattedRecipient;
      }

      const smsNotifyUrl = `https://sms.smsnotifygh.com/smsapi?key=${config.api_key}&to=${formattedRecipient}&msg=${encodeURIComponent(message)}&sender_id=${config.sender_id || 'Insurify'}`;

      const response = await axios.get(smsNotifyUrl);

      if (response.data.success === true || response.data.code === '1000' || response.data.code === 1000 || response.data.status === 'success') {
        await SMSLog.updateStatus(smsLog.id, 'Sent');
        return { success: true, message: 'SMS sent via SMS Notify Ghana' };
      } else {
        await SMSLog.updateStatus(smsLog.id, 'Failed');
        return { success: false, message: 'SMS Notify Ghana failed' };
      }
    }
  } catch (error) {
    console.error('Send SMS error:', error);
    return { success: false, message: 'Internal server error during SMS send' };
  }
}

module.exports = { sendSMS };
