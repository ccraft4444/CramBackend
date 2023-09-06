const prisma = require("./prisma");

const { users, orders, study_sets } = require("./seedData");

const seedDb = async () => {
  console.log("creating users...");
  await Promise.all(
    users.map(async (user) => {
      return prisma.users.create({
        data: user,
      });
    })
  );

  console.log("creating orders...");
  await Promise.all(
    orders.map(async (order) => {
      return prisma.orders.create({
        data: order,
      });
    })
  );

  console.log("creating StudySets...");
  await Promise.all(
    study_sets.map(async (study_set) => {
      return prisma.Study_Set.create({
        data: study_set,
      });
    })
  );
};

const initDb = async () => {
  try {
    await seedDb();
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
};
initDb();
