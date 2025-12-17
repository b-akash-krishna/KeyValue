const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const recordPayment = async (req, res) => {
    const { tenantId, amount, monthFor, type, proofUrl } = req.body;

    // If tenant is making request, ensure they are recording for themselves
    if (req.user.role === 'TENANT') {
        // We need to find the tenant profile for this user
        const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId: req.user.userId } });
        if (!tenantProfile) return res.status(404).json({ message: 'Tenant profile not found' });

        // Override tenantId with their own
        // Actually, the body might not even have tenantId if it's the tenant.
        // Let's use the profile id.

        try {
            // Get tenant's room rent
            const tenant = await prisma.tenantProfile.findUnique({
                where: { id: tenantProfile.id },
                include: { room: true }
            });

            const totalRent = tenant?.room?.rentAmount || 0;

            // Calculate existing payments for this month
            const existingPayments = await prisma.payment.findMany({
                where: {
                    tenantId: tenantProfile.id,
                    monthFor,
                    type: type || 'RENT'
                }
            });

            const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0) + parseFloat(amount);
            const balance = totalRent - totalPaid;

            const payment = await prisma.payment.create({
                data: {
                    tenantId: tenantProfile.id,
                    amount: parseFloat(amount),
                    monthFor,
                    type: type || 'RENT',
                    proofUrl,
                    status: 'PENDING',
                    totalRent,
                    balance: balance > 0 ? balance : 0
                }
            });
            return res.status(201).json(payment);
        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Server error' });
        }
    }

    // Admin flow
    try {
        // Get tenant's room rent
        const tenant = await prisma.tenantProfile.findUnique({
            where: { id: tenantId },
            include: { room: true }
        });

        const totalRent = tenant?.room?.rentAmount || 0;

        // Calculate existing payments for this month
        const existingPayments = await prisma.payment.findMany({
            where: {
                tenantId,
                monthFor,
                type: type || 'RENT'
            }
        });

        const totalPaid = existingPayments.reduce((sum, p) => sum + p.amount, 0) + parseFloat(amount);
        const balance = totalRent - totalPaid;

        const payment = await prisma.payment.create({
            data: {
                tenantId,
                amount: parseFloat(amount),
                monthFor,
                type: type || 'RENT',
                status: 'VERIFIED',
                totalRent,
                balance: balance > 0 ? balance : 0
            }
        });
        res.status(201).json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getPayments = async (req, res) => {
    try {
        if (req.user.role === 'TENANT') {
            const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId: req.user.userId } });
            if (!tenantProfile) return res.status(404).json({ message: 'Tenant profile not found' });

            const payments = await prisma.payment.findMany({
                where: { tenantId: tenantProfile.id },
                orderBy: { date: 'desc' }
            });
            return res.json(payments);
        }

        // Admin sees all
        const payments = await prisma.payment.findMany({
            include: {
                tenant: { select: { name: true, room: { select: { number: true } } } }
            },
            orderBy: { date: 'desc' }
        });
        res.json(payments);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const verifyPayment = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // VERIFIED or REJECTED

    try {
        const payment = await prisma.payment.update({
            where: { id },
            data: { status }
        });
        res.json(payment);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const uploadPaymentProof = async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path.replace(/\\/g, '/');

    try {
        const payment = await prisma.payment.update({
            where: { id },
            data: {
                proofUrl: filePath
            }
        });
        res.json({ message: 'Payment proof uploaded successfully', filePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get monthly balance for a tenant
const getMonthlyBalance = async (req, res) => {
    const { tenantId, monthFor } = req.params;

    try {
        const tenant = await prisma.tenantProfile.findUnique({
            where: { id: tenantId },
            include: { room: true }
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const totalRent = tenant.room?.rentAmount || 0;

        const payments = await prisma.payment.findMany({
            where: {
                tenantId,
                monthFor,
                type: 'RENT'
            },
            orderBy: { createdAt: 'asc' }
        });

        const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
        const balance = totalRent - totalPaid;

        res.json({
            monthFor,
            totalRent,
            totalPaid,
            balance: balance > 0 ? balance : 0,
            payments
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Get monthly summary for a tenant (all months)
const getMonthlySummary = async (req, res) => {
    const { tenantId } = req.params;

    try {
        const tenant = await prisma.tenantProfile.findUnique({
            where: { id: tenantId },
            include: { room: true }
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const roomRent = tenant.room?.rentAmount || 0;

        const payments = await prisma.payment.findMany({
            where: {
                tenantId,
                type: 'RENT'
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by month
        const monthlyData = {};
        payments.forEach(payment => {
            if (!monthlyData[payment.monthFor]) {
                monthlyData[payment.monthFor] = {
                    monthFor: payment.monthFor,
                    totalRent: payment.totalRent || roomRent, // Use stored rent if available, else current room rent
                    totalPaid: 0,
                    payments: []
                };
            }
            monthlyData[payment.monthFor].totalPaid += payment.amount;
            monthlyData[payment.monthFor].payments.push(payment);
        });

        // Calculate balances
        const summary = Object.values(monthlyData).map(month => ({
            ...month,
            balance: month.totalRent - month.totalPaid,
            status: (month.totalRent - month.totalPaid) <= 0 ? 'PAID' : (month.totalPaid > 0 ? 'PARTIAL' : 'UNPAID')
        }));

        res.json({ totalRent: roomRent, summary });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { recordPayment, getPayments, verifyPayment, uploadPaymentProof, getMonthlyBalance, getMonthlySummary };
