const express = require('express');
const router = express.Router();
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.post('/', authenticateToken, [
    body('human_id').isInt(),
    body('longitude').isString(),
    body('latitude').isString()
], async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const { human_id, longitude, latitude, timestamp } = req.body;
        const result = await queryAsync(`INSERT INTO space_time (human_id, longitude, latitude, timestamp) VALUES (?, ?, ?, ?)`, [human_id, longitude, latitude, timestamp || null]);
        res.json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticateToken, async (req, res) => {
    try { const rows = await queryAsync(`SELECT * FROM space_time ORDER BY timestamp DESC LIMIT 200`); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; const rows = await queryAsync(`SELECT * FROM space_time WHERE id = ?`, [id]); if (!rows.length) return res.status(404).json({ message: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; const { longitude, latitude, timestamp } = req.body; await queryAsync(`UPDATE space_time SET longitude = COALESCE(?, longitude), latitude = COALESCE(?, latitude), timestamp = COALESCE(?, timestamp) WHERE id = ?`, [longitude, latitude, timestamp, id]); res.json({ message: 'Updated' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; await queryAsync(`DELETE FROM space_time WHERE id = ?`, [id]); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

