const express = require('express');
const { createTenant, getAllTenants, getTenantById, updateTenant, getMe } = require('../controllers/tenantController');
const { authenticateToken, authorizeRole } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes protected
router.use(authenticateToken);

// Admin only routes
router.post('/', authorizeRole(['ADMIN']), createTenant);
router.get('/', authorizeRole(['ADMIN']), getAllTenants);

// Tenant or Admin
router.get('/me', authorizeRole(['TENANT', 'ADMIN']), getMe);

// Admin only (or specific tenant logic, but keeping simple for now)
router.get('/:id', authorizeRole(['ADMIN']), getTenantById);
router.put('/:id', authorizeRole(['ADMIN']), updateTenant);

module.exports = router;
