const { query } = require('../config/database');

class OTP {
  static async create(userId, otp, expiresAt) {
    const result = await query(
      'INSERT INTO otps (user_id, otp, expires_at) VALUES ($1, $2, $3) RETURNING *',
      [userId, otp, expiresAt]
    );
    return result.rows[0];
  }

  static async findLatestByUser(userId) {
    const result = await query(
      'SELECT * FROM otps WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0];
  }

  static async verify(userId, otp) {
    const result = await query(
      'SELECT * FROM otps WHERE user_id = $1 AND otp = $2 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
      [userId, otp]
    );
    return result.rows[0];
  }

  static async deleteByUser(userId) {
    await query('DELETE FROM otps WHERE user_id = $1', [userId]);
  }
}

module.exports = OTP;
