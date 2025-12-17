const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all rooms
exports.getAllRooms = async (req, res) => {
    try {
        const rooms = await prisma.room.findMany({
            include: {
                tenants: {
                    select: {
                        id: true,
                        name: true
                    }
                }
            },
            orderBy: {
                number: 'asc'
            }
        });
        res.json(rooms);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching rooms', error: error.message });
    }
};

// Get single room
exports.getRoomById = async (req, res) => {
    try {
        const { id } = req.params;
        const room = await prisma.room.findUnique({
            where: { id },
            include: {
                tenants: true
            }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching room', error: error.message });
    }
};

// Create new room
exports.createRoom = async (req, res) => {
    try {
        const { number, capacity, rentAmount } = req.body;

        // Check if room number already exists
        const existingRoom = await prisma.room.findUnique({
            where: { number }
        });

        if (existingRoom) {
            return res.status(400).json({ message: 'Room number already exists' });
        }

        const room = await prisma.room.create({
            data: {
                number,
                capacity: parseInt(capacity),
                rentAmount: parseFloat(rentAmount),
                currentOccupancy: 0 // Initialize with 0
            }
        });

        res.status(201).json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error creating room', error: error.message });
    }
};

// Update room
exports.updateRoom = async (req, res) => {
    try {
        const { id } = req.params;
        const { number, capacity, rentAmount } = req.body;

        // Check if updating number and if it conflicts
        if (number) {
            const existingRoom = await prisma.room.findUnique({
                where: { number }
            });
            if (existingRoom && existingRoom.id !== id) {
                return res.status(400).json({ message: 'Room number already exists' });
            }
        }

        // Validate capacity against current occupancy
        const currentRoom = await prisma.room.findUnique({
            where: { id },
            select: { currentOccupancy: true }
        });

        if (capacity && parseInt(capacity) < currentRoom.currentOccupancy) {
            return res.status(400).json({ message: 'Capacity cannot be less than current occupancy' });
        }

        const room = await prisma.room.update({
            where: { id },
            data: {
                number,
                capacity: capacity ? parseInt(capacity) : undefined,
                rentAmount: rentAmount ? parseFloat(rentAmount) : undefined
            }
        });

        res.json(room);
    } catch (error) {
        res.status(500).json({ message: 'Error updating room', error: error.message });
    }
};

// Delete room
exports.deleteRoom = async (req, res) => {
    try {
        const { id } = req.params;

        const room = await prisma.room.findUnique({
            where: { id },
            include: { tenants: true }
        });

        if (!room) {
            return res.status(404).json({ message: 'Room not found' });
        }

        if (room.tenants.length > 0) {
            return res.status(400).json({ message: 'Cannot delete room with assigned tenants' });
        }

        await prisma.room.delete({
            where: { id }
        });

        res.json({ message: 'Room deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting room', error: error.message });
    }
};
