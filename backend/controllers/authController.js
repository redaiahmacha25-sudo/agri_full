const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const login = async (req, res, next) => {
  try {
    const { phone, password } = req.body;

    const cleanPhone = String(phone).trim();
    const cleanPassword = String(password).trim();

    // TEMP DEBUG: ensure received password exactly
    console.log('[AUTH_DEBUG] raw password length=', String(password).length, 'clean length=', cleanPassword.length);

    if (!phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Phone and password are required.'
      });
    }

    const [rows] = await db.query(
      'SELECT * FROM users WHERE phone = ? AND is_active = 1',
      [phone]
    );

    if (!rows.length) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    const user = rows[0];

    const valid = await bcrypt.compare(password, user.password_hash);

    // TEMP DEBUG (remove after auth works)
    console.log('[AUTH_DEBUG] login payload phone=', phone);
    console.log('[AUTH_DEBUG] user found id=', user.id, 'role=', user.role);
    console.log('[AUTH_DEBUG] password_hash(first20)=', String(user.password_hash).slice(0,20));
    console.log('[AUTH_DEBUG] password received =', JSON.stringify(password));
    console.log('[AUTH_DEBUG] bcrypt.compare result=', valid);
    
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials.'
      });
    }

    // MISSING BRACKET FIXED HERE

    const token = jwt.sign(
      {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role
      },
      process.env.JWT_SECRET || 'agriconnect_secret',
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '24h'
      }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user.id,
        name: user.name,
        phone: user.phone,
        role: user.role,
        village: user.village,
        district: user.district
      }
    });

  } catch (err) {
    next(err);
  }
};

const register = async (req, res, next) => {
  try {
    const {
      name,
      phone,
      password,
      village,
      district,
      aadhar_number,
      bank_account,
      ifsc_code
    } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and password are required.'
      });
    }

    const [existing] = await db.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (existing.length) {
      return res.status(409).json({
        success: false,
        message: 'Phone number already registered.'
      });
    }

    const hashedpassword = await bcrypt.hash(password, 10);

    const [result] = await db.query(
      `INSERT INTO users 
      (name, phone, password_hash, role, village, district, aadhar_number, bank_account, ifsc_code) 
      VALUES (?, ?, ?, "farmer", ?, ?, ?, ?, ?)`,
      [
        name,
        phone,
        hashedpassword, // FIXED
        village || null,
        district || null,
        aadhar_number || null,
        bank_account || null,
        ifsc_code || null
      ]
    );

    res.status(201).json({ success: true, message: 'Registration successful. Please log in.', id: result.insertId });
  } catch (err) { next(err); }
};

const getProfile = async (req, res, next) => {
  try {
    const [rows] = await db.query( 'SELECT id, name, phone, email, role, village, district, state, aadhar_number, bank_account, ifsc_code, created_at FROM users WHERE id = ?', [req.user.id] );

    if (!rows.length) 
      return res.status(404).json({ success: false,
        message: 'User not found.' });
    

    res.json({
      success: true, user: rows[0] });

  } catch (err) { next(err);}
};

module.exports = {  login, register, getProfile };