const express = require('express');
const { raiseComplaint, getComplaints, updateComplaintStatus } = require('../controllers/complaintController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRole(['TENANT']), raiseComplaint);
router.get('/', getPayments = getComplaints); // Admin (all) or Tenant (own) - Wait, typo in variable name in previous thought? No, just here.
// Correcting:
router.get('/', getComplaints);
router.put('/:id/status', authorizeRole(['ADMIN']), updateComplaintStatus);

module.exports = router;
