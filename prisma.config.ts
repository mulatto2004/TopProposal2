// Prisma v7 config — connection URL for migrations and schema push
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // For migrations, Prisma uses this URL directly (not the adapter)
    url: process.env["DATABASE_URL"] ?? "postgresql://postgres:password@localhost:5432/topproposal",
  },
});
