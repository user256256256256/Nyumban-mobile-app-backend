import prisma from '../prisma-client.js';

export const permanentlyDeleteExpiredUsers = async () => {
  const threshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

  const usersToDelete = await prisma.users.findMany({
    where: {
      is_deleted: true,
      deleted_at: { lte: threshold },
    },
    select: { id: true },
  });

  if (usersToDelete.length === 0) return;

  await prisma.$transaction(
    usersToDelete.map((user) =>
      prisma.users.delete({ where: { id: user.id } })
    )
  );

  console.log(`[${new Date().toISOString()}] ✅ Deleted ${usersToDelete.length} user(s) permanently`);
};
