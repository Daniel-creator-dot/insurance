const { query } = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class User {
  static async create(userData) {
    const { name, email, password, role, phone_number } = userData;
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const result = await query(
      `INSERT INTO users (name, email, password, role, phone_number) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING id, name, email, role, phone_number, created_at`,
      [name, email, hashedPassword, role, phone_number]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await query(
      'SELECT id, name, email, role, phone_number, avatar, is_active, base_salary, commission_rate, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  static generateToken(user) {
    return jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
  }

  static verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
  }

  static async getAll() {
    const result = await query(
      'SELECT id, name, email, role, phone_number, avatar, is_active, base_salary, commission_rate, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async update(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    Object.keys(updates).forEach(key => {
      // Only include fields that exist in the database
      if (['name', 'email', 'role', 'phone_number', 'avatar', 'is_active', 'base_salary', 'commission_rate'].includes(key)) {
        fields.push(`${key} = $${paramCount}`);
        values.push(updates[key]);
        paramCount++;
      }
    });

    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }

    const result = await query(
      `UPDATE users SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${paramCount} RETURNING id, name, email, role, phone_number, avatar, is_active, base_salary, commission_rate`,
      [...values, id]
    );

    return result.rows[0];
  }

  static async updatePassword(id, newPassword) {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
    
    await query(
      'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
      [hashedPassword, id]
    );
  }

  static async delete(id) {
    await query('DELETE FROM users WHERE id = $1', [id]);
  }
}

module.exports = User;