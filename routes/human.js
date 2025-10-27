const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');

// Create human
router.post('/', authenticateToken, [
    body('unique_id').optional().isString(),
    body('name').isString().notEmpty(),
    body('lastname').isString().notEmpty()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { unique_id, legal_id, name, lastname, birthdate, gender } = req.body;
    try {
        const sql = `INSERT INTO human (unique_id, legal_id, name, lastname, birthdate, gender) VALUES (?, ?, ?, ?, ?, ?)`;
        const result = await queryAsync(sql, [unique_id || null, legal_id || null, name, lastname, birthdate || null, gender || null]);
        res.json({ id: result.insertId, message: 'Human created' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all humans (basic)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAsync('SELECT id, unique_id, legal_id, name, lastname, birthdate, gender, created_at, updated_at FROM human');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get human by id with relationships (user, skills, certificates, facial_recognition, cards, space_time)
router.get('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const humanQ = `SELECT id, unique_id, legal_id, name, lastname, birthdate, gender, created_at, updated_at FROM human WHERE id = ?`;
        const [humanRows] = await Promise.all([ queryAsync(humanQ, [id]) ]);
        if (!humanRows.length) return res.status(404).json({ message: 'Human not found' });

        const human = humanRows[0];

        const userQ = `SELECT id, email, created_at FROM user WHERE human_id = ?`;
        const skillsQ = `
            SELECT s.id, s.name, s.description 
            FROM skill s 
            JOIN human_skill hs ON hs.skill_id = s.id
            WHERE hs.human_id = ?`;
        const certificatesQ = `SELECT id, description, file_path, issued_at, created_at FROM certificate WHERE human_id = ?`;
        const facialQ = `SELECT id, facial_data_hash, facial_validation, created_at FROM facial_recognition WHERE human_id = ?`;
        const cardsQ = `SELECT id, bank, account_type, expiration_date, created_at FROM card WHERE human_id = ?`;
        const spacetimeQ = `SELECT id, longitude, latitude, timestamp FROM space_time WHERE human_id = ? ORDER BY timestamp DESC LIMIT 50`;

        const [users, skills, certificates, facials, cards, spacetime] = await Promise.all([
            queryAsync(userQ, [id]),
            queryAsync(skillsQ, [id]),
            queryAsync(certificatesQ, [id]),
            queryAsync(facialQ, [id]),
            queryAsync(cardsQ, [id]),
            queryAsync(spacetimeQ, [id])
        ]);

        human.users = users;
        human.skills = skills;
        human.certificates = certificates;
        human.facial_recognitions = facials;
        human.cards = cards;
        human.space_time = spacetime;

        res.json(human);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update human
router.put('/:id', authenticateToken, [
    body('name').optional().isString(),
    body('lastname').optional().isString()
], async (req, res) => {
    const { id } = req.params;
    const { unique_id, legal_id, name, lastname, birthdate, gender } = req.body;
    try {
        const sql = `UPDATE human SET unique_id = COALESCE(?, unique_id), legal_id = COALESCE(?, legal_id),
            name = COALESCE(?, name), lastname = COALESCE(?, lastname), birthdate = COALESCE(?, birthdate),
            gender = COALESCE(?, gender) WHERE id = ?`;
        const result = await queryAsync(sql, [unique_id, legal_id, name, lastname, birthdate, gender, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Human not found' });
        res.json({ message: 'Human updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete human (cascades should remove related rows)
router.delete('/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    try {
        const result = await queryAsync(`DELETE FROM human WHERE id = ?`, [id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Human not found' });
        res.json({ message: 'Human deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

