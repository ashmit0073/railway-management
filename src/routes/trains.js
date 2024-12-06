const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken, authenticateAdmin } = require('../middleware/auth');

// Add a new train (Admin only)
router.post('/', authenticateAdmin, async (req, res) => {
    try {
        const { train_number, train_name, source, destination, total_seats } = req.body;
        
        // Validate input
        if (!train_number || !train_name || !source || !destination || !total_seats) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        
        const [result] = await pool.query(
            'INSERT INTO trains (train_number, train_name, source, destination, total_seats) VALUES (?, ?, ?, ?, ?)',
            [train_number, train_name, source, destination, total_seats]
        );
        
        const [newTrain] = await pool.query('SELECT * FROM trains WHERE id = ?', [result.insertId]);
        
        res.status(201).json(newTrain[0]);
    } catch (err) {
        console.error('Error adding train:', err);
        if (err.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Train number already exists' });
        }
        res.status(500).json({ error: 'Error adding train: ' + err.message });
    }
});

// Get trains between source and destination with seat availability
router.get('/search', async (req, res) => {
    try {
        const { source, destination } = req.query;
        
        if (!source || !destination) {
            return res.status(400).json({ error: 'Source and destination are required' });
        }
        
        const [trains] = await pool.query(`
            SELECT 
                t.*,
                t.total_seats - COUNT(b.id) as available_seats
            FROM trains t
            LEFT JOIN bookings b ON t.id = b.train_id
            WHERE LOWER(t.source) = LOWER(?)
            AND LOWER(t.destination) = LOWER(?)
            GROUP BY t.id
        `, [source, destination]);
        
        res.json(trains);
    } catch (err) {
        console.error('Error searching trains:', err);
        res.status(500).json({ error: 'Error searching trains: ' + err.message });
    }
});

module.exports = router;