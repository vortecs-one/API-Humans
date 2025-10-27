const express = require('express');
const router = express.Router();
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { uploadFile } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

// Create certificate with file upload
router.post('/', authenticateToken, uploadFile.single('file'), [
    body('human_id').isInt().withMessage('human_id is required'),
    body('description').optional().isString()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { human_id, description, issued_at } = req.body;
        const filePath = req.file ? req.file.path : null;
        const sql = `INSERT INTO certificate (human_id, description, file_path, issued_at) VALUES (?, ?, ?, ?)`;
        const result = await queryAsync(sql, [human_id, description || null, filePath, issued_at || null]);
        res.json({ id: result.insertId, file: req.file ? `/files/${req.file.filename}` : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all certificates
router.get('/', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAsync(`SELECT * FROM certificate`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get certificate by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await queryAsync(`SELECT * FROM certificate WHERE id = ?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'Certificate not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update certificate (optionally new file)
router.put('/:id', authenticateToken, uploadFile.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { description, issued_at } = req.body;
        const filePath = req.file ? req.file.path : null;
        const sql = `UPDATE certificate SET description = COALESCE(?, description), file_path = COALESCE(?, file_path), issued_at = COALESCE(?, issued_at) WHERE id = ?`;
        const result = await queryAsync(sql, [description || null, filePath, issued_at || null, id]);
        if (result.affectedRows === 0) return res.status(404).json({ message: 'Certificate not found' });
        res.json({ message: 'Certificate updated', file: req.file ? `/files/${req.file.filename}` : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete certificate
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await queryAsync(`DELETE FROM certificate WHERE id = ?`, [id]);
        res.json({ message: 'Certificate deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

