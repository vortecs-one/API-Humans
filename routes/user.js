const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
require('dotenv').config();

// Register a new user (creates human + user record)
router.post('/register', [
    body('email').isEmail(),
    body('password').isLength({ min: 6 }),
    body('name').isString().notEmpty(),
    body('lastname').isString().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, lastname, legal_id, birthdate, gender, unique_id } = req.body;
    try {
        // create human
        const humanSql = `INSERT INTO human (unique_id, legal_id, name, lastname, birthdate, gender) VALUES (?, ?, ?, ?, ?, ?)`;
        const humanRes = await queryAsync(humanSql, [unique_id, legal_id, name, lastname, birthdate || null, gender || null]);
        const humanId = humanRes.insertId;

        // create user
        const salt = bcrypt.genSaltSync(10);
        const hashed = bcrypt.hashSync(password, salt);
        const userSql = `INSERT INTO user (human_id, email, encrypted_password, salt) VALUES (?, ?, ?, ?)`;
        await queryAsync(userSql, [humanId, email, hashed, salt]);

        res.json({ message: 'User registered', human_id: humanId });
    } catch (err) {
        res.status(500).json({ error: 'Error registering user', details: err.message });
    }
});

// Login -> returns JWT
router.post('/login', [
    body('email').isEmail(),
    body('password').exists()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;
    try {
        const sql = `SELECT u.id, u.human_id, u.encrypted_password FROM user u WHERE u.email = ? LIMIT 1`;
        const rows = await queryAsync(sql, [email]);
        if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

        const user = rows[0];
        if (!bcrypt.compareSync(password, user.encrypted_password)) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const payload = { userId: user.id, humanId: user.human_id, email };
        const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '2h' });
        res.json({ token });
    } catch (err) {
        res.status(500).json({ error: 'Login error', details: err.message });
    }
});

// Protected endpoints for user management (list/update/delete)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAsync(`SELECT u.id, u.human_id, u.email, u.created_at FROM user u`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const rows = await queryAsync(`SELECT u.id, u.human_id, u.email, u.created_at FROM user u WHERE u.id = ?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'User not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.put('/:id', authenticateToken, [
    body('email').optional().isEmail()
], async (req, res) => {
    const { id } = req.params;
    const { email, password } = req.body;
    try {
        if (password) {
            const salt = bcrypt.genSaltSync(10);
            const hashed = bcrypt.hashSync(password, salt);
            await queryAsync(`UPDATE user SET encrypted_password = ?, salt = ? WHERE id = ?`, [hashed, salt, id]);
        }
        if (email) {
            await queryAsync(`UPDATE user SET email = ? WHERE id = ?`, [email, id]);
        }
        res.json({ message: 'User updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        await queryAsync(`DELETE FROM user WHERE id = ?`, [id]);
        res.json({ message: 'User deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

