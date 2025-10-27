const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const fs = require('fs');
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { uploadFacial } = require('../middleware/upload');
const { body, validationResult } = require('express-validator');

// Create facial_recognition - accepts either uploaded image or facial_data_hash in body
router.post('/', authenticateToken, uploadFacial.single('face'), [
    body('human_id').isInt().withMessage('human_id required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    try {
        const { human_id, facial_data_hash } = req.body;
        let hash = facial_data_hash || null;

        if (req.file) {
            const buffer = fs.readFileSync(req.file.path);
            hash = crypto.createHash('sha256').update(buffer).digest('hex');
            // keep file for audits / debugging; accessible under /facial
        }

        if (!hash) return res.status(400).json({ error: 'No facial_data_hash provided or file uploaded' });

        const sql = `INSERT INTO facial_recognition (human_id, facial_data_hash, facial_validation) VALUES (?, ?, 0)`;
        const result = await queryAsync(sql, [human_id, hash]);
        res.json({ id: result.insertId, facial_hash: hash, file: req.file ? `/facial/${req.file.filename}` : null });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// List
router.get('/', authenticateToken, async (req, res) => {
    try {
        const rows = await queryAsync(`SELECT * FROM facial_recognition`);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get by id
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await queryAsync(`SELECT * FROM facial_recognition WHERE id = ?`, [id]);
        if (!rows.length) return res.status(404).json({ message: 'Not found' });
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Update validation flag
router.put('/:id/validate', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { facial_validation } = req.body;
        const result = await queryAsync(`UPDATE facial_recognition SET facial_validation = ? WHERE id = ?`, [facial_validation ? 1 : 0, id]);
        res.json({ message: 'Updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Delete
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        await queryAsync(`DELETE FROM facial_recognition WHERE id = ?`, [id]);
        res.json({ message: 'deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;

