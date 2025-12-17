const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Starting Data Consistency Check ---');

    // 1. Sync Room Occupancy
    console.log('\n1. Syncing Room Occupancy...');
    const rooms = await prisma.room.findMany();

    for (const room of rooms) {
        // Count tenants in this room
        const tenantCount = await prisma.tenantProfile.count({
            where: { roomId: room.id }
        });

        console.log(`Room ${room.number}: Real Count = ${tenantCount}, Stored Count = ${room.currentOccupancy}`);

        if (tenantCount !== room.currentOccupancy) {
            console.log(`   -> Updating Room ${room.number} occupancy to ${tenantCount}`);
            await prisma.room.update({
                where: { id: room.id },
                data: { currentOccupancy: tenantCount }
            });
        }
    }
    console.log('Room occupancy sync complete.');

    // 2. Check Tenant Rent Data
    console.log('\n2. Verifying Tenant Rent Data...');
    const tenants = await prisma.tenantProfile.findMany({
        include: { room: true }
    });

    for (const tenant of tenants) {
        if (tenant.roomId) {
            if (tenant.room) {
                console.log(`Tenant ${tenant.name} (Room ${tenant.room.number}): Rent = $${tenant.room.rentAmount}`);
                if (!tenant.room.rentAmount) {
                    console.error(`   !! WARNING: Room ${tenant.room.number} has NO RENT defined!`);
                }
            } else {
                console.error(`   !! WARNING: Tenant ${tenant.name} has roomId ${tenant.roomId} but ROOM NOT FOUND in DB!`);
            }
        } else {
            console.log(`Tenant ${tenant.name}: No Room Assigned`);
        }
    }

    // 3. Check Payments with missing totalRent
    console.log('\n3. Checking Payments Data...');
    const payments = await prisma.payment.findMany({
        where: { type: 'RENT', totalRent: null },
        include: { tenant: { include: { room: true } } }
    });

    if (payments.length > 0) {
        console.log(`Found ${payments.length} payments with missing totalRent. Backfilling...`);
        for (const payment of payments) {
            const rent = payment.tenant?.room?.rentAmount || 0;
            if (rent > 0) {
                await prisma.payment.update({
                    where: { id: payment.id },
                    data: { totalRent: rent, balance: rent - payment.amount }
                });
                console.log(`   -> Updated Payment ${payment.id} with rent ${rent}`);
            }
        }
    } else {
        console.log('All payments have totalRent set (or specific ones are skipped).');
    }

    console.log('\n--- Consistency Fix Complete ---');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
