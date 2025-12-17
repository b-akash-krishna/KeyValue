const express = require('express');
const router = express.Router();
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const verifyToken = authenticateToken;
const isAdmin = authorizeRole(['ADMIN']);
const {
    getAllRooms,
    getRoomById,
    createRoom,
    updateRoom,
    deleteRoom
} = require('../controllers/roomController');

// All routes are protected
router.use(verifyToken);

// Public read access for authenticated users (tenants need to see rooms too potentially, or at least admin does)
router.get('/', getAllRooms);
router.get('/:id', getRoomById);

// Admin only operations
router.post('/', isAdmin, createRoom);
router.put('/:id', isAdmin, updateRoom);
router.delete('/:id', isAdmin, deleteRoom);

module.exports = router;
