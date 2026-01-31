// Prisma 7: connection URL qui (no import da prisma/config per evitare errori di risoluzione in postinstall)
module.exports = {
  schema: "./prisma/schema.prisma",
  datasource: {
    url: process.env.DATABASE_URL || "",
  },
};
