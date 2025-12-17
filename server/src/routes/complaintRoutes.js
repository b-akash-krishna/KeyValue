const express = require('express');
const { raiseComplaint, getComplaints, updateComplaintStatus, addComment } = require('../controllers/complaintController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['TENANT']), upload.single('photo'), raiseComplaint);
router.get('/', getComplaints);
router.put('/:id/status', authorizeRole(['ADMIN']), updateComplaintStatus);
router.post('/:id/comments', addComment);

module.exports = router;
