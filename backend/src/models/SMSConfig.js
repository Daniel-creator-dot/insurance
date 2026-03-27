const { query } = require('../config/database');

class SMSConfig {
  static async create(configData) {
    const { provider, apiKey, apiSecret, phoneNumber, senderId, isActive } = configData;
    
    const result = await query(
      `INSERT INTO sms_configs (provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at) 
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) 
       RETURNING id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at`,
      [provider, apiKey, apiSecret, phoneNumber, senderId, isActive || false]
    );
    
    return result.rows[0];
  }

  static async update(id, configData) {
    const { provider, apiKey, apiSecret, phoneNumber, senderId, isActive } = configData;
    
    const result = await query(
      `UPDATE sms_configs 
       SET provider = $1, api_key = $2, api_secret = $3, phone_number = $4, sender_id = $5, is_active = $6, updated_at = NOW() 
       WHERE id = $7 
       RETURNING id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at`,
      [provider, apiKey, apiSecret, phoneNumber, senderId, isActive, id]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at FROM sms_configs WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByProvider(provider) {
    const result = await query(
      'SELECT id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at FROM sms_configs WHERE provider = $1',
      [provider]
    );
    return result.rows[0];
  }

  static async getActiveConfig() {
    const result = await query(
      'SELECT id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at FROM sms_configs WHERE is_active = true ORDER BY updated_at DESC LIMIT 1',
      []
    );
    return result.rows[0];
  }

  static async getAll() {
    const result = await query(
      'SELECT id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at FROM sms_configs ORDER BY updated_at DESC',
      []
    );
    return result.rows;
  }

  static async delete(id) {
    await query('DELETE FROM sms_configs WHERE id = $1', [id]);
  }

  static async activateConfig(id) {
    // Deactivate all configs first
    await query('UPDATE sms_configs SET is_active = false');
    // Activate the specified config
    const result = await query(
      `UPDATE sms_configs SET is_active = true, updated_at = NOW() WHERE id = $1 
       RETURNING id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at`,
      [id]
    );
    return result.rows[0];
  }

  static async deactivateConfig(id) {
    const result = await query(
      `UPDATE sms_configs SET is_active = false, updated_at = NOW() WHERE id = $1 
       RETURNING id, provider, api_key, api_secret, phone_number, sender_id, is_active, created_at, updated_at`,
      [id]
    );
    return result.rows[0];
  }
}

module.exports = SMSConfig;