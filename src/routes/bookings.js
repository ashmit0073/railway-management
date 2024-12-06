const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { authenticateToken } = require('../middleware/auth');

// Book a seat
router.post('/', authenticateToken, async (req, res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.beginTransaction();
        
        const { train_id } = req.body;
        const user_id = req.user.id;
        
        // Check train exists and has available seats
        const [trainRows] = await connection.query(`
            SELECT 
                t.*,
                t.total_seats - COUNT(b.id) as available_seats
            FROM trains t
            LEFT JOIN bookings b ON t.id = b.train_id
            WHERE t.id = ?
            GROUP BY t.id
        `, [train_id]);
        
        const train = trainRows[0];
        if (!train) {
            await connection.rollback();
            return res.status(404).json({ error: 'Train not found' });
        }
        
        if (train.available_seats <= 0) {
            await connection.rollback();
            return res.status(400).json({ error: 'No seats available' });
        }
        
        // Find the next available seat number
        const [seatRows] = await connection.query(`
            SELECT seat_number 
            FROM bookings 
            WHERE train_id = ? 
            ORDER BY seat_number
        `, [train_id]);
        
        const bookedSeats = seatRows.map(row => row.seat_number);
        let seatNumber = 1;
        while (bookedSeats.includes(seatNumber)) {
            seatNumber++;
        }
        
        // Book the seat
        const [bookingResult] = await connection.query(
            'INSERT INTO bookings (user_id, train_id, seat_number) VALUES (?, ?, ?)',
            [user_id, train_id, seatNumber]
        );
        
        await connection.commit();
        
        const [newBooking] = await connection.query(
            'SELECT * FROM bookings WHERE id = ?',
            [bookingResult.insertId]
        );
        
        res.status(201).json(newBooking[0]);
        
    } catch (err) {
        if (connection) {
            await connection.rollback();
        }
        console.error('Booking error:', err);
        res.status(500).json({ error: 'Error booking seat: ' + err.message });
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

// Get specific booking details
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const user_id = req.user.id;
        
        const [rows] = await pool.query(`
            SELECT 
                b.*,
                t.train_number,
                t.train_name,
                t.source,
                t.destination
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.id = ? AND b.user_id = ?
        `, [id, user_id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Booking not found' });
        }
        
        res.json(rows[0]);
    } catch (err) {
        console.error('Error fetching booking:', err);
        res.status(500).json({ error: 'Error fetching booking details: ' + err.message });
    }
});

// Get all bookings for a user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const user_id = req.user.id;
        
        const [rows] = await pool.query(`
            SELECT 
                b.*,
                t.train_number,
                t.train_name,
                t.source,
                t.destination
            FROM bookings b
            JOIN trains t ON b.train_id = t.id
            WHERE b.user_id = ?
            ORDER BY b.booking_date DESC
        `, [user_id]);
        
        res.json(rows);
    } catch (err) {
        console.error('Error fetching bookings:', err);
        res.status(500).json({ error: 'Error fetching bookings: ' + err.message });
    }
});

module.exports = router;