import prisma from '../api/config/database';

async function main() {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      employeeCode: true,
      fullName: true,
      role: true,
      status: true,
    },
    take: 20,
  });
  console.log('EXISTING USERS IN DATABASE:');
  console.log(JSON.stringify(users, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(() => {
    prisma.$disconnect();
  });
