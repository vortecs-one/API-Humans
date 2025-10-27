const express = require('express');
const router = express.Router();
const { queryAsync } = require('../db/connection');
const { authenticateToken } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');

// Link human to skill
router.post('/human_skill', authenticateToken, [
    body('human_id').isInt(),
    body('skill_id').isInt()
], async (req, res) => {
    const errors = validationResult(req); if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
    const { human_id, skill_id } = req.body;
    try {
        await queryAsync(`INSERT INTO human_skill (human_id, skill_id) VALUES (?, ?)`, [human_id, skill_id]);
        res.json({ message: 'Linked human -> skill' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Unlink human_skill
router.delete('/human_skill', authenticateToken, [
    body('human_id').isInt(),
    body('skill_id').isInt()
], async (req, res) => {
    const { human_id, skill_id } = req.body;
    try {
        await queryAsync(`DELETE FROM human_skill WHERE human_id = ? AND skill_id = ?`, [human_id, skill_id]);
        res.json({ message: 'Unlinked' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Link skill <-> speciality
router.post('/skill_speciality', authenticateToken, [
    body('skill_id').isInt(),
    body('speciality_id').isInt()
], async (req, res) => {
    const { skill_id, speciality_id } = req.body;
    try {
        await queryAsync(`INSERT INTO skill_speciality (skill_id, speciality_id) VALUES (?, ?)`, [skill_id, speciality_id]);
        res.json({ message: 'Linked skill -> speciality' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Unlink skill_speciality
router.delete('/skill_speciality', authenticateToken, [
    body('skill_id').isInt(),
    body('speciality_id').isInt()
], async (req, res) => {
    const { skill_id, speciality_id } = req.body;
    try {
        await queryAsync(`DELETE FROM skill_speciality WHERE skill_id = ? AND speciality_id = ?`, [skill_id, speciality_id]);
        res.json({ message: 'Unlinked' });
    } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

