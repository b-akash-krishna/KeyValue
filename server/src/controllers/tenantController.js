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

            const finalRoomId = roomId === "" ? null : roomId;

            const profile = await prisma.tenantProfile.create({
                data: {
                    userId: user.id,
                    name,
                    phone,
                    address,
                    roomId: finalRoomId,
                },
            });

            // Update room occupancy if room is assigned
            if (finalRoomId) {
                const room = await prisma.room.findUnique({ where: { id: finalRoomId } });
                if (room) {
                    if (room.currentOccupancy >= room.capacity) {
                        throw new Error('Room is at full capacity');
                    }
                    await prisma.room.update({
                        where: { id: finalRoomId },
                        data: { currentOccupancy: room.currentOccupancy + 1 }
                    });
                }
            }

            return { user, profile };
        });

        res.status(201).json({ message: 'Tenant created successfully', tenant: result });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
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
        // Get current tenant data
        const currentTenant = await prisma.tenantProfile.findUnique({
            where: { id }
        });

        if (!currentTenant) {
            return res.status(404).json({ message: 'Tenant not found' });
        }

        const newRoomId = roomId === "" ? null : roomId;
        const oldRoomId = currentTenant.roomId;

        // Use transaction to ensure consistency
        const updatedTenant = await prisma.$transaction(async (prisma) => {
            // Update tenant profile
            const tenant = await prisma.tenantProfile.update({
                where: { id },
                data: {
                    name,
                    phone,
                    address,
                    roomId: newRoomId,
                    isActive
                }
            });

            // Handle room occupancy changes
            if (oldRoomId !== newRoomId) {
                // Decrement old room occupancy
                if (oldRoomId) {
                    await prisma.room.update({
                        where: { id: oldRoomId },
                        data: { currentOccupancy: { decrement: 1 } }
                    });
                }

                // Increment new room occupancy
                if (newRoomId) {
                    const newRoom = await prisma.room.findUnique({ where: { id: newRoomId } });
                    if (newRoom) {
                        if (newRoom.currentOccupancy >= newRoom.capacity) {
                            throw new Error('New room is at full capacity');
                        }
                        await prisma.room.update({
                            where: { id: newRoomId },
                            data: { currentOccupancy: { increment: 1 } }
                        });
                    }
                }
            }

            return tenant;
        });

        res.json(updatedTenant);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: error.message || 'Server error' });
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

const uploadIdProof = async (req, res) => {
    const { id } = req.params;

    if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
    }

    const filePath = req.file.path.replace(/\\/g, '/'); // Normalize path for Windows

    try {
        const tenant = await prisma.tenantProfile.update({
            where: { id },
            data: {
                idProofUrl: filePath,
                idProofStatus: 'PENDING'
            }
        });
        res.json({ message: 'ID Proof uploaded successfully', filePath });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

const getIdProof = async (req, res) => {
    const { id } = req.params;
    try {
        const tenant = await prisma.tenantProfile.findUnique({
            where: { id },
            select: { idProofUrl: true }
        });

        if (!tenant || !tenant.idProofUrl) {
            return res.status(404).json({ message: 'ID Proof not found' });
        }

        // In a real production app we might generate a signed URL here (S3)
        // For now, we return the static path
        res.json({ url: `/${tenant.idProofUrl}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { createTenant, getAllTenants, getTenantById, updateTenant, getMe, uploadIdProof, getIdProof };
