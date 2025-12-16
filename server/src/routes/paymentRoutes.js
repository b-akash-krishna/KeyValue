const express = require('express');
const { recordPayment, getPayments, verifyPayment } = require('../controllers/paymentController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticateToken);

router.post('/', recordPayment); // Admin or Tenant
router.get('/', getPayments); // Admin (all) or Tenant (own)
router.put('/:id/verify', authorizeRole(['ADMIN']), verifyPayment);

module.exports = router;
