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
            const payment = await prisma.payment.create({
                data: {
                    tenantId: tenantProfile.id,
                    amount: parseFloat(amount),
                    monthFor,
                    type: type || 'RENT',
                    proofUrl,
                    status: 'PENDING'
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
        // Validation: If type is RENT, tenantId is required
        if ((!type || type === 'RENT') && !tenantId) {
            return res.status(400).json({ message: 'Tenant ID is required for Rent payments' });
        }

        const payment = await prisma.payment.create({
            data: {
                tenantId: tenantId || null,
                amount: parseFloat(amount),
                monthFor,
                type: type || 'RENT',
                status: 'VERIFIED' // Admin recorded payments are verified by default
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

module.exports = { recordPayment, getPayments, verifyPayment };
