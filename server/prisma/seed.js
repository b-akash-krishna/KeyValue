const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Starting Seed...');

    // 1. Clean Database
    console.log('Cleaning existing data...');
    await prisma.notification.deleteMany();
    await prisma.complaintComment.deleteMany();
    await prisma.complaint.deleteMany();
    await prisma.payment.deleteMany();
    await prisma.tenantProfile.deleteMany();
    await prisma.room.deleteMany();
    await prisma.user.deleteMany();

    // 2. Create Admin
    console.log('Creating Admin...');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            email: 'admin@keyvalue.com',
            password: hashedPassword,
            role: 'ADMIN'
        }
    });

    // 3. Create Rooms
    console.log('Creating Rooms...');
    const roomsData = [
        { number: '101', capacity: 2, rentAmount: 6000 },
        { number: '102', capacity: 2, rentAmount: 6500 },
        { number: '103', capacity: 1, rentAmount: 8500 },
        { number: '201', capacity: 3, rentAmount: 5000 },
        { number: '202', capacity: 2, rentAmount: 6000 },
        { number: '301', capacity: 4, rentAmount: 4500 },
    ];

    const rooms = [];
    for (const r of roomsData) {
        const room = await prisma.room.create({ data: r });
        rooms.push(room);
    }

    // 4. Create Tenants
    console.log('Creating Tenants...');
    const tenantPassword = await bcrypt.hash('tenant123', 10);

    // Tenant 1: Active, in Room 101, Paid up
    const user1 = await prisma.user.create({
        data: {
            email: 'tenant@test.com',
            password: tenantPassword,
            role: 'TENANT'
        }
    });

    const tenant1 = await prisma.tenantProfile.create({
        data: {
            userId: user1.id,
            name: 'Alice Johnson',
            phone: '9876543210',
            address: '123 Main St',
            roomId: rooms[0].id, // Room 101
            joiningDate: new Date('2024-01-01'),
            isActive: true
        }
    });

    // Update Room 101 Occupancy
    await prisma.room.update({
        where: { id: rooms[0].id },
        data: { currentOccupancy: 1 }
    });

    // Tenant 2: Active, in Room 201, Pending Dues
    const user2 = await prisma.user.create({
        data: {
            email: 'bob@test.com',
            password: tenantPassword,
            role: 'TENANT'
        }
    });

    const tenant2 = await prisma.tenantProfile.create({
        data: {
            userId: user2.id,
            name: 'Bob Smith',
            phone: '8765432109',
            address: '456 Oak Ave',
            roomId: rooms[3].id, // Room 201
            joiningDate: new Date('2024-02-15'),
            isActive: true
        }
    });

    // Update Room 201 Occupancy
    await prisma.room.update({
        where: { id: rooms[3].id },
        data: { currentOccupancy: 1 }
    });

    // 5. Create Payments
    console.log('Creating Payments...');

    // Tenant 1 Payments
    await prisma.payment.create({
        data: {
            tenantId: tenant1.id,
            amount: 6000,
            type: 'RENT',
            monthFor: 'December 2024',
            status: 'VERIFIED', // Paid full
            totalRent: 6000,
            balance: 0,
            date: new Date()
        }
    });

    // Tenant 2 Payments (Partial)
    await prisma.payment.create({
        data: {
            tenantId: tenant2.id,
            amount: 2000,
            type: 'RENT',
            monthFor: 'December 2024',
            status: 'verif', // Typo simulated? No, let's reflect status enum: VERIFIED
            status: 'VERIFIED',
            totalRent: 5000,
            balance: 3000, // 5000 - 2000
            date: new Date()
        }
    });

    // 6. Create Complaints
    console.log('Creating Complaints...');

    // Open Complaint
    const c1 = await prisma.complaint.create({
        data: {
            tenantId: tenant1.id,
            title: 'Leaking Tap',
            category: 'PLUMBING',
            description: 'The bathroom tap is dripping constantly.',
            status: 'OPEN'
        }
    });

    // Resolved Complaint with Comments
    const c2 = await prisma.complaint.create({
        data: {
            tenantId: tenant2.id,
            title: 'WiFi Slow',
            category: 'WIFI',
            description: 'Internet speed is very slow in Room 201.',
            status: 'RESOLVED',
            comments: {
                create: [
                    {
                        userId: user2.id, // Bob
                        text: 'It is buffering even on 480p videos.'
                    }
                    // Admin comment would require Admin User ID, which we didn't save. 
                    // Let's just add one from tenant for now or fetch admin.
                ]
            }
        }
    });

    // Add Admin reply
    const adminUser = await prisma.user.findUnique({ where: { email: 'admin@keyvalue.com' } });
    if (adminUser) {
        await prisma.complaintComment.create({
            data: {
                complaintId: c2.id,
                userId: adminUser.id,
                text: 'We have restarted the router. Please check now.'
            }
        });
    }

    console.log('✅ Seed Complete!');
    console.log('Admin: admin@keyvalue.com / admin123');
    console.log('Tenant1: tenant@test.com / tenant123');
    console.log('Tenant2: bob@test.com / tenant123');
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
