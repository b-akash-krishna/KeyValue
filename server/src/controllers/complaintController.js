const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const raiseComplaint = async (req, res) => {
    const { title, description, category } = req.body;

    try {
        const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId: req.user.userId } });
        if (!tenantProfile) return res.status(404).json({ message: 'Tenant profile not found' });

        const complaint = await prisma.complaint.create({
            data: {
                tenantId: tenantProfile.id,
                title,
                description,
                category,
                status: 'OPEN'
            }
        });
        res.status(201).json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getComplaints = async (req, res) => {
    try {
        if (req.user.role === 'TENANT') {
            const tenantProfile = await prisma.tenantProfile.findUnique({ where: { userId: req.user.userId } });
            if (!tenantProfile) return res.status(404).json({ message: 'Tenant profile not found' });

            const complaints = await prisma.complaint.findMany({
                where: { tenantId: tenantProfile.id },
                orderBy: { createdAt: 'desc' }
            });
            return res.json(complaints);
        }

        // Admin sees all
        const complaints = await prisma.complaint.findMany({
            include: {
                tenant: { select: { name: true, room: { select: { number: true } } } }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(complaints);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateComplaintStatus = async (req, res) => {
    const { id } = req.params;
    const { status } = req.body; // OPEN, IN_PROGRESS, RESOLVED

    try {
        const complaint = await prisma.complaint.update({
            where: { id },
            data: { status }
        });
        res.json(complaint);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { raiseComplaint, getComplaints, updateComplaintStatus };
