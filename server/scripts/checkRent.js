const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Rent Data ---');

    // Check Rooms
    const rooms = await prisma.room.findMany();
    console.log('\nRooms:');
    rooms.forEach(r => console.log(`Room ${r.number}: Rent = ${r.rentPerMonth} (Type: ${typeof r.rentPerMonth})`));

    // Check Tenants
    const tenants = await prisma.tenantProfile.findMany({
        include: { room: true }
    });
    console.log('\nTenants:');
    tenants.forEach(t => {
        console.log(`Tenant ${t.name}: Room = ${t.room?.number || 'None'}, RoomRent = ${t.room?.rentPerMonth}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
