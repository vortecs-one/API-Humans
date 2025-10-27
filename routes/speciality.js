const express = require('express');
const router = express.Router();
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

router.post('/', authenticateToken, [
    body('description').isString().notEmpty()
], async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const { description } = req.body;
        const result = await queryAsync(`INSERT INTO speciality (description) VALUES (?)`, [description]);
        res.json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/', authenticateToken, async (req, res) => {
    try { const rows = await queryAsync(`SELECT * FROM speciality`); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; const rows = await queryAsync(`SELECT * FROM speciality WHERE id = ?`, [id]); if (!rows.length) return res.status(404).json({ message: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; const { description } = req.body; await queryAsync(`UPDATE speciality SET description = COALESCE(?, description) WHERE id = ?`, [description, id]); res.json({ message: 'Updated' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; await queryAsync(`DELETE FROM speciality WHERE id = ?`, [id]); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

