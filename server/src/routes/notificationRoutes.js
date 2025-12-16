const express = require('express');
const { getNotifications, markAsRead, createNotification } = require('../controllers/notificationController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.get('/', getNotifications);
router.put('/:id/read', markAsRead);
router.post('/', authorizeRole(['ADMIN']), createNotification);

module.exports = router;
