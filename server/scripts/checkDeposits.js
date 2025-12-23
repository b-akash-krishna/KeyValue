
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkDeposits() {
    const tenants = await prisma.tenantProfile.findMany({
        select: {
            id: true,
            name: true,
            initialDeposit: true,
            depositStatus: true
        }
    });
    console.log(JSON.stringify(tenants, null, 2));
}

checkDeposits()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
