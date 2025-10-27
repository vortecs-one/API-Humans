const express = require('express');
const router = express.Router();
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Create card (note: account_number expected encrypted on client or provide encryption on server)
router.post('/', authenticateToken, [
    body('human_id').isInt(),
    body('account_number').isString().notEmpty()
], async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    try {
        const { human_id, bank, account_type, account_number, expiration_date } = req.body;
        const result = await queryAsync(`INSERT INTO card (human_id, bank, account_type, account_number, expiration_date) VALUES (?, ?, ?, ?, ?)`, [human_id, bank || null, account_type || null, account_number, expiration_date || null]);
        res.json({ id: result.insertId });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// List, get, update, delete
router.get('/', authenticateToken, async (req, res) => {
    try { const rows = await queryAsync(`SELECT id, human_id, bank, account_type, expiration_date, created_at FROM card`); res.json(rows); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; const rows = await queryAsync(`SELECT * FROM card WHERE id = ?`, [id]); if (!rows.length) return res.status(404).json({ message: 'Not found' }); res.json(rows[0]); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; const { bank, account_type, account_number, expiration_date } = req.body; await queryAsync(`UPDATE card SET bank = COALESCE(?, bank), account_type = COALESCE(?, account_type), account_number = COALESCE(?, account_number), expiration_date = COALESCE(?, expiration_date) WHERE id = ?`, [bank, account_type, account_number, expiration_date, id]); res.json({ message: 'Updated' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', authenticateToken, async (req, res) => {
    try { const { id } = req.params; await queryAsync(`DELETE FROM card WHERE id = ?`, [id]); res.json({ message: 'Deleted' }); } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

