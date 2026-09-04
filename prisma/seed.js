const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial configuration...');

  await prisma.adminSetting.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      adminPassword: 'admin@drshafali2026',
      workingDays: JSON.stringify(['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT']),
      morningStart: '10:00',
      morningEnd: '13:00',
      eveningStart: '17:00',
      eveningEnd: '20:00',
      slotDurationMin: 5,
      bufferTimeMin: 2,
      consultationFee: 21,
      doctorEmail: 'drshafali.official@gmail.com',
      doctorPhone: '+919540329351',
      autoGenerateMeet: true,
    },
  });

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
