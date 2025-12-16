const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const createTenant = async (req, res) => {
    const { email, password, name, phone, address, roomId, rentAmount } = req.body;

    try {
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        // Transaction to ensure both User and Profile are created
        const result = await prisma.$transaction(async (prisma) => {
            const user = await prisma.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    role: 'TENANT',
                },
            });

            const profile = await prisma.tenantProfile.create({
                data: {
                    userId: user.id,
                    name,
                    phone,
                    address,
                    roomId, // Optional: Link to a room if provided
                },
            });

            return { user, profile };
        });

        res.status(201).json({ message: 'Tenant created successfully', tenant: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getAllTenants = async (req, res) => {
    try {
        const tenants = await prisma.tenantProfile.findMany({
            include: {
                user: {
                    select: { email: true, role: true }
                },
                room: true
            }
        });
        res.json(tenants);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getTenantById = async (req, res) => {
    const { id } = req.params;
    try {
        const tenant = await prisma.tenantProfile.findUnique({
            where: { id },
            include: {
                user: { select: { email: true } },
                room: true,
                payments: true,
                complaints: true
            }
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }
        res.json(tenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const updateTenant = async (req, res) => {
    const { id } = req.params;
    const { name, phone, address, roomId, isActive } = req.body;

    try {
        const updatedTenant = await prisma.tenantProfile.update({
            where: { id },
            data: {
                name,
                phone,
                address,
                roomId,
                isActive
            }
        });
        res.json(updatedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getMe = async (req, res) => {
    try {
        const tenant = await prisma.tenantProfile.findUnique({
            where: { userId: req.user.userId },
            include: {
                user: { select: { email: true } },
                room: true,
                payments: true,
                complaints: true
            }
        });

        if (!tenant) {
            return res.status(404).json({ message: 'Tenant profile not found' });
        }
        res.json(tenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createTenant, getAllTenants, getTenantById, updateTenant, getMe };
