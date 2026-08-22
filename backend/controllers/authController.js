const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// ============================================================
// LOGIN
// ============================================================

const login = async (req, res, next) => {
    try {
        let { phone, password } = req.body;

        // Validate input
        if (!phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'Phone and password are required.'
            });
        }

        phone = String(phone).trim();
        password = String(password).trim();

        console.log('==========================================');
        console.log('[LOGIN] phone:', phone);
        console.log('[LOGIN] password length:', password.length);

        // ========================================================
        // PostgreSQL QUERY
        // ========================================================

        const result = await db.query(
            `SELECT *
             FROM users
             WHERE phone = $1
             LIMIT 1`,
            [phone]
        );

        const rows = result.rows;

        console.log('[LOGIN] users found:', rows.length);

        // User not found
        if (rows.length === 0) {
            console.log('[LOGIN] User not found');

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        const user = rows[0];

        console.log('[LOGIN] user id:', user.id);
        console.log('[LOGIN] user name:', user.name);
        console.log('[LOGIN] role:', user.role);
        console.log(
            '[LOGIN] password hash exists:',
            !!user.password_hash
        );

        // ========================================================
        // CHECK ACCOUNT STATUS
        // ========================================================

        if (!user.is_active) {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive.'
            });
        }

        // ========================================================
        // BCRYPT PASSWORD CHECK
        // ========================================================

        const valid = await bcrypt.compare(
            password,
            user.password_hash
        );

        console.log('[LOGIN] bcrypt result:', valid);

        if (!valid) {
            console.log('[LOGIN] Invalid password');

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }

        // ========================================================
        // CREATE JWT
        // ========================================================

        const token = jwt.sign(
            {
                id: user.id,
                name: user.name,
                phone: user.phone,
                role: user.role
            },
            process.env.JWT_SECRET || 'agriconnect_secret',
            {
                expiresIn: '24h'
            }
        );

        console.log('[LOGIN] Login successful');
        console.log('==========================================');

        // ========================================================
        // RESPONSE
        // ========================================================

        return res.json({
            success: true,
            message: 'Login successful',
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

        console.error('[LOGIN ERROR]', err);

        next(err);
    }
};


// ============================================================
// REGISTER
// ============================================================

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

        // ========================================================
        // VALIDATION
        // ========================================================

        if (!name || !phone || !password) {
            return res.status(400).json({
                success: false,
                message:
                    'Name, phone, and password are required.'
            });
        }

        const cleanPhone = String(phone).trim();
        const cleanPassword = String(password).trim();

        // ========================================================
        // CHECK EXISTING USER
        // ========================================================

        const existingResult = await db.query(
            `SELECT id
             FROM users
             WHERE phone = $1
             LIMIT 1`,
            [cleanPhone]
        );

        const existing = existingResult.rows;

        if (existing.length > 0) {

            return res.status(409).json({
                success: false,
                message:
                    'Phone number already registered.'
            });
        }

        // ========================================================
        // HASH PASSWORD
        // ========================================================

        const hashedPassword =
            await bcrypt.hash(cleanPassword, 10);

        // ========================================================
        // INSERT USER
        // ========================================================

        const insertResult = await db.query(
            `
            INSERT INTO users (
                name,
                phone,
                password_hash,
                role,
                village,
                district,
                aadhar_number,
                bank_account,
                ifsc_code,
                is_active
            )
            VALUES (
                $1,
                $2,
                $3,
                'farmer',
                $4,
                $5,
                $6,
                $7,
                $8,
                TRUE
            )
            RETURNING id
            `,
            [
                name,
                cleanPhone,
                hashedPassword,
                village || null,
                district || null,
                aadhar_number || null,
                bank_account || null,
                ifsc_code || null
            ]
        );

        const userId = insertResult.rows[0].id;

        console.log(
            '[REGISTER] New user created:',
            userId
        );

        return res.status(201).json({
            success: true,
            message: 'Registration successful',
            userId
        });

    } catch (err) {

        console.error('[REGISTER ERROR]', err);

        next(err);
    }
};


// ============================================================
// GET PROFILE
// ============================================================

const getProfile = async (req, res, next) => {

    try {

        const result = await db.query(
            `
            SELECT
                id,
                name,
                phone,
                email,
                role,
                village,
                district,
                state,
                aadhar_number,
                bank_account,
                ifsc_code,
                created_at
            FROM users
            WHERE id = $1
            LIMIT 1
            `,
            [req.user.id]
        );

        const rows = result.rows;

        if (rows.length === 0) {

            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        return res.json({
            success: true,
            user: rows[0]
        });

    } catch (err) {

        console.error(
            '[PROFILE ERROR]',
            err
        );

        next(err);
    }
};


// ============================================================
// EXPORT
// ============================================================

module.exports = {
    login,
    register,
    getProfile
};