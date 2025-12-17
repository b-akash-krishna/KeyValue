const express = require('express');
const { recordPayment, getPayments, verifyPayment, uploadPaymentProof, getMonthlyBalance, getMonthlySummary } = require('../controllers/paymentController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const upload = require('../middleware/upload');

const router = express.Router();

router.use(authenticateToken);

router.post('/', recordPayment); // Admin or Tenant
router.get('/', getPayments); // Admin (all) or Tenant (own)
router.put('/:id/verify', authorizeRole(['ADMIN']), verifyPayment);
router.post('/:id/proof', authorizeRole(['TENANT', 'ADMIN']), upload.single('proof'), uploadPaymentProof);

// Get monthly balance for a tenant
router.get('/balance/:tenantId/:monthFor', authorizeRole(['TENANT', 'ADMIN']), getMonthlyBalance);

// Get monthly summary for a tenant
router.get('/summary/:tenantId', authorizeRole(['TENANT', 'ADMIN']), getMonthlySummary);

module.exports = router;
